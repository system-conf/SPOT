CREATE TABLE `notification_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(64) NOT NULL,
	`slug` varchar(64) NOT NULL,
	`channel_id` int,
	`title` varchar(256) NOT NULL,
	`body` varchar(1024) NOT NULL,
	`icon` varchar(512),
	`url` varchar(512),
	`badge` varchar(512),
	`actions` text,
	`variables` text,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notification_templates_id` PRIMARY KEY(`id`),
	CONSTRAINT `notification_templates_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `notifications` ADD `image` varchar(512);--> statement-breakpoint
ALTER TABLE `notifications` ADD `badge` varchar(512);--> statement-breakpoint
ALTER TABLE `notifications` ADD `actions` text;--> statement-breakpoint
ALTER TABLE `notifications` ADD `require_interaction` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `scheduled_notifications` ADD `image` varchar(512);--> statement-breakpoint
ALTER TABLE `scheduled_notifications` ADD `badge` varchar(512);--> statement-breakpoint
ALTER TABLE `scheduled_notifications` ADD `actions` text;--> statement-breakpoint
ALTER TABLE `scheduled_notifications` ADD `require_interaction` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `channel_id` int;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `user_agent` varchar(512);--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `is_active` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `last_used_at` timestamp;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;