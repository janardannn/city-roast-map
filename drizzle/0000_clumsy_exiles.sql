CREATE TABLE `city_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`participant_id` text NOT NULL,
	`message` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `participants` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`neighborhood` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `participants_email_idx` ON `participants` (`email`);--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`participant_id` text NOT NULL,
	`neighborhood` text NOT NULL,
	`message` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `votes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`participant_id` text NOT NULL,
	`neighborhood` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `votes_participant_neighborhood_idx` ON `votes` (`participant_id`,`neighborhood`);