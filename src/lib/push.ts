import webpush from "web-push";

const vapidKeys = {
    publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    privateKey: process.env.VAPID_PRIVATE_KEY!,
};

webpush.setVapidDetails(
    process.env.VAPID_EMAIL!,
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

export type PushAction = {
    action?: string;
    title: string;
    url?: string;
    icon?: string;
};

export type PushPayload = {
    title: string;
    body: string;
    icon?: string;
    url?: string;
    actions?: PushAction[];
    requireInteraction?: boolean;
};


export async function sendPushNotification(
    subscription: { endpoint: string; p256dh: string; auth: string },
    payload: PushPayload
) {
    try {
        const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth,
            },
        };

        await webpush.sendNotification(
            pushSubscription,
            JSON.stringify(payload)
        );
        return { success: true };
    } catch (error: any) {
        if (error.statusCode === 404 || error.statusCode === 410) {
            console.log("Subscription has expired or is no longer valid:", subscription.endpoint);
            return { success: false, expired: true };
        }
        console.error("Error sending push notification:", error);
        return { success: false, error };
    }
}
