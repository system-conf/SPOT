"use client";
import { useState, useEffect } from "react";
import { Activity } from "lucide-react";

type Stats = {
    total: number;
    sent: number;
    failed: number;
    successRate: number;
    channelStats: { name: string; color: string; count: number }[];
    dailyStats: { date: string; count: number }[];
};

export default function AnalyticsDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/stats")
            .then((r) => r.json())
            .then((data) => {
                setStats(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 animate-pulse">
                <div className="h-6 bg-white/10 rounded w-40 mb-4" />
                <div className="grid grid-cols-3 gap-3">
                    <div className="h-20 bg-white/5 rounded-xl" />
                    <div className="h-20 bg-white/5 rounded-xl" />
                    <div className="h-20 bg-white/5 rounded-xl" />
                </div>
            </div>
        );
    }

    if (!stats) return null;

    const maxDaily = Math.max(...(stats.dailyStats.map((d) => d.count) || [1]), 1);

    return (
        <div className="p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
            <h3 className="text-lg font-bold mb-5 flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-400" />
                İstatistikler
            </h3>

            {/* Stat Cards */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-white/5 rounded-xl p-4 text-center">
                    <p className="text-3xl font-black text-white">{stats.total}</p>
                    <p className="text-[11px] text-gray-500 mt-1">Toplam</p>
                </div>
                <div className="bg-green-500/5 rounded-xl p-4 text-center border border-green-500/10">
                    <p className="text-3xl font-black text-green-400">{stats.sent}</p>
                    <p className="text-[11px] text-gray-500 mt-1">Başarılı</p>
                </div>
                <div className="bg-red-500/5 rounded-xl p-4 text-center border border-red-500/10">
                    <p className="text-3xl font-black text-red-400">{stats.failed}</p>
                    <p className="text-[11px] text-gray-500 mt-1">Başarısız</p>
                </div>
            </div>

            {/* Success Rate */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-400">Başarı Oranı</span>
                    <span className="text-sm font-bold text-green-400">{stats.successRate}%</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-1000"
                        style={{ width: `${stats.successRate}%` }}
                    />
                </div>
            </div>

            {/* 7-Day Activity */}
            {stats.dailyStats.length > 0 && (
                <div className="mb-6">
                    <p className="text-xs text-gray-400 mb-3">Son 7 Gün</p>
                    <div className="flex items-end gap-1 h-16">
                        {stats.dailyStats.map((day, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                <div
                                    className="w-full bg-blue-500/60 rounded-t hover:bg-blue-400/80 transition-colors cursor-default"
                                    style={{
                                        height: `${Math.max((day.count / maxDaily) * 100, 8)}%`,
                                    }}
                                    title={`${day.date}: ${day.count} bildirim`}
                                />
                                <span className="text-[8px] text-gray-600">
                                    {new Date(day.date).toLocaleDateString("tr-TR", { weekday: "short" })}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Channel Distribution */}
            {stats.channelStats.length > 0 && (
                <div>
                    <p className="text-xs text-gray-400 mb-3">Kanal Dağılımı</p>
                    <div className="space-y-2">
                        {stats.channelStats.map((ch, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <div
                                    className="w-2 h-2 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: ch.color }}
                                />
                                <span className="text-xs text-gray-300 flex-1">{ch.name}</span>
                                <span className="text-xs font-mono text-gray-500">{ch.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
