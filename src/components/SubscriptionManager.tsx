"use client";
import { useState, useEffect } from "react";
import { Users, Search, Trash2, Check, X, RefreshCw, Clock, Globe } from "lucide-react";

type Subscription = {
    id: number;
    endpoint: string;
    channelSlug: string;
    userAgent: string;
    isActive: boolean;
    lastUsedAt: string;
    createdAt: string;
    updatedAt: string;
};

type Channel = {
    id: number;
    name: string;
    slug: string;
    color: string;
};

type PaginationState = {
    page: number;
    limit: number;
    total: number;
};

export default function SubscriptionManager() {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [channels, setChannels] = useState<Channel[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedChannel, setSelectedChannel] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
    const [pagination, setPagination] = useState<PaginationState>({ page: 1, limit: 20, total: 0 });
    const [copiedId, setCopiedId] = useState<number | null>(null);

    const fetchChannels = async () => {
        const res = await fetch("/api/channels");
        const data = await res.json();
        setChannels(data);
    };

    const fetchSubscriptions = async () => {
        setLoading(true);
        const params = new URLSearchParams({
            page: pagination.page.toString(),
            limit: pagination.limit.toString(),
        });

        if (searchTerm) params.append("search", searchTerm);
        if (selectedChannel !== "all") params.append("channel", selectedChannel);
        if (statusFilter !== "all") params.append("status", statusFilter);

        const res = await fetch(`/api/subscriptions?${params.toString()}`);
        const data = await res.json();
        setSubscriptions(data.subscriptions || []);
        setPagination(prev => ({ ...prev, total: data.total || 0 }));
        setLoading(false);
    };

    useEffect(() => {
        fetchChannels();
    }, []);

    useEffect(() => {
        fetchSubscriptions();
    }, [pagination.page, searchTerm, selectedChannel, statusFilter]);

    const deleteSubscription = async (id: number) => {
        if (!confirm("Bu aboneliği silmek istediğinizden emin misiniz?")) return;
        await fetch("/api/subscriptions", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
        });
        fetchSubscriptions();
    };

    const toggleSubscriptionStatus = async (id: number, isActive: boolean) => {
        await fetch("/api/subscriptions", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, isActive: !isActive }),
        });
        fetchSubscriptions();
    };

    const copyEndpoint = (endpoint: string, id: number) => {
        navigator.clipboard.writeText(endpoint);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const getChannel = (slug: string) => channels.find(ch => ch.slug === slug);

    const truncateEndpoint = (endpoint: string) => {
        if (endpoint.length > 50) {
            return endpoint.substring(0, 25) + "..." + endpoint.substring(endpoint.length - 20);
        }
        return endpoint;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Az önce";
        if (diffMins < 60) return `${diffMins} dk önce`;
        if (diffHours < 24) return `${diffHours} saat önce`;
        if (diffDays < 7) return `${diffDays} gün önce`;
        return date.toLocaleDateString("tr-TR");
    };

    const formatUserAgent = (userAgent: string) => {
        if (userAgent.includes("Chrome")) return "Chrome";
        if (userAgent.includes("Firefox")) return "Firefox";
        if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) return "Safari";
        if (userAgent.includes("Edge")) return "Edge";
        if (userAgent.includes("Mobile")) return "Mobile";
        return "Diğer";
    };

    return (
        <div className="p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-400" />
                    Abonelikler
                    <span className="text-sm font-normal text-gray-400">
                        ({pagination.total} toplam)
                    </span>
                </h3>
                <button
                    onClick={fetchSubscriptions}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                    title="Yenile"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setPagination(prev => ({ ...prev, page: 1 }));
                        }}
                        placeholder="Endpoint ara..."
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                    />
                </div>

                <select
                    value={selectedChannel}
                    onChange={(e) => {
                        setSelectedChannel(e.target.value);
                        setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 cursor-pointer"
                >
                    <option value="all">Tüm Kanallar</option>
                    {channels.map((channel) => (
                        <option key={channel.id} value={channel.slug}>
                            {channel.name}
                        </option>
                    ))}
                </select>

                <select
                    value={statusFilter}
                    onChange={(e) => {
                        setStatusFilter(e.target.value as any);
                        setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 cursor-pointer"
                >
                    <option value="all">Tüm Durumlar</option>
                    <option value="active">Aktif</option>
                    <option value="inactive">Pasif</option>
                </select>
            </div>

            {/* Subscription List */}
            <div className="space-y-2">
                {loading ? (
                    <p className="text-gray-500 text-sm text-center py-4">Yükleniyor...</p>
                ) : subscriptions.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">
                        {searchTerm || selectedChannel !== "all" || statusFilter !== "all"
                            ? "Sonuç bulunamadı."
                            : "Henüz abonelik yok."}
                    </p>
                ) : (
                    subscriptions.map((subscription) => {
                        const channel = getChannel(subscription.channelSlug);
                        return (
                            <div
                                key={subscription.id}
                                className="p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors group"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => toggleSubscriptionStatus(subscription.id, subscription.isActive)}
                                            className={`p-1.5 rounded-lg transition-colors ${
                                                subscription.isActive
                                                    ? "bg-green-600/20 text-green-400 hover:bg-green-600/30"
                                                    : "bg-gray-600/20 text-gray-400 hover:bg-gray-600/30"
                                            }`}
                                            title={subscription.isActive ? "Pasife al" : "Aktife al"}
                                        >
                                            {subscription.isActive ? (
                                                <Check className="w-4 h-4" />
                                            ) : (
                                                <X className="w-4 h-4" />
                                            )}
                                        </button>
                                        <div>
                                            <p className="text-sm font-medium">
                                                {channel && (
                                                    <span
                                                        className="inline-block w-2 h-2 rounded-full mr-1"
                                                        style={{ backgroundColor: channel.color }}
                                                    />
                                                )}
                                                {channel?.name || subscription.channelSlug}
                                            </p>
                                            <p className="text-xs text-gray-500 font-mono">
                                                ID: {subscription.id}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => copyEndpoint(subscription.endpoint, subscription.id)}
                                            className="p-1.5 text-gray-400 hover:text-white transition-colors"
                                            title="Endpoint kopyala"
                                        >
                                            {copiedId === subscription.id ? (
                                                <Check className="w-4 h-4 text-green-400" />
                                            ) : (
                                                <Globe className="w-4 h-4" />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => deleteSubscription(subscription.id)}
                                            className="p-1.5 text-red-400 hover:text-red-300 transition-colors opacity-0 group-hover:opacity-100"
                                            title="Sil"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1 text-xs">
                                    <p
                                        className="text-gray-400 font-mono truncate cursor-pointer hover:text-blue-400"
                                        onClick={() => copyEndpoint(subscription.endpoint, subscription.id)}
                                        title={subscription.endpoint}
                                    >
                                        {truncateEndpoint(subscription.endpoint)}
                                    </p>
                                    <div className="flex items-center gap-3 text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {formatDate(subscription.lastUsedAt)}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Globe className="w-3 h-3" />
                                            {formatUserAgent(subscription.userAgent)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Pagination */}
            {pagination.total > pagination.limit && (
                <div className="mt-4 flex items-center justify-center gap-1">
                    <button
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        disabled={pagination.page === 1}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 transition-all"
                    >
                        <span className="text-sm">←</span>
                    </button>
                    <span className="text-sm text-gray-400">
                        Sayfa {pagination.page} / {Math.ceil(pagination.total / pagination.limit)}
                    </span>
                    <button
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 transition-all"
                    >
                        <span className="text-sm">→</span>
                    </button>
                </div>
            )}
        </div>
    );
}
