export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { channels } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

function generateApiKey(): string {
    return "spot_" + crypto.randomBytes(16).toString("hex");
}

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

// GET — List all channels
export async function GET() {
    try {
        const allChannels = await db.select().from(channels);
        return NextResponse.json(allChannels);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST — Create a new channel
export async function POST(req: NextRequest) {
    try {
        const { name, color, icon } = await req.json();

        if (!name || name.trim().length === 0) {
            return NextResponse.json({ error: "Channel name is required" }, { status: 400 });
        }

        const slug = slugify(name);
        const apiKey = generateApiKey();

        await db.insert(channels).values({
            name: name.trim(),
            slug,
            apiKey,
            color: color || "#3B82F6",
            icon: icon || "bell",
        });

        return NextResponse.json({ success: true, slug, apiKey });
    } catch (error: any) {
        if (error.code === "ER_DUP_ENTRY") {
            return NextResponse.json({ error: "A channel with this name already exists" }, { status: 409 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE — Delete a channel by ID
export async function DELETE(req: NextRequest) {
    try {
        const { id } = await req.json();
        await db.delete(channels).where(eq(channels.id, id));
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
