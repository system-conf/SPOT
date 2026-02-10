import PushSetup from "@/components/PushSetup";
import ChannelManager from "@/components/ChannelManager";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import { db } from "@/db";
import { notifications, channels, type Notification, type Channel } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { Zap, History, Radio } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Home() {
  // Fetch notifications with channel info
  const notificationsList = await db.select({
    id: notifications.id,
    channelId: notifications.channelId,
    title: notifications.title,
    body: notifications.body,
    icon: notifications.icon,
    url: notifications.url,
    status: notifications.status,
    sentAt: notifications.sentAt,
  })
    .from(notifications)
    .orderBy(desc(notifications.sentAt))
    .limit(15);

  // Fetch all channels for color mapping
  const channelList = await db.select().from(channels);
  const channelMap = new Map(channelList.map((c) => [c.id, c]));

  return (
    <main className="min-h-screen bg-black text-white selection:bg-blue-500/30">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <header className="mb-16 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-white/5 rounded-full border border-white/10 shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)]">
              <Radio className="w-12 h-12 text-blue-400" />
            </div>
          </div>
          <h1 className="text-6xl font-black bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500 mb-4 tracking-tight">
            SPOT
          </h1>
          <p className="text-gray-400 text-lg max-w-lg mx-auto">
            <span className="text-blue-400 font-semibold">S</span>imple
            <span className="text-blue-400 font-semibold"> P</span>ersonal
            <span className="text-blue-400 font-semibold"> O</span>utput
            <span className="text-blue-400 font-semibold"> T</span>rigger.
          </p>
          <p className="text-gray-500 mt-2">
            Kişisel webhook bildirim sistemin. Diğer projelerinden kendine anlık mesajlar gönder.
          </p>
        </header>

        {/* Top Row: Push Setup + Channels */}
        <section className="grid md:grid-cols-2 gap-6 mb-8">
          <PushSetup />
          <ChannelManager />
        </section>

        {/* Analytics */}
        <section className="mb-8">
          <AnalyticsDashboard />
        </section>

        {/* Webhook Usage */}
        <section className="p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 mb-8">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            Webhook Kullanımı
          </h3>
          <div className="bg-black/40 p-4 rounded-xl font-mono text-xs text-blue-300 overflow-x-auto space-y-1">
            <p className="opacity-50"># Global auth veya Kanal API key kullanabilirsin:</p>
            <p>curl -X POST /api/notify \</p>
            <p>  -H &quot;Authorization: Bearer <span className="text-yellow-300">CHANNEL_API_KEY</span>&quot; \</p>
            <p>  -H &quot;Content-Type: application/json&quot; \</p>
            <p>  -d &apos;&#123;&quot;title&quot;: &quot;Deploy&quot;, &quot;body&quot;: &quot;v2.0 yayında!&quot;&#125;&apos;</p>
          </div>
        </section>

        {/* Notification History */}
        <section className="p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <History className="w-5 h-5 text-blue-400" />
            Bildirim Geçmişi
          </h3>

          <div className="space-y-3">
            {notificationsList.length === 0 ? (
              <p className="text-gray-500 text-center py-12">Henüz bildirim bulunmuyor.</p>
            ) : (
              notificationsList.map((n) => {
                const ch = n.channelId ? channelMap.get(n.channelId) : null;
                return (
                  <div key={n.id} className="p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors border border-transparent hover:border-white/5">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        {ch && (
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                            style={{
                              backgroundColor: `${ch.color}20`,
                              color: ch.color,
                              border: `1px solid ${ch.color}40`,
                            }}
                          >
                            {ch.name}
                          </span>
                        )}
                        <h4 className="font-semibold text-white">{n.title}</h4>
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {n.sentAt ? new Date(n.sentAt).toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' }) : ""}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed">{n.body}</p>
                    {n.url && (
                      <div className="mt-2">
                        <a href={n.url} target="_blank" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                          🔗 {n.url}
                        </a>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
