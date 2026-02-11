"use client";
import { useState, useEffect } from "react";
import { Bell, Search, RefreshCw, ChevronDown, CheckCircle, XCircle, Clock, Filter } from "lucide-react";
import Pagination from "./Pagination";
import NotificationFilters from "./NotificationFilters";

type Notification = {
    id: number;
    channelId: number;
    channelSlug: string;
    title: string;
    body: string;
    status: "success" | "error" | "pending";
    error?: string;
    createdAt: string;
};

type Channel = {
    id: number;
    name: string;
    slug: string;
    color: string;
};

type FilterState = {
    channelId?: number;
    status?: "success" | "error" | "pending";
    startDate?: string;
    endDate?: string;
    search?: string;
    sortBy?: "createdAt" | "status" | "channelId";
    sortOrder?: "asc" | "desc";
};

export default function NotificationHistory() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [channels, setChannels] = useState<Channel[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState<FilterState>({});

    const fetchChannels = async () => {
        const res = await fetch("/api/channels");
        const data = await res.json();
        setChannels(data);
    };

    const fetchNotifications = async () => {
        setLoading(true);
        const params = new URLSearchParams({
            page: currentPage.toString(),
            limit: "20",
        });

        // Add filters
        if (filters.channelId) params.append("channelId", filters.channelId.toString());
        if (filters.status) params.append("status", filters.status);
        if (filters.startDate) params.append("startDate", filters.startDate);
        if (filters.endDate) params.append("endDate", filters.endDate);
        if (filters.search) params.append("search", filters.search);
        if (filters.sortBy) params.append("sortBy", filters.sortBy);
        if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);

        const res = await fetch(`/api/notifications?${params.toString()}`);
        const data = await res.json();
        setNotifications(data.notifications || []);
        setTotalPages(data.totalPages || 1);
        setLoading(false);
    };

    useEffect(() => {
        fetchChannels();
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [currentPage, filters]);

    const getChannel = (id: number) => channels.find(ch => ch.id === id);

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
        return date.toLocaleDateString("tr-TR", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "success":
                return <CheckCircle className="w-5 h-5 text-green-400" />;
            case "error":
                return <XCircle className="w-5 h-5 text-red-400" />;
            case "pending":
                return <Clock className="w-5 h-5 text-yellow-400" />;
            default:
                return null;
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case "success":
                return "Başarılı";
            case "error":
                return "Hata";
            case "pending":
                return "Bekliyor";
            default:
                return status;
        }
    };

    return (
        <div className="p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <Bell className="w-5 h-5 text-yellow-400" />
                    Bildirim Geçmişi
                </h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2 rounded-lg transition-colors ${
                            showFilters
                                ? "bg-blue-600 text-white"
                                : "bg-white/5 hover:bg-white/10"
                        }`}
                        title="Filtreler"
                    >
                        <Filter className="w-4 h-4" />
                    </button>
                    <button
                        onClick={fetchNotifications}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                        title="Yenile"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Filters */}
            {showFilters && (
                <div className="mb-4">
                    <NotificationFilters
                        filters={filters}
                        onFiltersChange={(newFilters) => {
                            setFilters(newFilters);
                            setCurrentPage(1);
                        }}
                        channels={channels}
                    />
                </div>
            )}

            {/* Notification List */}
            <div className="space-y-2">
                {loading ? (
                    <p className="text-gray-500 text-sm text-center py-4">Yükleniyor...</p>
                ) : notifications.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">
                        {Object.keys(filters).length > 0
                            ? "Sonuç bulunamadı."
                            : "Henüz bildirim yok."}
                    </p>
                ) : (
                    notifications.map((notification) => {
                        const channel = getChannel(notification.channelId);
                        return (
                            <div
                                key={notification.id}
                                className="p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        {getStatusIcon(notification.status)}
                                        <div>
                                            <p className="text-sm font-medium">{notification.title}</p>
                                            <p className="text-xs text-gray-400 mt-1">{notification.body}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500">{formatDate(notification.createdAt)}</p>
                                        {channel && (
                                            <div className="flex items-center gap-1 justify-end mt-1">
                                                <span
                                                    className="w-2 h-2 rounded-full"
                                                    style={{ backgroundColor: channel.color }}
                                                />
                                                <span className="text-xs text-gray-400">{channel.name}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {notification.status === "error" && notification.error && (
                                    <div className="mt-2 p-2 bg-red-600/10 border border-red-600/20 rounded-lg">
                                        <p className="text-xs text-red-400 font-mono">{notification.error}</p>
                                    </div>
                                )}

                                <div className="mt-2 flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                        notification.status === "success"
                                            ? "bg-green-600/20 text-green-400"
                                            : notification.status === "error"
                                            ? "bg-red-600/20 text-red-400"
                                            : "bg-yellow-600/20 text-yellow-400"
                                    }`}>
                                        {getStatusText(notification.status)}
                                    </span>
                                    <span className="text-xs text-gray-500">ID: {notification.id}</span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-4">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}
        </div>
    );
}
