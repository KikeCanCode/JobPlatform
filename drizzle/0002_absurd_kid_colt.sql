ALTER TABLE `admin` ADD CONSTRAINT `admin_email_unique` UNIQUE(`email`);--> statement-breakpoint
ALTER TABLE `companies` ADD CONSTRAINT `companies_email_unique` UNIQUE(`email`);--> statement-breakpoint
ALTER TABLE `graduates` ADD CONSTRAINT `graduates_email_unique` UNIQUE(`email`);