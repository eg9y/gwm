CREATE TABLE `site_settings` (
	`id` text PRIMARY KEY DEFAULT 'main' NOT NULL,
	`google_analytics_id` text,
	`google_tag_manager_id` text,
	`updated_at` text NOT NULL
);
