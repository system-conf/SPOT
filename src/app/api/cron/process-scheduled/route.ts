export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { scheduledNotifications, subscriptions, notifications } from "@/db/schema";
import { and, eq, lte, sql } from "drizzle-orm";
import { sendPushNotification } from "@/lib/push";

// Cron endpoint - processes due scheduled notifications
export async function GET(req: NextRequest) {
    try {
        // Simple auth check (Vercel Cron sends a secret header)
        const authHeader = req.headers.get("authorization");
        if (authHeader !== `Bearer ${process.env.CRON_SECRET || process.env.API_SECRET}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const now = new Date();

        // Find all pending scheduled notifications that are due
        const dueNotifications = await db
            .select()
            .from(scheduledNotifications)
            .where(
                and(
                    eq(scheduledNotifications.status, "pending"),
                    lte(scheduledNotifications.scheduledAt, now)
                )
            );

        if (dueNotifications.length === 0) {
            return NextResponse.json({ message: "No notifications to process", sent: 0 });
        }

        const allSubscriptions = await db.select().from(subscriptions);
        let totalSent = 0;

        for (const scheduled of dueNotifications) {
            // Send to all subscribers
            const results = await Promise.all(
                allSubscriptions.map((sub) =>
                    sendPushNotification(sub, {
                        title: scheduled.title,
                        body: scheduled.body,
                        icon: scheduled.icon || undefined,
                        url: scheduled.url || undefined,
                    })
                )
            );

            const successes = results.filter((r) => r.success).length;

            // Log the notification
            await db.insert(notifications).values({
                channelId: scheduled.channelId,
                title: scheduled.title,
                body: scheduled.body,
                icon: scheduled.icon,
                url: scheduled.url,
                status: successes > 0 ? "sent" : "failed",
            });

            // Handle repeat logic
            if (scheduled.repeat === "none") {
                await db
                    .update(scheduledNotifications)
                    .set({ status: "sent" })
                    .where(eq(scheduledNotifications.id, scheduled.id));
            } else {
                // Calculate next run time based on repeat type
                const nextRun = new Date(scheduled.scheduledAt);
                if (scheduled.repeat === "daily") {
                    nextRun.setDate(nextRun.getDate() + 1);
                } else if (scheduled.repeat === "weekly") {
                    nextRun.setDate(nextRun.getDate() + 7);
                } else if (scheduled.repeat === "monthly") {
                    nextRun.setMonth(nextRun.getMonth() + 1);
                }

                await db
                    .update(scheduledNotifications)
                    .set({ scheduledAt: nextRun })
                    .where(eq(scheduledNotifications.id, scheduled.id));
            }

            totalSent++;
        }

        return NextResponse.json({ success: true, processed: totalSent });
    } catch (error: any) {
        console.error("Cron Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
