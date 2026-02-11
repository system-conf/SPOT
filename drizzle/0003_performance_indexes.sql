-- ─── Performance Indexes Migration ───────────────────────────────────────
-- Bu migration, sorgu performansını artırmak için index'ler ekler

-- ─── Channels Table Indexes ───────────────────────────────────────────
-- API key lookup için index
CREATE INDEX IF NOT EXISTS idx_channels_api_key ON channels(api_key);
-- Slug lookup için index
CREATE INDEX IF NOT EXISTS idx_channels_slug ON channels(slug);
-- Active status için index
CREATE INDEX IF NOT EXISTS idx_channels_is_active ON channels(is_active);

-- ─── Subscriptions Table Indexes ───────────────────────────────────────
-- Channel ID lookup için index
CREATE INDEX IF NOT EXISTS idx_subscriptions_channel_id ON subscriptions(channel_id);
-- Active status için index
CREATE INDEX IF NOT EXISTS idx_subscriptions_is_active ON subscriptions(is_active);
-- Last used at için index (cleanup için)
CREATE INDEX IF NOT EXISTS idx_subscriptions_last_used_at ON subscriptions(last_used_at);
-- Composite index: active subscriptions by channel
CREATE INDEX IF NOT EXISTS idx_subscriptions_channel_active ON subscriptions(channel_id, is_active);

-- ─── Notifications Table Indexes ───────────────────────────────────────
-- Channel ID lookup için index
CREATE INDEX IF NOT EXISTS idx_notifications_channel_id ON notifications(channel_id);
-- Status lookup için index
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
-- Sent at için index (recent notifications ve stats için)
CREATE INDEX IF NOT EXISTS idx_notifications_sent_at ON notifications(sent_at);
-- Composite index: notifications by channel and status
CREATE INDEX IF NOT EXISTS idx_notifications_channel_status ON notifications(channel_id, status);
-- Composite index: recent notifications by sent_at
CREATE INDEX IF NOT EXISTS idx_notifications_sent_at_desc ON notifications(sent_at DESC);

-- ─── Scheduled Notifications Table Indexes ───────────────────────────────
-- Channel ID lookup için index
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_channel_id ON scheduled_notifications(channel_id);
-- Scheduled at için index (cron job için)
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_scheduled_at ON scheduled_notifications(scheduled_at);
-- Status lookup için index
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_status ON scheduled_notifications(status);
-- Composite index: pending notifications by scheduled_at
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_pending ON scheduled_notifications(status, scheduled_at);

-- ─── Notification Templates Table Indexes ───────────────────────────────
-- Channel ID lookup için index
CREATE INDEX IF NOT EXISTS idx_notification_templates_channel_id ON notification_templates(channel_id);
-- Slug lookup için index
CREATE INDEX IF NOT EXISTS idx_notification_templates_slug ON notification_templates(slug);
-- Active status için index
CREATE INDEX IF NOT EXISTS idx_notification_templates_is_active ON notification_templates(is_active);

-- ─── Security Logs Table Indexes ───────────────────────────────────────
-- IP lookup için index
CREATE INDEX IF NOT EXISTS idx_security_logs_ip ON security_logs(ip);
-- Event type lookup için index
CREATE INDEX IF NOT EXISTS idx_security_logs_event ON security_logs(event);
-- Created at için index (cleanup ve stats için)
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON security_logs(created_at);
-- Composite index: recent logs by created_at
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at_desc ON security_logs(created_at DESC);
-- Composite index: logs by event and created_at
CREATE INDEX IF NOT EXISTS idx_security_logs_event_created ON security_logs(event, created_at);
