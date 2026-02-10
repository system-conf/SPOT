"use client";

import { useEffect, useState } from "react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

export default function PushSetup() {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [subscription, setSubscription] = useState<PushSubscription | null>(null);
    const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

    useEffect(() => {
        if ("serviceWorker" in navigator && "PushManager" in window) {
            navigator.serviceWorker.register("/custom-sw.js").then((reg) => {
                setRegistration(reg);
                reg.pushManager.getSubscription().then((sub) => {
                    if (sub) {
                        setIsSubscribed(true);
                        setSubscription(sub);
                    }
                });
            });
        }
    }, []);

    const subscribeToPush = async () => {
        try {
            if (!registration) return;

            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });

            const response = await fetch("/api/subscription", {
                method: "POST",
                body: JSON.stringify(sub),
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (response.ok) {
                setIsSubscribed(true);
                setSubscription(sub);
                alert("Bildirimler başarıyla açıldı!");
            }
        } catch (error) {
            console.error("Subscription failed:", error);
            alert("Bildirim kurgulanamadı. Lütfen izini kontrol et.");
        }
    };

    const urlBase64ToUint8Array = (base64String: string) => {
        const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    };

    return (
        <div className="flex flex-col items-center gap-4 p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
            <h2 className="text-xl font-bold text-white">Bildirim Ayarları</h2>
            <p className="text-gray-400 text-center text-sm">
                Webhook bildirimlerini almak için lütfen bildirimleri etkinleştirin.
            </p>

            {isSubscribed ? (
                <div className="text-green-400 font-medium flex items-center gap-2">
                    <span>✓</span> Bildirimler Aktif
                </div>
            ) : (
                <button
                    onClick={subscribeToPush}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-full font-semibold transition-all shadow-lg shadow-blue-900/40"
                >
                    Bildirimleri Aç
                </button>
            )}
        </div>
    );
}
