// ─── Security Logger ───────────────────────────────────────────
import { db } from "@/db";
import { securityLogs } from "@/db/schema";

/**
 * Log security event to database
 */
export async function logSecurityEventToDatabase(entry: {
    ip: string;
    userAgent: string;
    method: string;
    path: string;
    event: string;
    status?: number;
    details?: any;
}): Promise<void> {
    try {
        await db.insert(securityLogs).values({
            ip: entry.ip,
            userAgent: entry.userAgent,
            method: entry.method,
            path: entry.path,
            event: entry.event,
            status: entry.status,
            details: entry.details ? JSON.stringify(entry.details) : null,
        });
    } catch (error) {
        console.error("Failed to log security event to database:", error);
        // Fallback to console
        console.log(`[SECURITY] ${entry.event} - ${entry.ip} - ${entry.method} ${entry.path}`);
    }
}

/**
 * Get security logs from database
 */
export async function getSecurityLogsFromDatabase(limit: number = 100) {
    try {
        const logs = await db
            .select()
            .from(securityLogs)
            .orderBy(securityLogs.createdAt)
            .limit(limit);
        return logs;
    } catch (error) {
        console.error("Failed to get security logs from database:", error);
        return [];
    }
}
