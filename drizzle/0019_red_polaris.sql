PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_contact_info` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`phone` text NOT NULL,
	`email` text NOT NULL,
	`address` text NOT NULL,
	`facebook` text NOT NULL,
	`instagram` text NOT NULL,
	`x` text NOT NULL,
	`youtube` text NOT NULL,
	`whatsapp_url` text DEFAULT '',
	`updated_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_contact_info`("id", "phone", "email", "address", "facebook", "instagram", "x", "youtube", "whatsapp_url", "updated_at") SELECT "id", "phone", "email", "address", "facebook", "instagram", "x", "youtube", "whatsapp_url", "updated_at" FROM `contact_info`;--> statement-breakpoint
DROP TABLE `contact_info`;--> statement-breakpoint
ALTER TABLE `__new_contact_info` RENAME TO `contact_info`;--> statement-breakpoint
PRAGMA foreign_keys=ON;