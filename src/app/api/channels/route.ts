export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { channels } from "@/db/schema";
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
import { cacheChannels, invalidateChannelsCache } from "@/lib/cache";

function generateApiKey(): string {
    return "spot_" + crypto.randomBytes(16).toString("hex");
}

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

// GET — List all channels
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

        // Cache kullanarak kanalları getir
        const allChannels = await cacheChannels("all", async () => {
            return await db.select().from(channels);
        });
        
        const response = NextResponse.json(allChannels);
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

// POST — Create a new channel
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

        const { name, color, icon } = await req.json();

        if (!name || name.trim().length === 0) {
            return createErrorResponse("Channel name is required", 400);
        }

        const slug = slugify(name);
        const apiKey = generateApiKey();

        await db.insert(channels).values({
            name: name.trim(),
            slug,
            apiKey,
            color: color || "#3B82F6",
            icon: icon || "bell",
        });

        // Cache'i geçersiz kıl
        await invalidateChannelsCache();

        logSecurityEvent({
            ip: req.headers.get("x-forwarded-for") || "unknown",
            userAgent: req.headers.get("user-agent") || "unknown",
            method: req.method,
            path: req.nextUrl.pathname,
            event: "CHANNEL_CREATED",
            details: { name, slug },
        });

        const response = NextResponse.json({ success: true, slug, apiKey });
        return addCORSHeaders(addSecurityHeaders(response), req);
    } catch (error: any) {
        if (error.code === "ER_DUP_ENTRY") {
            return createErrorResponse("A channel with this name already exists", 409);
        }
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

// DELETE — Delete a channel by ID
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
        await db.delete(channels).where(eq(channels.id, id));

        // Cache'i geçersiz kıl
        await invalidateChannelsCache();

        logSecurityEvent({
            ip: req.headers.get("x-forwarded-for") || "unknown",
            userAgent: req.headers.get("user-agent") || "unknown",
            method: req.method,
            path: req.nextUrl.pathname,
            event: "CHANNEL_DELETED",
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
