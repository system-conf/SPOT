export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import {
    handleCORS,
    addCORSHeaders,
    checkIPFilter,
    logSecurityEvent,
    createErrorResponse,
    addSecurityHeaders,
    getSecurityConfig,
} from "@/lib/security";

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

        const response = NextResponse.json({
            vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.substring(0, 10) + "...",
            vapidPrivateKey: process.env.VAPID_PRIVATE_KEY ? "✅ Set" : "❌ Missing",
            vapidEmail: process.env.VAPID_EMAIL || "❌ Missing",
            apiSecret: process.env.API_SECRET ? "✅ Set" : "❌ Missing",
            cronSecret: process.env.CRON_SECRET ? "✅ Set" : "❌ Missing",
            webhookSecret: process.env.WEBHOOK_SECRET ? "✅ Set" : "❌ Missing",
        });
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
