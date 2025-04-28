ALTER TABLE `homepage_feature_sections` RENAME COLUMN "image_url" TO "desktop_image_url";--> statement-breakpoint
ALTER TABLE `homepage_feature_sections` ADD `mobile_image_url` text NOT NULL;