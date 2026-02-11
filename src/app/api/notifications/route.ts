export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { notifications, channels } from "@/db/schema";
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
import { eq, sql, count } from "drizzle-orm";
import { calculatePagination, validatePaginationParams, type PaginationOptions, type PaginatedResponse } from "@/lib/pagination";
import { buildNotificationWhereClause, validateFilterParams, type NotificationFilters } from "@/lib/filters";

// Simple order by clause builder
function buildOrderByClause(sortBy: string, sortOrder: "asc" | "desc", table: any): any {
    const column = table[sortBy as keyof typeof table] || table.sentAt;
    return sortOrder === "asc" ? column : sql`${column} DESC`;
}

// GET - List notifications with pagination and filtering
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

        // ─── Parse Query Parameters ──────────────────────────────────
        const { searchParams } = new URL(req.url);
        const paginationParams = validatePaginationParams(Object.fromEntries(searchParams.entries()));
        const filterParams = validateFilterParams(Object.fromEntries(searchParams.entries()));

        // ─── Build Query ───────────────────────────────────────────
        const whereClause = buildNotificationWhereClause(filterParams, notifications);
        const orderByClause = buildOrderByClause(filterParams.sortBy, filterParams.sortOrder, notifications);
        const offset = calculateOffset(paginationParams.page, paginationParams.limit);

        // ─── Execute Query ───────────────────────────────────────────
        const [data] = await db.select()
                .from(notifications)
                .where(whereClause)
                .orderBy(orderByClause)
                .limit(paginationParams.limit)
                .offset(offset);

        // ─── Get Total Count ─────────────────────────────────────
        const [{ total }] = await db.select({ total: count() }).from(notifications).where(whereClause);

        // ─── Get Channel Info ───────────────────────────────────────
        const channelList = await db.select().from(channels);
        const channelMap = new Map(channelList.map((c) => [c.id, c]));

        // ─── Build Response ───────────────────────────────────────────
        const enrichedData = data.map((n) => ({
            ...n,
            channel: n.channelId ? channelMap.get(n.channelId) : null,
        }));

        const pagination = calculatePagination(total, paginationParams.page, paginationParams.limit);

        const response = NextResponse.json({
            data: enrichedData,
            filters: filterParams,
            pagination,
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
