export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { notifications, channels } from "@/db/schema";
import { sql, eq, count, desc } from "drizzle-orm";

export async function GET() {
    try {
        // Total notifications
        const [totalResult] = await db
            .select({ total: count() })
            .from(notifications);

        // Sent vs Failed
        const statusStats = await db
            .select({
                status: notifications.status,
                count: count(),
            })
            .from(notifications)
            .groupBy(notifications.status);

        // Per-channel stats
        const channelStats = await db
            .select({
                channelId: notifications.channelId,
                channelName: channels.name,
                channelColor: channels.color,
                count: count(),
            })
            .from(notifications)
            .leftJoin(channels, eq(notifications.channelId, channels.id))
            .groupBy(notifications.channelId, channels.name, channels.color);

        // Last 7 days activity (daily counts)
        const dailyStats = await db
            .select({
                date: sql<string>`DATE(sent_at)`.as("date"),
                count: count(),
            })
            .from(notifications)
            .where(sql`sent_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`)
            .groupBy(sql`DATE(sent_at)`)
            .orderBy(sql`DATE(sent_at)`);

        // Recent 5 notifications
        const recent = await db
            .select()
            .from(notifications)
            .orderBy(desc(notifications.sentAt))
            .limit(5);

        const sent = statusStats.find((s) => s.status === "sent")?.count || 0;
        const failed = statusStats.find((s) => s.status === "failed")?.count || 0;

        return NextResponse.json({
            total: totalResult.total,
            sent,
            failed,
            successRate: totalResult.total > 0 ? Math.round((Number(sent) / totalResult.total) * 100) : 100,
            channelStats: channelStats.map((c) => ({
                name: c.channelName || "Global",
                color: c.channelColor || "#6B7280",
                count: c.count,
            })),
            dailyStats,
            recent,
        });
    } catch (error: any) {
        console.error("Stats Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
