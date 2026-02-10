"use client";
import { useState, useEffect } from "react";
import { Radio, Key, Check, Trash2 } from "lucide-react";

type Channel = {
    id: number;
    name: string;
    slug: string;
    apiKey: string;
    color: string;
    icon: string;
    isActive: boolean;
};

export default function ChannelManager() {
    const [channels, setChannels] = useState<Channel[]>([]);
    const [newName, setNewName] = useState("");
    const [newColor, setNewColor] = useState("#3B82F6");
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState<number | null>(null);

    const fetchChannels = async () => {
        const res = await fetch("/api/channels");
        const data = await res.json();
        setChannels(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchChannels();
    }, []);

    const createChannel = async () => {
        if (!newName.trim()) return;
        await fetch("/api/channels", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newName, color: newColor }),
        });
        setNewName("");
        setNewColor("#3B82F6");
        fetchChannels();
    };

    const deleteChannel = async (id: number) => {
        if (!confirm("Bu kanalı silmek istediğinizden emin misiniz?")) return;
        await fetch("/api/channels", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
        });
        fetchChannels();
    };

    const copyKey = (apiKey: string, id: number) => {
        navigator.clipboard.writeText(apiKey);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Radio className="w-5 h-5 text-purple-400" />
                Kanallar
            </h3>

            {/* Create New Channel */}
            <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Kanal adı (ör: Prod Hataları)"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                    onKeyDown={(e) => e.key === "Enter" && createChannel()}
                />
                <input
                    type="color"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border border-white/10"
                />
                <button
                    onClick={createChannel}
                    disabled={!newName.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 rounded-xl text-sm font-medium transition-all"
                >
                    Ekle
                </button>
            </div>

            {/* Channel List */}
            <div className="space-y-2">
                {loading ? (
                    <p className="text-gray-500 text-sm text-center py-4">Yükleniyor...</p>
                ) : channels.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">Henüz kanal yok.</p>
                ) : (
                    channels.map((ch) => (
                        <div
                            key={ch.id}
                            className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: ch.color }}
                                />
                                <div>
                                    <span className="text-sm font-medium">{ch.name}</span>
                                    <span className="text-[10px] text-gray-500 ml-2 font-mono">/{ch.slug}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => copyKey(ch.apiKey, ch.id)}
                                    className="text-xs px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg font-mono text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                                >
                                    {copiedId === ch.id ? (
                                        <>
                                            <Check className="w-3 h-3 text-green-400" />
                                            <span>Kopyalandı!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Key className="w-3 h-3" />
                                            <span>API Key</span>
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => deleteChannel(ch.id)}
                                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all text-xs px-2 py-1"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
