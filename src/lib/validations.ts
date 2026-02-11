// ─── Validation Schemas ───────────────────────────────────────────
import { z } from "zod";

// ─── Notification Validation ─────────────────────────────────────
export const notificationSchema = z.object({
    title: z.string().min(1, "Title is required").max(256, "Title must be less than 256 characters"),
    body: z.string().min(1, "Body is required").max(1024, "Body must be less than 1024 characters"),
    icon: z.string().url().optional().nullable(),
    image: z.string().url().optional().nullable(),
    badge: z.string().url().optional().nullable(),
    url: z.string().url().optional().nullable(),
    actions: z.array(z.object({
        action: z.string().optional(),
        title: z.string(),
        url: z.string().url(),
        icon: z.string().optional(),
    })).optional().nullable(),
    requireInteraction: z.boolean().optional(),
});

// ─── Template Notification Validation ────────────────────────────
export const templateNotificationSchema = z.object({
    templateId: z.number().int().positive("Template ID must be a positive integer"),
    variables: z.record(z.any()).optional(),
});

// ─── Channel Validation ───────────────────────────────────────
export const channelSchema = z.object({
    name: z.string().min(1, "Channel name is required").max(64, "Channel name must be less than 64 characters"),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color").default("#3B82F6"),
    icon: z.string().max(32, "Icon must be less than 32 characters").default("bell"),
});

// ─── Template Validation ───────────────────────────────────────
export const templateSchema = z.object({
    name: z.string().min(1, "Template name is required").max(64, "Template name must be less than 64 characters"),
    channelId: z.number().int().positive().nullable().optional(),
    title: z.string().min(1, "Title is required").max(256, "Title must be less than 256 characters"),
    body: z.string().min(1, "Body is required").max(1024, "Body must be less than 1024 characters"),
    icon: z.string().max(512, "Icon must be less than 512 characters").optional().nullable(),
    image: z.string().url().max(512, "Image must be a valid URL").optional().nullable(),
    url: z.string().url().max(512, "URL must be a valid URL").optional().nullable(),
    badge: z.string().url().max(512, "Badge must be a valid URL").optional().nullable(),
    actions: z.array(z.object({
        action: z.string().optional(),
        title: z.string(),
        url: z.string().url(),
        icon: z.string().optional(),
    })).optional().nullable(),
    variables: z.array(z.object({
        name: z.string(),
        type: z.enum(["text", "url", "number"]),
        required: z.boolean(),
        defaultValue: z.string().optional(),
    })).optional().nullable(),
});

// ─── Scheduled Notification Validation ────────────────────────
export const scheduledNotificationSchema = z.object({
    channelId: z.number().int().positive().nullable().optional(),
    title: z.string().min(1, "Title is required").max(256, "Title must be less than 256 characters"),
    body: z.string().min(1, "Body is required").max(1024, "Body must be less than 1024 characters"),
    icon: z.string().max(512, "Icon must be less than 512 characters").optional().nullable(),
    image: z.string().url().max(512, "Image must be a valid URL").optional().nullable(),
    badge: z.string().url().max(512, "Badge must be a valid URL").optional().nullable(),
    url: z.string().url().max(512, "URL must be a valid URL").optional().nullable(),
    actions: z.array(z.object({
        action: z.string().optional(),
        title: z.string(),
        url: z.string().url(),
        icon: z.string().optional(),
    })).optional().nullable(),
    requireInteraction: z.boolean().optional(),
    scheduledAt: z.string().datetime("Scheduled time must be a valid ISO datetime"),
    timezone: z.string().max(64, "Timezone must be less than 64 characters").default("Europe/Istanbul"),
    repeat: z.enum(["none", "daily", "weekly", "monthly"]).default("none"),
});

// ─── Subscription Validation ─────────────────────────────────
export const subscriptionSchema = z.object({
    channelId: z.number().int().positive().nullable().optional(),
    endpoint: z.string().url("Endpoint must be a valid URL").max(512, "Endpoint must be less than 512 characters"),
    p256dh: z.string().min(1, "p256dh is required").max(256, "p256dh must be less than 256 characters"),
    auth: z.string().min(1, "auth is required").max(128, "auth must be less than 128 characters"),
    userAgent: z.string().max(512, "User agent must be less than 512 characters").optional().nullable(),
    isActive: z.boolean().default(true),
});

// ─── Types ───────────────────────────────────────────────────
export type NotificationInput = z.infer<typeof notificationSchema>;
export type TemplateNotificationInput = z.infer<typeof templateNotificationSchema>;
export type ChannelInput = z.infer<typeof channelSchema>;
export type TemplateInput = z.infer<typeof templateSchema>;
export type ScheduledNotificationInput = z.infer<typeof scheduledNotificationSchema>;
export type SubscriptionInput = z.infer<typeof subscriptionSchema>;

// ─── Validation Helper ───────────────────────────────────────
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): { success: boolean; data?: T; error?: string } {
    const result = schema.safeParse(data);
    
    if (result.success) {
        return { success: true, data: result.data };
    }
    
    const errorMessages = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    return { success: false, error: errorMessages };
}
