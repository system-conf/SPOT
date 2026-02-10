export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({
        vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.substring(0, 10) + "...",
        vapidPrivateKey: process.env.VAPID_PRIVATE_KEY ? "✅ Set" : "❌ Missing",
        vapidEmail: process.env.VAPID_EMAIL || "❌ Missing",
        apiSecret: process.env.API_SECRET ? "✅ Set" : "❌ Missing",
    });
}
