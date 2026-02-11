import { mysqlTable, int, varchar, timestamp, boolean, text } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

// ─── Channels ────────────────────────────────────────────
export const channels = mysqlTable("channels", {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 64 }).notNull(),
    slug: varchar("slug", { length: 64 }).notNull().unique(),
    apiKey: varchar("api_key", { length: 64 }).notNull().unique(),
    color: varchar("color", { length: 7 }).notNull().default("#3B82F6"),
    icon: varchar("icon", { length: 32 }).default("bell"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow(),
});

// ─── Subscriptions ───────────────────────────────────────
export const subscriptions = mysqlTable("subscriptions", {
    id: int("id").autoincrement().primaryKey(),
    channelId: int("channel_id"), // Which channel this subscription belongs to
    endpoint: varchar("endpoint", { length: 512 }).notNull().unique(),
    p256dh: varchar("p256dh", { length: 256 }).notNull(),
    auth: varchar("auth", { length: 128 }).notNull(),
    userAgent: varchar("user_agent", { length: 512 }),
    isActive: boolean("is_active").notNull().default(true),
    lastUsedAt: timestamp("last_used_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// ─── Notifications ───────────────────────────────────────
export const notifications = mysqlTable("notifications", {
    id: int("id").autoincrement().primaryKey(),
    channelId: int("channel_id"),
    title: varchar("title", { length: 256 }).notNull(),
    body: varchar("body", { length: 1024 }).notNull(),
    icon: varchar("icon", { length: 512 }),
    image: varchar("image", { length: 512 }),
    badge: varchar("badge", { length: 512 }),
    url: varchar("url", { length: 512 }),
    actions: text("actions"), // JSON string of actions
    requireInteraction: boolean("require_interaction").default(false),
    status: varchar("status", { length: 16 }).notNull().default("sent"),
    sentAt: timestamp("sent_at").defaultNow(),
});

// ─── Scheduled Notifications ─────────────────────────────
export const scheduledNotifications = mysqlTable("scheduled_notifications", {
    id: int("id").autoincrement().primaryKey(),
    channelId: int("channel_id"),
    title: varchar("title", { length: 256 }).notNull(),
    body: varchar("body", { length: 1024 }).notNull(),
    icon: varchar("icon", { length: 512 }),
    image: varchar("image", { length: 512 }),
    badge: varchar("badge", { length: 512 }),
    url: varchar("url", { length: 512 }),
    actions: text("actions"), // JSON string of actions
    requireInteraction: boolean("require_interaction").default(false),
    scheduledAt: timestamp("scheduled_at").notNull(),
    timezone: varchar("timezone", { length: 64 }).default("Europe/Istanbul"),
    repeat: varchar("repeat", { length: 16 }).default("none"), // none, daily, weekly, monthly
    status: varchar("status", { length: 16 }).notNull().default("pending"), // pending, sent, cancelled
    createdAt: timestamp("created_at").defaultNow(),
});

// ─── Notification Templates ─────────────────────────────
export const notificationTemplates = mysqlTable("notification_templates", {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 64 }).notNull(),
    slug: varchar("slug", { length: 64 }).notNull().unique(),
    channelId: int("channel_id"),
    title: varchar("title", { length: 256 }).notNull(),
    body: varchar("body", { length: 1024 }).notNull(),
    icon: varchar("icon", { length: 512 }),
    image: varchar("image", { length: 512 }),
    url: varchar("url", { length: 512 }),
    badge: varchar("badge", { length: 512 }),
    actions: text("actions"), // JSON string of actions
    variables: text("variables"), // JSON string of allowed variables
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// ─── Security Logs ─────────────────────────────────────
export const securityLogs = mysqlTable("security_logs", {
    id: int("id").autoincrement().primaryKey(),
    ip: varchar("ip", { length: 64 }).notNull(),
    userAgent: varchar("user_agent", { length: 512 }),
    method: varchar("method", { length: 8 }).notNull(),
    path: varchar("path", { length: 256 }).notNull(),
    event: varchar("event", { length: 64 }).notNull(),
    status: int("status"),
    details: text("details"), // JSON string of additional details
    createdAt: timestamp("created_at").defaultNow(),
});

// ─── Relations ───────────────────────────────────────────
export const channelsRelations = relations(channels, ({ many }) => ({
    notifications: many(notifications),
    scheduledNotifications: many(scheduledNotifications),
    notificationTemplates: many(notificationTemplates),
    subscriptions: many(subscriptions),
}));

export const securityLogsRelations = relations(securityLogs, ({ one }) => ({
    // No relations needed for security logs
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
    channel: one(channels, {
        fields: [subscriptions.channelId],
        references: [channels.id],
    }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
    channel: one(channels, {
        fields: [notifications.channelId],
        references: [channels.id],
    }),
}));

export const scheduledNotificationsRelations = relations(scheduledNotifications, ({ one }) => ({
    channel: one(channels, {
        fields: [scheduledNotifications.channelId],
        references: [channels.id],
    }),
}));

export const notificationTemplatesRelations = relations(notificationTemplates, ({ one }) => ({
    channel: one(channels, {
        fields: [notificationTemplates.channelId],
        references: [channels.id],
    }),
}));

// ─── Types ───────────────────────────────────────────────
export type Channel = typeof channels.$inferSelect;
export type NewChannel = typeof channels.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type ScheduledNotification = typeof scheduledNotifications.$inferSelect;
export type NewScheduledNotification = typeof scheduledNotifications.$inferInsert;
export type NotificationTemplate = typeof notificationTemplates.$inferSelect;
export type NewNotificationTemplate = typeof notificationTemplates.$inferInsert;
export type SecurityLog = typeof securityLogs.$inferSelect;
export type NewSecurityLog = typeof securityLogs.$inferInsert;

// ─── Template Types ─────────────────────────────────────
export interface TemplateVariable {
    name: string;
    type: "text" | "url" | "number";
    required: boolean;
    defaultValue?: string;
}

export interface TemplateAction {
    title: string;
    url?: string;
    icon?: string;
}

