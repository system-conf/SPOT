export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
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
import { eq, desc } from "drizzle-orm";

// GET - List all subscriptions
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

        const allSubscriptions = await db.select().from(subscriptions).orderBy(desc(subscriptions.createdAt));

        const response = NextResponse.json(allSubscriptions);
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

// DELETE - Delete a subscription
export async function DELETE(req: NextRequest) {
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

        const { id } = await req.json();

        if (!id) {
            return createErrorResponse("Subscription ID is required", 400);
        }

        await db.delete(subscriptions).where(eq(subscriptions.id, id));

        logSecurityEvent({
            ip: req.headers.get("x-forwarded-for") || "unknown",
            userAgent: req.headers.get("user-agent") || "unknown",
            method: req.method,
            path: req.nextUrl.pathname,
            event: "SUBSCRIPTION_DELETED",
            details: { id },
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
