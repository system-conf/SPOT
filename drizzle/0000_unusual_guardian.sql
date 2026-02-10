CREATE TABLE `channels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(64) NOT NULL,
	`slug` varchar(64) NOT NULL,
	`api_key` varchar(64) NOT NULL,
	`color` varchar(7) NOT NULL DEFAULT '#3B82F6',
	`icon` varchar(32) DEFAULT 'bell',
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `channels_id` PRIMARY KEY(`id`),
	CONSTRAINT `channels_slug_unique` UNIQUE(`slug`),
	CONSTRAINT `channels_api_key_unique` UNIQUE(`api_key`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`channel_id` int,
	`title` varchar(256) NOT NULL,
	`body` varchar(1024) NOT NULL,
	`icon` varchar(512),
	`url` varchar(512),
	`status` varchar(16) NOT NULL DEFAULT 'sent',
	`sent_at` timestamp DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`endpoint` varchar(512) NOT NULL,
	`p256dh` varchar(256) NOT NULL,
	`auth` varchar(128) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscriptions_endpoint_unique` UNIQUE(`endpoint`)
);
