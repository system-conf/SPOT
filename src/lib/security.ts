import { NextRequest, NextResponse } from "next/server";

// ─── Rate Limiting (Redis or In-memory) ───────────────────
interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

interface RateLimitOptions {
    windowMs: number;      // Time window in milliseconds
    maxRequests: number;   // Max requests per window
    skipSuccessfulRequests?: boolean; // Don't count successful requests
}

/**
 * Rate limiting middleware using in-memory store
 * For production, consider using Redis or similar
 */
export function createRateLimit(options: RateLimitOptions) {
    const { windowMs, maxRequests, skipSuccessfulRequests = false } = options;

    return async function rateLimit(req: NextRequest): Promise<{
        success: boolean;
        remaining: number;
        resetTime: number;
        limit: number;
    }> {
        // Get client identifier (IP address)
        const identifier = getClientIdentifier(req);
        const now = Date.now();

        // Clean up expired entries
        for (const [key, entry] of rateLimitStore.entries()) {
            if (now > entry.resetTime) {
                rateLimitStore.delete(key);
            }
        }

        // Get or create rate limit entry
        let entry = rateLimitStore.get(identifier);

        if (!entry || now > entry.resetTime) {
            entry = {
                count: 0,
                resetTime: now + windowMs,
            };
            rateLimitStore.set(identifier, entry);
        }

        // Check if limit exceeded
        const remaining = maxRequests - entry.count - 1;

        if (entry.count >= maxRequests) {
            return {
                success: false,
                remaining: 0,
                resetTime: entry.resetTime,
                limit: maxRequests,
            };
        }

        // Increment counter
        entry.count++;
        rateLimitStore.set(identifier, entry);

        return {
            success: true,
            remaining: Math.max(0, remaining),
            resetTime: entry.resetTime,
            limit: maxRequests,
        };
    };
}

// ─── Redis Rate Limiting (Optional) ─────────────────────────
// Import Redis rate limiting if available
let redisRateLimit: any = null;
try {
    if (process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL) {
        const redisModule = require("./redis-rate-limit");
        redisRateLimit = {
            strict: redisModule.redisStrictRateLimit,
            moderate: redisModule.redisModerateRateLimit,
            lenient: redisModule.redisLenientRateLimit,
        };
    }
} catch (error) {
    // Redis module not available, fallback to in-memory
    console.log("Redis rate limiting not available, using in-memory fallback");
}

// ─── CORS Middleware ───────────────────────────────────────────
interface CORSOptions {
    allowedOrigins?: string[];
    allowedMethods?: string[];
    allowedHeaders?: string[];
    credentials?: boolean;
    maxAge?: number;
}

const defaultCORSOptions: CORSOptions = {
    allowedOrigins: ["*"],
    allowedMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
    maxAge: 86400, // 24 hours
};

/**
 * CORS middleware
 */
export function handleCORS(req: NextRequest, options: CORSOptions = {}): NextResponse | null {
    const opts = { ...defaultCORSOptions, ...options };
    const origin = req.headers.get("origin");

    // Handle preflight request
    if (req.method === "OPTIONS") {
        const response = new NextResponse(null, { status: 204 });

        // Set Access-Control-Allow-Origin
        if (opts.allowedOrigins?.includes("*")) {
            response.headers.set("Access-Control-Allow-Origin", "*");
        } else if (origin && opts.allowedOrigins?.includes(origin)) {
            response.headers.set("Access-Control-Allow-Origin", origin);
        }

        if (opts.allowedMethods) {
            response.headers.set("Access-Control-Allow-Methods", opts.allowedMethods.join(", "));
        }

        if (opts.allowedHeaders) {
            response.headers.set("Access-Control-Allow-Headers", opts.allowedHeaders.join(", "));
        }

        if (opts.credentials) {
            response.headers.set("Access-Control-Allow-Credentials", "true");
        }

        if (opts.maxAge) {
            response.headers.set("Access-Control-Max-Age", opts.maxAge.toString());
        }

        return response;
    }

    // For non-preflight requests, we'll set CORS headers on the actual response
    return null;
}

/**
 * Add CORS headers to a response
 */
export function addCORSHeaders(response: NextResponse, req: NextRequest, options: CORSOptions = {}): NextResponse {
    const opts = { ...defaultCORSOptions, ...options };
    const origin = req.headers.get("origin");

    // Set Access-Control-Allow-Origin
    if (opts.allowedOrigins?.includes("*")) {
        response.headers.set("Access-Control-Allow-Origin", "*");
    } else if (origin && opts.allowedOrigins?.includes(origin)) {
        response.headers.set("Access-Control-Allow-Origin", origin);
    }

    if (opts.credentials) {
        response.headers.set("Access-Control-Allow-Credentials", "true");
    }

    if (opts.allowedHeaders) {
        response.headers.set("Access-Control-Expose-Headers", opts.allowedHeaders.join(", "));
    }

    return response;
}

// ─── IP Whitelist/Blacklist ─────────────────────────────────────
interface IPFilterOptions {
    whitelist?: string[];
    blacklist?: string[];
}

/**
 * Get client IP address from request
 */
export function getClientIdentifier(req: NextRequest): string {
    // Check various headers for the real IP
    const forwarded = req.headers.get("x-forwarded-for");
    const realIP = req.headers.get("x-real-ip");
    const cfConnectingIP = req.headers.get("cf-connecting-ip");

    if (cfConnectingIP) {
        return cfConnectingIP;
    }

    if (forwarded) {
        // x-forwarded-for can contain multiple IPs, take the first one
        return forwarded.split(",")[0].trim();
    }

    if (realIP) {
        return realIP;
    }

    // Fallback to request IP (Next.js doesn't have req.ip, use headers)
    return "unknown";
}

