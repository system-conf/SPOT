import dynamic from "next/dynamic";
import { Zap, Radio } from "lucide-react";

// ─── Lazy Loaded Components ───────────────────────────────────────
// Critical components (above the fold) - loaded immediately
import PushSetup from "@/components/PushSetup";
import ChannelManager from "@/components/ChannelManager";

// Non-critical components - lazy loaded for better initial load time
const AnalyticsDashboard = dynamic(() => import("@/components/AnalyticsDashboard"), {
  loading: () => (
    <div className="p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 animate-pulse">
      <div className="h-6 bg-white/10 rounded w-40 mb-4" />
      <div className="grid grid-cols-3 gap-3">
        <div className="h-20 bg-white/5 rounded-xl" />
        <div className="h-20 bg-white/5 rounded-xl" />
        <div className="h-20 bg-white/5 rounded-xl" />
      </div>
    </div>
  ),
});

const TemplateManager = dynamic(() => import("@/components/TemplateManager"), {
  loading: () => (
    <div className="p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 animate-pulse">
      <div className="h-6 bg-white/10 rounded w-32 mb-4" />
      <div className="space-y-3">
        <div className="h-12 bg-white/5 rounded-xl" />
        <div className="h-12 bg-white/5 rounded-xl" />
      </div>
    </div>
  ),
});

const SubscriptionManager = dynamic(() => import("@/components/SubscriptionManager"), {
  loading: () => (
    <div className="p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 animate-pulse">
      <div className="h-6 bg-white/10 rounded w-32 mb-4" />
      <div className="space-y-3">
        <div className="h-12 bg-white/5 rounded-xl" />
        <div className="h-12 bg-white/5 rounded-xl" />
      </div>
    </div>
  ),
});

const NotificationHistory = dynamic(() => import("@/components/NotificationHistory"), {
  loading: () => (
    <div className="p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 animate-pulse">
      <div className="h-6 bg-white/10 rounded w-32 mb-4" />
      <div className="space-y-3">
        <div className="h-16 bg-white/5 rounded-xl" />
        <div className="h-16 bg-white/5 rounded-xl" />
        <div className="h-16 bg-white/5 rounded-xl" />
      </div>
    </div>
  ),
});

export default function Home() {

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

        {/* Templates & Subscriptions */}
        <section className="grid md:grid-cols-2 gap-6 mb-8">
          <TemplateManager />
          <SubscriptionManager />
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
        <section className="mb-8">
          <NotificationHistory />
        </section>
      </div>
    </main>
  );
}
