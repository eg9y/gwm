CREATE TABLE `car_models` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`featured_image` text NOT NULL,
	`subheader` text NOT NULL,
	`price` text NOT NULL,
	`sub_image` text,
	`features` text NOT NULL,
	`description` text NOT NULL,
	`main_product_image` text NOT NULL,
	`colors` text NOT NULL,
	`category` text NOT NULL,
	`category_display` text NOT NULL,
	`has_180_view` integer DEFAULT 0,
	`published` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `articles` DROP COLUMN `youtube_url`;