/**
 * Check if IP is in CIDR range (simple implementation)
 */
function isIPInCIDR(ip: string, cidr: string): boolean {
    const [network, prefixLength] = cidr.split("/");
    const mask = parseInt(prefixLength || "32", 10);

    // Simple implementation for IPv4
    const ipParts = ip.split(".").map(Number);
    const networkParts = network.split(".").map(Number);

    if (ipParts.length !== 4 || networkParts.length !== 4) {
        return false;
    }

    const maskInt = 0xFFFFFFFF << (32 - mask);

    const ipInt = (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3];
    const networkInt = (networkParts[0] << 24) | (networkParts[1] << 16) | (networkParts[2] << 8) | networkParts[3];

    return (ipInt & maskInt) === (networkInt & maskInt);
}

/**
 * Check if IP matches a pattern (exact match or CIDR)
 */
function isIPMatch(ip: string, pattern: string): boolean {
    if (pattern.includes("/")) {
        return isIPInCIDR(ip, pattern);
    }
    return ip === pattern;
}

/**
 * IP filter middleware
 */
export function checkIPFilter(req: NextRequest, options: IPFilterOptions): {
    allowed: boolean;
    reason?: string;
} {
    const ip = getClientIdentifier(req);
    const { whitelist, blacklist } = options;

    // Check blacklist first
    if (blacklist && blacklist.length > 0) {
        for (const pattern of blacklist) {
            if (isIPMatch(ip, pattern)) {
                return {
                    allowed: false,
                    reason: `IP ${ip} is blacklisted`,
                };
            }
        }
    }

    // Check whitelist if configured
    if (whitelist && whitelist.length > 0) {
        for (const pattern of whitelist) {
            if (isIPMatch(ip, pattern)) {
                return { allowed: true };
            }
        }
        // If whitelist is configured and IP doesn't match, deny
        return {
            allowed: false,
            reason: `IP ${ip} is not whitelisted`,
        };
    }

    // No restrictions
    return { allowed: true };
}

// ─── Logging ───────────────────────────────────────────────────
interface SecurityLogEntry {
    timestamp: string;
    ip: string;
    userAgent: string;
    method: string;
    path: string;
    status?: number;
    event: string;
    details?: any;
}

const securityLogs: SecurityLogEntry[] = [];
const MAX_LOG_ENTRIES = 1000; // Keep last 1000 entries in memory

/**
 * Log security event
 */
export function logSecurityEvent(entry: Omit<SecurityLogEntry, "timestamp">) {
    const logEntry: SecurityLogEntry = {
        timestamp: new Date().toISOString(),
        ...entry,
    };

    securityLogs.push(logEntry);

    // Keep only last MAX_LOG_ENTRIES
    if (securityLogs.length > MAX_LOG_ENTRIES) {
        securityLogs.shift();
    }

    // Also log to console
    console.log(`[SECURITY] ${logEntry.event} - ${logEntry.ip} - ${logEntry.method} ${logEntry.path}`);

    // In production, you might want to send to external logging service
    // like Sentry, LogRocket, or a dedicated logging API
}

/**
 * Get security logs
 */
export function getSecurityLogs(limit: number = 100): SecurityLogEntry[] {
    return securityLogs.slice(-limit);
}

/**
 * Clear security logs
 */
export function clearSecurityLogs() {
    securityLogs.length = 0;
}

// ─── Webhook Signature Verification ─────────────────────────────
/**
 * Verify webhook signature (HMAC-SHA256)
 * Used to verify that webhook requests are from trusted sources
 */
export function verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
): boolean {
    const crypto = require("crypto");

    const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(payload)
        .digest("hex");

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
    );
}

/**
 * Extract signature from headers
 */
export function extractSignature(req: NextRequest, headerName: string = "x-webhook-signature"): string | null {
    return req.headers.get(headerName);
}

// ─── Helper Functions ───────────────────────────────────────────
/**
 * Create a standardized error response
 */
export function createErrorResponse(
    message: string,
    status: number = 400,
    details?: any
): NextResponse {
    const response = NextResponse.json(
        {
            error: message,
            ...(details && { details }),
        },
        { status }
    );

    // Add security headers
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-XSS-Protection", "1; mode=block");

    return response;
}

/**
 * Add security headers to response
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");

    return response;
}

// ─── Pre-configured Rate Limiters ───────────────────────────────
export const strictRateLimit = createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per 15 minutes
});

export const moderateRateLimit = createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
});

export const lenientRateLimit = createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 200, // 200 requests per minute
});

// ─── Environment-based Configuration ───────────────────────────
export function getSecurityConfig() {
    return {
        // CORS
        corsAllowedOrigins: process.env.CORS_ALLOWED_ORIGINS?.split(",") || ["*"],
        corsAllowedMethods: process.env.CORS_ALLOWED_METHODS?.split(",") || ["GET", "POST", "PUT", "DELETE", "OPTIONS"],

        // IP Filter
        ipWhitelist: process.env.IP_WHITELIST?.split(",").filter(Boolean) || [],
        ipBlacklist: process.env.IP_BLACKLIST?.split(",").filter(Boolean) || [],

        // Rate Limiting
        rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || "60000"), // 1 minute
        rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "60"),

        // Webhook Signature
        webhookSecret: process.env.WEBHOOK_SECRET || "",
    };
}
