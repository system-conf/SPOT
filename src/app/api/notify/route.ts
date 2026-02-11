export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { subscriptions, notifications, channels, notificationTemplates } from "@/db/schema";
import { sendPushNotification } from "@/lib/push";
import { renderTemplate, validateTemplateVariables } from "@/lib/templates";
import { validateInput, notificationSchema, templateNotificationSchema } from "@/lib/validations";
import {
    moderateRateLimit,
    handleCORS,
    addCORSHeaders,
    checkIPFilter,
    logSecurityEvent,
    createErrorResponse,
    addSecurityHeaders,
    verifyWebhookSignature,
    extractSignature,
    getSecurityConfig,
} from "@/lib/security";
import { eq, OneOrMany } from "drizzle-orm";
import { cacheTemplates, cacheSubscriptions } from "@/lib/cache";

export async function POST(req: NextRequest) {
    try {
        // ─── CORS Handling ───────────────────────────────────────────
        const corsResponse = handleCORS(req, {
            allowedOrigins: getSecurityConfig().corsAllowedOrigins,
            allowedMethods: getSecurityConfig().corsAllowedMethods,
        });
        if (corsResponse) return corsResponse;

        // ─── IP Filtering ─────────────────────────────────────────────
        const ipCheck = checkIPFilter(req, {
            whitelist: getSecurityConfig().ipWhitelist,
            blacklist: getSecurityConfig().ipBlacklist,
        });
        if (!ipCheck.allowed) {
            logSecurityEvent({
                ip: req.headers.get("x-forwarded-for") || "unknown",
                userAgent: req.headers.get("user-agent") || "unknown",
                method: req.method,
                path: req.nextUrl.pathname,
                event: "IP_BLOCKED",
                details: ipCheck.reason,
            });
            return createErrorResponse(ipCheck.reason || "Access denied", 403);
        }

        // ─── Rate Limiting ───────────────────────────────────────────
        const rateLimitResult = await moderateRateLimit(req);
        if (!rateLimitResult.success) {
            logSecurityEvent({
                ip: req.headers.get("x-forwarded-for") || "unknown",
                userAgent: req.headers.get("user-agent") || "unknown",
                method: req.method,
                path: req.nextUrl.pathname,
                event: "RATE_LIMIT_EXCEEDED",
                details: {
                    limit: rateLimitResult.limit,
                    resetTime: new Date(rateLimitResult.resetTime).toISOString(),
                },
            });

            const response = createErrorResponse(
                "Too many requests. Please try again later.",
                429,
                {
                    resetTime: new Date(rateLimitResult.resetTime).toISOString(),
                }
            );
            response.headers.set("Retry-After", Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString());
            response.headers.set("X-RateLimit-Limit", rateLimitResult.limit.toString());
            response.headers.set("X-RateLimit-Remaining", rateLimitResult.remaining.toString());
            return response;
        }

        // ─── Webhook Signature Verification (Required if WEBHOOK_SECRET is set) ───────────────
        const signature = extractSignature(req);
        if (getSecurityConfig().webhookSecret) {
            if (!signature) {
                logSecurityEvent({
                    ip: req.headers.get("x-forwarded-for") || "unknown",
                    userAgent: req.headers.get("user-agent") || "unknown",
                    method: req.method,
                    path: req.nextUrl.pathname,
                    event: "MISSING_SIGNATURE",
                });
                return createErrorResponse("Webhook signature is required", 401);
            }
            const body = await req.clone().text();
            const isValid = verifyWebhookSignature(body, signature, getSecurityConfig().webhookSecret);
            if (!isValid) {
                logSecurityEvent({
                    ip: req.headers.get("x-forwarded-for") || "unknown",
                    userAgent: req.headers.get("user-agent") || "unknown",
                    method: req.method,
                    path: req.nextUrl.pathname,
                    event: "INVALID_SIGNATURE",
                });
                return createErrorResponse("Invalid webhook signature", 401);
            }
        }

        // ─── Authentication ───────────────────────────────────────────
        const authHeader = req.headers.get("authorization")?.replace("Bearer ", "");

        if (!authHeader) {
            logSecurityEvent({
                ip: req.headers.get("x-forwarded-for") || "unknown",
                userAgent: req.headers.get("user-agent") || "unknown",
                method: req.method,
                path: req.nextUrl.pathname,
                event: "AUTH_MISSING",
            });
            return createErrorResponse("Unauthorized", 401);
        }

        // Auth: Check global API_SECRET first, then channel-specific API key
        let channelId: number | null = null;

        if (authHeader === process.env.API_SECRET) {
            // Global auth — no specific channel
            logSecurityEvent({
                ip: req.headers.get("x-forwarded-for") || "unknown",
                userAgent: req.headers.get("user-agent") || "unknown",
                method: req.method,
                path: req.nextUrl.pathname,
                event: "AUTH_SUCCESS_GLOBAL",
            });
        } else {
            // Try to find a channel with this API key
            const [channel] = await db
                .select()
                .from(channels)
                .where(eq(channels.apiKey, authHeader))
                .limit(1);

            if (!channel || !channel.isActive) {
                logSecurityEvent({
                    ip: req.headers.get("x-forwarded-for") || "unknown",
                    userAgent: req.headers.get("user-agent") || "unknown",
                    method: req.method,
                    path: req.nextUrl.pathname,
                    event: "AUTH_FAILED",
                    details: { apiKey: authHeader.substring(0, 10) + "..." },
                });
                return createErrorResponse("Unauthorized", 401);
            }

            channelId = channel.id;
            logSecurityEvent({
                ip: req.headers.get("x-forwarded-for") || "unknown",
                userAgent: req.headers.get("user-agent") || "unknown",
                method: req.method,
                path: req.nextUrl.pathname,
                event: "AUTH_SUCCESS_CHANNEL",
                details: { channelId, channelName: channel.name },
            });
        }

        // Parse and validate request body
        const requestBody = await req.json();
        
        // Validate based on whether templateId is provided
        let validatedData: any;
        if (requestBody.templateId) {
            const validation = validateInput(templateNotificationSchema, requestBody);
            if (!validation.success) {
                return createErrorResponse(validation.error || "Invalid request data", 400);
            }
            validatedData = validation.data;
        } else {
            const validation = validateInput(notificationSchema, requestBody);
            if (!validation.success) {
                return createErrorResponse(validation.error || "Invalid request data", 400);
            }
            validatedData = validation.data;
        }

        const { templateId, variables, title, body, icon, image, badge, url, actions, requireInteraction } = validatedData;

        // Template handling
        let finalTitle = title;
        let finalBody = body;
        let finalIcon = icon;
        let finalImage = image;
        let finalBadge = badge;
        let finalUrl = url;
        let finalActions = actions;
        let finalRequireInteraction = requireInteraction;

        if (templateId) {
            // Load template with cache
            const [template] = await cacheTemplates(`id:${templateId}`, async () => {
                return await db
                    .select()
                    .from(notificationTemplates)
                    .where(eq(notificationTemplates.id, templateId))
                    .limit(1);
            });

            if (!template || !template.isActive) {
                return createErrorResponse("Template not found or inactive", 404);
            }

            // Validate variables if template requires them
            if (template.variables) {
                const requiredVariables = JSON.parse(template.variables);
                if (variables) {
                    const validation = validateTemplateVariables(variables, requiredVariables);
                    if (!validation.valid) {
                        return createErrorResponse(
                            `Invalid template variables. Missing: ${validation.missing.join(", ")}. Invalid: ${validation.invalid.join(", ")}`,
                            400
                        );
                    }
                } else if (requiredVariables.some((v: any) => v.required)) {
                    return createErrorResponse("Template requires variables", 400);
                }
            }

            // Render template with variables
            finalTitle = renderTemplate(template.title, variables || {});
            finalBody = renderTemplate(template.body, variables || {});
            finalIcon = icon || template.icon;
            finalImage = image || template.image;
            finalBadge = badge || template.badge;
            finalUrl = url || template.url;
            finalActions = actions || (template.actions ? JSON.parse(template.actions) : undefined);
            finalRequireInteraction = requireInteraction !== undefined ? requireInteraction : false;
        }

        if (!finalTitle || !finalBody) {
            return createErrorResponse("Title and body are required", 400);
        }

        // Cache kullanarak tüm aktif abonelikleri getir
        const allSubscriptions = await cacheSubscriptions("all_active", async () => {
            return await db.select().from(subscriptions);
        });

        const results = await Promise.all(
            allSubscriptions.map(async (sub) => {
                try {
                    const result = await sendPushNotification(sub, { title: finalTitle, body: finalBody, icon: finalIcon, image: finalImage, badge: finalBadge, url: finalUrl, actions: finalActions, requireInteraction: finalRequireInteraction });

                    if (result.expired) {
                        try {
                            await db.delete(subscriptions).where(eq(subscriptions.id, sub.id));
                        } catch (dbError) {
                            console.error("DB Deletion Error:", dbError);
                        }
                    }
                    return result;
                } catch (subError: any) {
                    console.error("Subscription Processing Error:", subError);
                    return { success: false, error: subError.message };
                }
            })
        );

        const successes = results.filter((r: any) => r.success).length;
        const status = successes > 0 ? "sent" : "failed";

        try {
            // Log the notification with channel reference
            await db.insert(notifications).values({
                channelId,
                title: finalTitle,
                body: finalBody,
                icon: finalIcon,
                image: finalImage,
                badge: finalBadge,
                url: finalUrl,
                actions: finalActions ? JSON.stringify(finalActions) : null,
                requireInteraction: finalRequireInteraction,
                status,
            });
        } catch (insertError: any) {
            console.error("Notification Logging Error:", insertError);
            // Don't fail the request if logging fails, but log it
        }

        // Create success response with CORS and security headers
        const response = NextResponse.json({
            success: true,
            channel: channelId ? `channel #${channelId}` : "global",
            sentCount: successes,
            totalSubscriptions: allSubscriptions.length,
        });

        return addCORSHeaders(addSecurityHeaders(response), req);

    } catch (error: any) {
        console.error("===== NOTIFY ENDPOINT ERROR =====");
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
        console.error("Full error:", JSON.stringify(error, null, 2));

        // Log error event
        logSecurityEvent({
            ip: req.headers.get("x-forwarded-for") || "unknown",
            userAgent: req.headers.get("user-agent") || "unknown",
            method: req.method,
            path: req.nextUrl.pathname,
            event: "SERVER_ERROR",
            status: 500,
            details: { error: error.message },
        });

        const errorResponse = createErrorResponse(
            "Internal server error",
            500,
            { details: error.message }
        );
        return addCORSHeaders(errorResponse, req);
    }
}
