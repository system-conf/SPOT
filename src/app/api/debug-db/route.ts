export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";

// Check DB Connection & Subscriptions
export async function GET() {
    try {
        const subCount = await db.select().from(subscriptions);
        return NextResponse.json({
            status: "ok",
            subscriptionCount: subCount.length,
            subscriptions: subCount // Be careful with privacy in logs, but ok for debug
        });
    } catch (error: any) {
        return NextResponse.json({
            status: "error",
            message: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
