CREATE TABLE `about_us` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`mission` text,
	`vision` text,
	`image_url` text,
	`image_alt` text,
	`updated_at` text NOT NULL
);
