CREATE TABLE `graduates` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`first_name` varchar(255),
	`last_name` varchar(255),
	`username` varchar(100) NOT NULL,
	`email` varchar(100) NOT NULL,
	`contact_number` varchar(255),
	`password_hash` varchar(255) NOT NULL,
	`qualification` varchar(255),
	`bootcamp_institute` varchar(255),
	`graduation_year` int,
	`skills` varchar(4000),
	CONSTRAINT `graduates_id` PRIMARY KEY(`id`)
);
