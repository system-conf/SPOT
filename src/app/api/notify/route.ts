export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { subscriptions, notifications, channels } from "@/db/schema";
import { sendPushNotification } from "@/lib/push";
import { eq, OneOrMany } from "drizzle-orm";

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get("authorization")?.replace("Bearer ", "");

        if (!authHeader) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Auth: Check global API_SECRET first, then channel-specific API key
        let channelId: number | null = null;

        if (authHeader === process.env.API_SECRET) {
            // Global auth — no specific channel
        } else {
            // Try to find a channel with this API key
            const [channel] = await db
                .select()
                .from(channels)
                .where(eq(channels.apiKey, authHeader))
                .limit(1);

            if (!channel || !channel.isActive) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }

            channelId = channel.id;
        }

        const { title, body, icon, url, actions, requireInteraction } = await req.json();

        if (!title || !body) {
            return NextResponse.json({ error: "Title and body are required" }, { status: 400 });
        }

        const allSubscriptions = await db.select().from(subscriptions);

        const results = await Promise.all(
            allSubscriptions.map(async (sub) => {
                try {
                    const result = await sendPushNotification(sub, { title, body, icon, url, actions, requireInteraction });

                    if (result.expired) {
                        try {
                            await db.delete(subscriptions).where(eq(subscriptions.id, sub.id));
                        } catch (dbError) {
                            console.error("DB Deletion Error:", dbError);
                        }
                    }
                    return result;
                } catch (subError: any) {
                    console.error("Subscription Processing Error:", subError);
                    return { success: false, error: subError.message };
                }
            })
        );

        const successes = results.filter((r: any) => r.success).length;
        const status = successes > 0 ? "sent" : "failed";

        try {
            // Log the notification with channel reference
            await db.insert(notifications).values({
                channelId,
                title,
                body,
                icon,
                url,
                status,
            });
        } catch (insertError: any) {
            console.error("Notification Logging Error:", insertError);
            // Don't fail the request if logging fails, but log it
        }

        return NextResponse.json({
            success: true,
            channel: channelId ? `channel #${channelId}` : "global",
            sentCount: successes,
            totalSubscriptions: allSubscriptions.length,
        });

    } catch (error: any) {
        console.error("===== NOTIFY ENDPOINT ERROR =====");
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
        console.error("Full error:", JSON.stringify(error, null, 2));
        return NextResponse.json({ error: error.message, details: error.toString() }, { status: 500 });
    }
}
