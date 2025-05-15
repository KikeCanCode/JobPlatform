ALTER TABLE `applications` ADD `first_name` varchar(255);--> statement-breakpoint
ALTER TABLE `applications` ADD `last_name` varchar(255);--> statement-breakpoint
ALTER TABLE `applications` ADD `email` varchar(255);--> statement-breakpoint
ALTER TABLE `applications` ADD `cover_letter` varchar(1000) NOT NULL;--> statement-breakpoint
ALTER TABLE `applications` ADD `cv_path` varchar(500);--> statement-breakpoint
ALTER TABLE `companies` ADD `password_hash` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `companies` ADD `created_at` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `companies` ADD `updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `companies` ADD `deleted_at` timestamp DEFAULT null;--> statement-breakpoint
ALTER TABLE `graduates` ADD `created_at` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `graduates` ADD `updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `graduates` ADD `deleted_at` timestamp DEFAULT null;--> statement-breakpoint
ALTER TABLE `jobs` ADD `qualification_required` varchar(500);--> statement-breakpoint
ALTER TABLE `jobs` ADD `application_limit` int;--> statement-breakpoint
ALTER TABLE `jobs` ADD `expiration_date` timestamp;--> statement-breakpoint
ALTER TABLE `admin` DROP COLUMN `username`;--> statement-breakpoint
ALTER TABLE `companies` DROP COLUMN `username`;--> statement-breakpoint
ALTER TABLE `graduates` DROP COLUMN `username`;