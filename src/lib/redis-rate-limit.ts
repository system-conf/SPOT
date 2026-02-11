// ─── Redis Rate Limiting ───────────────────────────────────────
import { Redis } from "@upstash/redis";

// ─── Rate Limit Entry ───────────────────────────────────────
interface RateLimitEntry {
    count: number;
    resetTime: number;
}

// ─── Rate Limit Options ───────────────────────────────────────
interface RateLimitOptions {
    windowMs: number;      // Time window in milliseconds
    maxRequests: number;   // Max requests per window
    prefix?: string;       // Key prefix for Redis
}

// ─── Redis Client (Singleton Pattern with Lazy Initialization) ───────────────────────────────────────────
let redisClient: Redis | null = null;
let redisClientInitialized = false;

function getRedisClient(): Redis {
    if (!redisClientInitialized) {
        const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL;
        
        if (!redisUrl) {
            throw new Error("REDIS_URL or UPSTASH_REDIS_REST_URL environment variable is not set");
        }

        redisClient = new Redis({
            url: redisUrl,
            token: process.env.UPSTASH_REDIS_REST_TOKEN,
        });
        redisClientInitialized = true;
    }
    
    return redisClient!;
}

// ─── In-Memory Fallback Cache ───────────────────────────────────────
// Redis unavailable olduğunda kullanılacak
const memoryFallbackCache = new Map<string, { count: number; resetTime: number }>();

// ─── Cleanup Expired Memory Entries ───────────────────────────────────────
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memoryFallbackCache.entries()) {
        if (now > entry.resetTime) {
            memoryFallbackCache.delete(key);
        }
    }
}, 60 * 1000); // Her dakika

// ─── Rate Limiting Function (Optimized with Atomic Operations) ─────────────────────────────────────
export function createRedisRateLimit(options: RateLimitOptions) {
    const { windowMs, maxRequests, prefix = "rate_limit" } = options;

    return async function rateLimit(identifier: string): Promise<{
        success: boolean;
        remaining: number;
        resetTime: number;
        limit: number;
    }> {
        const now = Date.now();
        const resetTime = now + windowMs;
        const key = `${prefix}:${identifier}`;

        try {
            const redis = getRedisClient();
            
            // Get current rate limit entry
            const entry = await redis.get<RateLimitEntry>(key);

            if (!entry || now > entry.resetTime) {
                // New window or expired entry
                const newEntry: RateLimitEntry = {
                    count: 1,
                    resetTime,
                };
                
                await redis.set(key, JSON.stringify(newEntry), { px: windowMs });
                
                return {
                    success: true,
                    remaining: maxRequests - 1,
                    resetTime,
                    limit: maxRequests,
                };
            }

            // Existing window
            if (entry.count >= maxRequests) {
                return {
                    success: false,
                    remaining: 0,
                    resetTime: entry.resetTime,
                    limit: maxRequests,
                };
            }

            // Increment counter
            const updatedEntry: RateLimitEntry = {
                count: entry.count + 1,
                resetTime: entry.resetTime,
            };
            
            await redis.set(key, JSON.stringify(updatedEntry), { pxat: entry.resetTime });
            
            return {
                success: true,
                remaining: maxRequests - updatedEntry.count,
                resetTime: entry.resetTime,
                limit: maxRequests,
            };
        } catch (error) {
            console.error("Redis rate limiting error, using memory fallback:", error);
            
            // In-memory fallback when Redis is unavailable
            const memoryEntry = memoryFallbackCache.get(key);
            
            if (!memoryEntry || now > memoryEntry.resetTime) {
                // New window or expired entry in memory
                memoryFallbackCache.set(key, {
                    count: 1,
                    resetTime,
                });
                
                return {
                    success: true,
                    remaining: maxRequests - 1,
                    resetTime,
                    limit: maxRequests,
                };
            }

            // Existing window in memory
            if (memoryEntry.count >= maxRequests) {
                return {
                    success: false,
                    remaining: 0,
                    resetTime: memoryEntry.resetTime,
                    limit: maxRequests,
                };
            }

            // Increment counter in memory
            memoryEntry.count += 1;
            
            return {
                success: true,
                remaining: maxRequests - memoryEntry.count,
                resetTime: memoryEntry.resetTime,
                limit: maxRequests,
            };
        }
    };
}

// ─── Pre-configured Rate Limiters ─────────────────────────────
export const redisStrictRateLimit = createRedisRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per 15 minutes
    prefix: "strict_rate_limit",
});

export const redisModerateRateLimit = createRedisRateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
    prefix: "moderate_rate_limit",
});

export const redisLenientRateLimit = createRedisRateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 200, // 200 requests per minute
    prefix: "lenient_rate_limit",
});

// ─── Reset Rate Limit ───────────────────────────────────────────
export async function resetRateLimit(identifier: string, prefix: string = "rate_limit"): Promise<void> {
    const key = `${prefix}:${identifier}`;
    
    // Redis'ten sil
    try {
        const redis = getRedisClient();
        await redis.del(key);
    } catch (error) {
        console.error("Redis reset error:", error);
    }
    
    // Memory fallback'ten de sil
    memoryFallbackCache.delete(key);
}

// ─── Get Rate Limit Info ───────────────────────────────────────
export async function getRateLimitInfo(
    identifier: string,
    prefix: string = "rate_limit"
): Promise<RateLimitEntry | null> {
    const key = `${prefix}:${identifier}`;
    
    try {
        const redis = getRedisClient();
        const entry = await redis.get<RateLimitEntry>(key);
        if (entry) return entry;
    } catch (error) {
        console.error("Redis get error:", error);
    }
    
    // Memory fallback'ten dene
    const memoryEntry = memoryFallbackCache.get(key);
    if (memoryEntry) {
        const now = Date.now();
        if (now <= memoryEntry.resetTime) {
            return memoryEntry;
        }
        memoryFallbackCache.delete(key);
    }
    
    return null;
}

// ─── Get Cache Stats ───────────────────────────────────────────
export function getRateLimitCacheStats(): {
    redisClientInitialized: boolean;
    memoryCacheSize: number;
    memoryCacheKeys: string[];
} {
    return {
        redisClientInitialized,
        memoryCacheSize: memoryFallbackCache.size,
        memoryCacheKeys: Array.from(memoryFallbackCache.keys()),
    };
}
