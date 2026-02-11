export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { notificationTemplates, channels } from "@/db/schema";
import {
    lenientRateLimit,
    handleCORS,
    addCORSHeaders,
    checkIPFilter,
    logSecurityEvent,
    createErrorResponse,
    addSecurityHeaders,
    getSecurityConfig,
} from "@/lib/security";
import { eq } from "drizzle-orm";
import crypto from "crypto";

function generateApiKey(): string {
    return "tpl_" + crypto.randomBytes(16).toString("hex");
}

// GET - List all templates
export async function GET(req: NextRequest) {
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
        const rateLimitResult = await lenientRateLimit(req);
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

        const allTemplates = await db.select().from(notificationTemplates);

        const response = NextResponse.json(allTemplates);
        return addCORSHeaders(addSecurityHeaders(response), req);
    } catch (error: any) {
        logSecurityEvent({
            ip: req.headers.get("x-forwarded-for") || "unknown",
            userAgent: req.headers.get("user-agent") || "unknown",
            method: req.method,
            path: req.nextUrl.pathname,
            event: "SERVER_ERROR",
            status: 500,
            details: { error: error.message },
        });
        const errorResponse = createErrorResponse(error.message, 500);
        return addCORSHeaders(errorResponse, req);
    }
}

// POST - Create a new template
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
        const rateLimitResult = await lenientRateLimit(req);
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

        const { name, channelId, title, body, icon, url, badge, actions, variables, isActive } = await req.json();

        if (!name || !title || !body) {
            return createErrorResponse("Name, title, and body are required", 400);
        }

        const apiKey = generateApiKey();

        // Build values object - only include provided fields
        const insertValues: any = {
            name: name.trim(),
            title: title.trim(),
            body: body.trim(),
            apiKey,
        };

        // Only add optional fields if provided
        if (channelId !== undefined) {
            insertValues.channelId = channelId;
        }
        if (icon !== undefined) {
            insertValues.icon = icon;
        }
        if (url !== undefined) {
            insertValues.url = url;
        }
        if (badge !== undefined) {
            insertValues.badge = badge;
        }
        if (actions !== undefined) {
            insertValues.actions = JSON.stringify(actions);
        }
        if (variables !== undefined) {
            insertValues.variables = JSON.stringify(variables);
        }
        if (isActive !== undefined) {
            insertValues.isActive = isActive;
        }

        await db.insert(notificationTemplates).values(insertValues);

        logSecurityEvent({
            ip: req.headers.get("x-forwarded-for") || "unknown",
            userAgent: req.headers.get("user-agent") || "unknown",
            method: req.method,
            path: req.nextUrl.pathname,
            event: "TEMPLATE_CREATED",
            details: { name, channelId },
        });

        const response = NextResponse.json({ success: true });
        return addCORSHeaders(addSecurityHeaders(response), req);
    } catch (error: any) {
        logSecurityEvent({
            ip: req.headers.get("x-forwarded-for") || "unknown",
            userAgent: req.headers.get("user-agent") || "unknown",
            method: req.method,
            path: req.nextUrl.pathname,
            event: "SERVER_ERROR",
            status: 500,
            details: { error: error.message },
        });
        const errorResponse = createErrorResponse(error.message, 500);
        return addCORSHeaders(errorResponse, req);
    }
}
