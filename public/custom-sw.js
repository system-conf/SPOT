// SPOT Custom Service Worker
// Handles push notifications with action buttons

self.addEventListener("push", (event) => {
    if (!event.data) return;

    const data = event.data.json();
    const title = data.title || "SPOT Bildirimi";

    const options = {
        body: data.body || "",
        icon: data.icon || "/icons/icon.svg",
        badge: "/icons/icon.svg",
        tag: "spot-" + Date.now(),
        data: {
            url: data.url || "/",
            actions: data.actions || [],
        },
        // Action buttons (max 2 on most platforms)
        actions: (data.actions || []).slice(0, 2).map((action) => ({
            action: action.action || action.title?.toLowerCase().replace(/\s+/g, "-"),
            title: action.title,
            icon: action.icon || undefined,
        })),
        vibrate: [200, 100, 200],
        requireInteraction: data.requireInteraction || false,
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification click (body or default)
self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    const data = event.notification.data || {};
    let targetUrl = data.url || "/";

    // If an action button was clicked
    if (event.action) {
        const actions = data.actions || [];
        const clickedAction = actions.find(
            (a) => (a.action || a.title?.toLowerCase().replace(/\s+/g, "-")) === event.action
        );
        if (clickedAction && clickedAction.url) {
            targetUrl = clickedAction.url;
        }
    }

    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
            // If a window is already open, focus it
            for (const client of clientList) {
                if (client.url === targetUrl && "focus" in client) {
                    return client.focus();
                }
            }
            // Otherwise open a new window
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});

// Handle notification close (for future analytics)
self.addEventListener("notificationclose", (event) => {
    // Can be used for tracking dismissed notifications
    console.log("[SPOT] Notification dismissed:", event.notification.tag);
});
