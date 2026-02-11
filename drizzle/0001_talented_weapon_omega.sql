CREATE TABLE `scheduled_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`channel_id` int,
	`title` varchar(256) NOT NULL,
	`body` varchar(1024) NOT NULL,
	`icon` varchar(512),
	`url` varchar(512),
	`scheduled_at` timestamp NOT NULL,
	`timezone` varchar(64) DEFAULT 'Europe/Istanbul',
	`repeat` varchar(16) DEFAULT 'none',
	`status` varchar(16) NOT NULL DEFAULT 'pending',
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `scheduled_notifications_id` PRIMARY KEY(`id`)
);
