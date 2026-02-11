// ─── In-Memory Cache Utility ───────────────────────────────────────
// Redis veya Upstash kullanılabilir, ancak basit bir in-memory cache ile başlayacağız
// Production için Redis kullanımı önerilir

// ─── Cache Entry ───────────────────────────────────────────────
interface CacheEntry<T> {
    value: T;
    expiresAt: number;
}

// ─── Cache Options ─────────────────────────────────────────────
export interface CacheOptions {
    ttl?: number; // Time to live in milliseconds (default: 5 minutes)
    prefix?: string; // Key prefix
}

// ─── In-Memory Cache Store ───────────────────────────────────────
const memoryCache = new Map<string, CacheEntry<any>>();

// ─── Cache Configuration ─────────────────────────────────────────
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
const CACHE_PREFIX = "spot_cache";

// ─── Cache Cleanup Interval ───────────────────────────────────────
// Her dakika süresi geçmiş cache entry'lerini temizle
setInterval(() => {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of memoryCache.entries()) {
        if (now > entry.expiresAt) {
            memoryCache.delete(key);
            cleaned++;
        }
    }
    
    if (cleaned > 0) {
        console.log(`[Cache] Cleaned ${cleaned} expired entries`);
    }
}, 60 * 1000); // Her dakika

// ─── Cache Key Generator ───────────────────────────────────────
function generateKey(prefix: string, identifier: string): string {
    return `${CACHE_PREFIX}:${prefix}:${identifier}`;
}

// ─── Get Cache Entry ───────────────────────────────────────────
export async function getCache<T>(
    identifier: string,
    options: CacheOptions = {}
): Promise<T | null> {
    const { prefix = "default" } = options;
    const key = generateKey(prefix, identifier);
    
    const entry = memoryCache.get(key);
    
    if (!entry) {
        return null;
    }
    
    // Süresi geçmişse sil ve null döndür
    if (Date.now() > entry.expiresAt) {
        memoryCache.delete(key);
        return null;
    }
    
    return entry.value as T;
}

// ─── Set Cache Entry ───────────────────────────────────────────
export async function setCache<T>(
    identifier: string,
    value: T,
    options: CacheOptions = {}
): Promise<void> {
    const { ttl = DEFAULT_TTL, prefix = "default" } = options;
    const key = generateKey(prefix, identifier);
    const expiresAt = Date.now() + ttl;
    
    const entry: CacheEntry<T> = {
        value,
        expiresAt,
    };
    
    memoryCache.set(key, entry);
}

// ─── Delete Cache Entry ─────────────────────────────────────────
export async function deleteCache(
    identifier: string,
    options: CacheOptions = {}
): Promise<void> {
    const { prefix = "default" } = options;
    const key = generateKey(prefix, identifier);
    memoryCache.delete(key);
}

// ─── Invalidate Cache by Prefix ─────────────────────────────────
export async function invalidateCachePrefix(prefix: string): Promise<number> {
    let count = 0;
    
    for (const key of memoryCache.keys()) {
        if (key.startsWith(`${CACHE_PREFIX}:${prefix}:`)) {
            memoryCache.delete(key);
            count++;
        }
    }
    
    return count;
}

// ─── Clear All Cache ───────────────────────────────────────────
export async function clearAllCache(): Promise<number> {
    const count = memoryCache.size;
    memoryCache.clear();
    return count;
}

// ─── Get or Set (Cache-Aside Pattern) ───────────────────────────
export async function getOrSetCache<T>(
    identifier: string,
    factory: () => Promise<T>,
    options: CacheOptions = {}
): Promise<T> {
    // Önce cache'den almayı dene
    const cached = await getCache<T>(identifier, options);
    
    if (cached !== null) {
        return cached;
    }
    
    // Cache'de yoksa factory fonksiyonunu çalıştır
    const value = await factory();
    
    // Sonucu cache'e kaydet
    await setCache(identifier, value, options);
    
    return value;
}

// ─── Cache Stats ───────────────────────────────────────────────
export function getCacheStats(): {
    size: number;
    keys: string[];
} {
    return {
        size: memoryCache.size,
        keys: Array.from(memoryCache.keys()),
    };
}

// ─── Pre-configured Cache Helpers ───────────────────────────────

// Channels cache (1 dakika TTL)
export const cacheChannels = async <T>(identifier: string, factory: () => Promise<T>): Promise<T> => {
    return getOrSetCache(identifier, factory, { ttl: 60 * 1000, prefix: "channels" });
};

// Templates cache (5 dakika TTL)
export const cacheTemplates = async <T>(identifier: string, factory: () => Promise<T>): Promise<T> => {
    return getOrSetCache(identifier, factory, { ttl: 5 * 60 * 1000, prefix: "templates" });
};

// Stats cache (30 saniye TTL)
export const cacheStats = async <T>(identifier: string, factory: () => Promise<T>): Promise<T> => {
    return getOrSetCache(identifier, factory, { ttl: 30 * 1000, prefix: "stats" });
};

// Subscriptions cache (1 dakika TTL)
export const cacheSubscriptions = async <T>(identifier: string, factory: () => Promise<T>): Promise<T> => {
    return getOrSetCache(identifier, factory, { ttl: 60 * 1000, prefix: "subscriptions" });
};

// ─── Cache Invalidation Helpers ───────────────────────────────────
export const invalidateChannelsCache = () => invalidateCachePrefix("channels");
export const invalidateTemplatesCache = () => invalidateCachePrefix("templates");
export const invalidateStatsCache = () => invalidateCachePrefix("stats");
export const invalidateSubscriptionsCache = () => invalidateCachePrefix("subscriptions");
