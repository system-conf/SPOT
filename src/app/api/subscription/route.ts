export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";

export async function POST(req: NextRequest) {
    try {
        const subscription = await req.json();

        if (!subscription || !subscription.endpoint) {
            return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
        }

        const { endpoint, keys } = subscription;

        await db.insert(subscriptions).values({
            endpoint,
            p256dh: keys.p256dh,
            auth: keys.auth,
        }).onConflictDoUpdate({
            target: subscriptions.endpoint,
            set: {
                p256dh: keys.p256dh,
                auth: keys.auth,
            }
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Subscription Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
