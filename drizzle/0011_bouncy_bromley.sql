CREATE TABLE `homepage_config` (
	`id` text PRIMARY KEY DEFAULT 'main' NOT NULL,
	`hero_desktop_image_url` text NOT NULL,
	`hero_mobile_image_url` text NOT NULL,
	`hero_title` text NOT NULL,
	`hero_subtitle` text,
	`hero_primary_button_text` text,
	`hero_primary_button_link` text,
	`hero_secondary_button_text` text,
	`hero_secondary_button_link` text,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `homepage_feature_sections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`homepage_config_id` text NOT NULL,
	`order` integer NOT NULL,
	`title` text NOT NULL,
	`subtitle` text,
	`description` text NOT NULL,
	`image_url` text NOT NULL,
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
ALTER TABLE `car_models` ADD `specifications` text;