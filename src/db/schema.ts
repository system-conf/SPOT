import { mysqlTable, int, varchar, timestamp, boolean } from "drizzle-orm/mysql-core";
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
    endpoint: varchar("endpoint", { length: 512 }).notNull().unique(),
    p256dh: varchar("p256dh", { length: 256 }).notNull(),
    auth: varchar("auth", { length: 128 }).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});

// ─── Notifications ───────────────────────────────────────
export const notifications = mysqlTable("notifications", {
    id: int("id").autoincrement().primaryKey(),
    channelId: int("channel_id"),
    title: varchar("title", { length: 256 }).notNull(),
    body: varchar("body", { length: 1024 }).notNull(),
    icon: varchar("icon", { length: 512 }),
    url: varchar("url", { length: 512 }),
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
    url: varchar("url", { length: 512 }),
    scheduledAt: timestamp("scheduled_at").notNull(),
    timezone: varchar("timezone", { length: 64 }).default("Europe/Istanbul"),
    repeat: varchar("repeat", { length: 16 }).default("none"), // none, daily, weekly, monthly
    status: varchar("status", { length: 16 }).notNull().default("pending"), // pending, sent, cancelled
    createdAt: timestamp("created_at").defaultNow(),
});

// ─── Relations ───────────────────────────────────────────
export const channelsRelations = relations(channels, ({ many }) => ({
    notifications: many(notifications),
    scheduledNotifications: many(scheduledNotifications),
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

// ─── Types ───────────────────────────────────────────────
export type Channel = typeof channels.$inferSelect;
export type NewChannel = typeof channels.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type ScheduledNotification = typeof scheduledNotifications.$inferSelect;
export type NewScheduledNotification = typeof scheduledNotifications.$inferInsert;

