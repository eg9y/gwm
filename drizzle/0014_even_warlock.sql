PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_homepage_feature_sections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`homepage_config_id` text NOT NULL,
	`order` integer NOT NULL,
	`title` text NOT NULL,
	`subtitle` text,
	`description` text NOT NULL,
	`desktop_image_urls` text NOT NULL,
	`mobile_image_urls` text,
	`image_alt` text DEFAULT 'Feature section image' NOT NULL,
	`features` text,
	`primary_button_text` text,
	`primary_button_link` text,
	`secondary_button_text` text,
	`secondary_button_link` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`homepage_config_id`) REFERENCES `homepage_config`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_homepage_feature_sections`("id", "homepage_config_id", "order", "title", "subtitle", "description", "desktop_image_urls", "mobile_image_urls", "image_alt", "features", "primary_button_text", "primary_button_link", "secondary_button_text", "secondary_button_link", "created_at", "updated_at") SELECT "id", "homepage_config_id", "order", "title", "subtitle", "description", "desktop_image_urls", "mobile_image_urls", "image_alt", "features", "primary_button_text", "primary_button_link", "secondary_button_text", "secondary_button_link", "created_at", "updated_at" FROM `homepage_feature_sections`;--> statement-breakpoint
DROP TABLE `homepage_feature_sections`;--> statement-breakpoint
ALTER TABLE `__new_homepage_feature_sections` RENAME TO `homepage_feature_sections`;--> statement-breakpoint

CREATE TABLE `about_us` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`mission` text,
	`vision` text,
	`image_url` text,
	`image_alt` text,
	`updated_at` text NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);--> statement-breakpoint

PRAGMA foreign_keys=ON;