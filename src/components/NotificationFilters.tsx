"use client";
import { Filter, X, Calendar, Search, ChevronDown } from "lucide-react";

type FilterState = {
    channelId?: number;
    status?: "success" | "error" | "pending";
    startDate?: string;
    endDate?: string;
    search?: string;
    sortBy?: "createdAt" | "status" | "channelId";
    sortOrder?: "asc" | "desc";
};

type NotificationFiltersProps = {
    filters: FilterState;
    onFiltersChange: (filters: FilterState) => void;
    channels?: Array<{ id: number; name: string; color: string }>;
};

export default function NotificationFilters({
    filters,
    onFiltersChange,
    channels = [],
}: NotificationFiltersProps) {
    const updateFilter = (key: keyof FilterState, value: any) => {
        onFiltersChange({ ...filters, [key]: value });
    };

    const clearFilter = (key: keyof FilterState) => {
        const newFilters = { ...filters };
        delete newFilters[key];
        onFiltersChange(newFilters);
    };

    const clearAllFilters = () => {
        onFiltersChange({});
    };

    const hasActiveFilters = Object.keys(filters).length > 0;

    return (
        <div className="p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <Filter className="w-5 h-5 text-purple-400" />
                    Filtreler
                </h3>
                {hasActiveFilters && (
                    <button
                        onClick={clearAllFilters}
                        className="text-xs px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors flex items-center gap-1"
                    >
                        <X className="w-3 h-3" />
                        Tümünü Temizle
                    </button>
                )}
            </div>

            <div className="space-y-3">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        value={filters.search || ""}
                        onChange={(e) => updateFilter("search", e.target.value || undefined)}
                        placeholder="İçerik ara..."
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-8 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                    />
                    {filters.search && (
                        <button
                            onClick={() => clearFilter("search")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Channel Filter */}
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Kanal</label>
                    <div className="relative">
                        <select
                            value={filters.channelId || ""}
                            onChange={(e) => updateFilter("channelId", e.target.value ? Number(e.target.value) : undefined)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white appearance-none focus:outline-none focus:border-blue-500/50 transition-colors cursor-pointer"
                        >
                            <option value="">Tüm Kanallar</option>
                            {channels.map((channel) => (
                                <option key={channel.id} value={channel.id}>
                                    {channel.name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                </div>

                {/* Status Filter */}
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Durum</label>
                    <div className="relative">
                        <select
                            value={filters.status || ""}
                            onChange={(e) => updateFilter("status", e.target.value as any || undefined)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white appearance-none focus:outline-none focus:border-blue-500/50 transition-colors cursor-pointer"
                        >
                            <option value="">Tüm Durumlar</option>
                            <option value="success">Başarılı</option>
                            <option value="error">Hata</option>
                            <option value="pending">Bekliyor</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                </div>

                {/* Date Range */}
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Tarih Aralığı</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="date"
                                value={filters.startDate || ""}
                                onChange={(e) => updateFilter("startDate", e.target.value || undefined)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-3 py-2 text-sm text-white appearance-none focus:outline-none focus:border-blue-500/50 transition-colors cursor-pointer"
                            />
                        </div>
                        <div className="relative flex-1">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="date"
                                value={filters.endDate || ""}
                                onChange={(e) => updateFilter("endDate", e.target.value || undefined)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-3 py-2 text-sm text-white appearance-none focus:outline-none focus:border-blue-500/50 transition-colors cursor-pointer"
                            />
                        </div>
                    </div>
                </div>

                {/* Sort */}
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Sıralama</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <select
                                value={filters.sortBy || "createdAt"}
                                onChange={(e) => updateFilter("sortBy", e.target.value as any)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white appearance-none focus:outline-none focus:border-blue-500/50 transition-colors cursor-pointer"
                            >
                                <option value="createdAt">Tarih</option>
                                <option value="status">Durum</option>
                                <option value="channelId">Kanal</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                        </div>
                        <div className="relative flex-1">
                            <select
                                value={filters.sortOrder || "desc"}
                                onChange={(e) => updateFilter("sortOrder", e.target.value as any)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white appearance-none focus:outline-none focus:border-blue-500/50 transition-colors cursor-pointer"
                            >
                                <option value="desc">Azalan</option>
                                <option value="asc">Artan</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Active Filters Summary */}
                {hasActiveFilters && (
                    <div className="pt-3 border-t border-white/10">
                        <p className="text-xs text-gray-400 mb-2">Aktif Filtreler:</p>
                        <div className="flex flex-wrap gap-1">
                            {Object.entries(filters).map(([key, value]) => (
                                <span
                                    key={key}
                                    className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs flex items-center gap-1"
                                >
                                    {key}: {String(value)}
                                    <button
                                        onClick={() => clearFilter(key as keyof FilterState)}
                                        className="hover:text-white transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
