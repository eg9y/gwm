CREATE TABLE `contact_submissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`full_name` text NOT NULL,
	`email` text NOT NULL,
	`phone_number` text NOT NULL,
	`location` text NOT NULL,
	`car_model_interest` text NOT NULL,
	`created_at` text NOT NULL
);
