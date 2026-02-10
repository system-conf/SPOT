export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { scheduledNotifications } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET - List scheduled notifications
export async function GET() {
    try {
        const scheduled = await db.select().from(scheduledNotifications);
        return NextResponse.json(scheduled);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST - Create a scheduled notification
export async function POST(req: NextRequest) {
    try {
        const { channelId, title, body, icon, url, scheduledAt, timezone, repeat } = await req.json();

        if (!title || !body || !scheduledAt) {
            return NextResponse.json({ error: "Title, body, and scheduledAt are required" }, { status: 400 });
        }

        const [result] = await db.insert(scheduledNotifications).values({
            channelId,
            title,
            body,
            icon,
            url,
            scheduledAt: new Date(scheduledAt),
            timezone: timezone || "Europe/Istanbul",
            repeat: repeat || "none",
        });

        return NextResponse.json({ success: true, id: result.insertId });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE - Cancel a scheduled notification
export async function DELETE(req: NextRequest) {
    try {
        const { id } = await req.json();
        await db.update(scheduledNotifications)
            .set({ status: "cancelled" })
            .where(eq(scheduledNotifications.id, id));
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
