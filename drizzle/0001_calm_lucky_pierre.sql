CREATE TABLE `admin` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`username` varchar(100) NOT NULL,
	`email` varchar(100) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `admin_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `applications` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`job_id` int NOT NULL,
	`graduate_id` int NOT NULL,
	`date_applied` timestamp DEFAULT (now()),
	CONSTRAINT `applications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `companies` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`company_name` varchar(255),
	`username` varchar(100) NOT NULL,
	`email` varchar(100) NOT NULL,
	`contact_number` varchar(255),
	`company_address` varchar(500),
	`company_profile` varchar(500),
	CONSTRAINT `companies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`company_id` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`job_description` varchar(1000) NOT NULL,
	`location` varchar(255),
	`salary` varchar(100),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`company_id` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(10) NOT NULL DEFAULT 'GBP',
	`payment_status` varchar(50) NOT NULL DEFAULT 'Pending',
	`transaction_id` varchar(255) NOT NULL,
	`payment_method` varchar(100),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
