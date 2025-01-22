import {
	int,
	mysqlTable,
	serial,
	varchar,
	timestamp,
	decimal,
} from "drizzle-orm/mysql-core";

// Graduates Table
export const graduatesTable = mysqlTable("graduates", {
	id: serial().primaryKey(),
	first_name: varchar({ length: 255 }),
	last_name: varchar({ length: 255 }),
	username: varchar({ length: 100 }).notNull(),
	email: varchar({ length: 100 }).notNull().unique(),
	contact_number: varchar({ length: 255 }),
	password_hash: varchar({ length: 255 }).notNull(),
	qualification: varchar({ length: 255 }),
	bootcamp_institute: varchar({ length: 255 }),
	graduation_year: int(),
	skills: varchar({ length: 4_000 }),
});

// Companies Table
export const companiesTable = mysqlTable("companies", {
	id: serial().primaryKey(),
	company_name: varchar({ length: 255 }),
	username: varchar({ length: 100 }).notNull(),
	email: varchar({ length: 100 }).notNull().unique(),
	contact_number: varchar({ length: 255 }),
	company_address: varchar({ length: 500 }),
	company_profile: varchar({ length: 500 }),
});

// Jobs Table
export const jobsTable = mysqlTable("jobs", {
	id: serial().primaryKey(),
	company_id: int().notNull(), // Foreign key referencing companies.id
	title: varchar({ length: 255 }).notNull(),
	job_description: varchar({ length: 1000 }).notNull(),
	location: varchar({ length: 255 }),
	salary: varchar({ length: 100 }),
	created_at: timestamp().defaultNow(), // Automatically set to the current timestamp
});

// Applications Table
export const applicationsTable = mysqlTable("applications", {
	id: serial().primaryKey(),
	job_id: int().notNull(), // Foreign key referencing jobs.id
	graduate_id: int().notNull(), // Foreign key referencing graduates.id
	date_applied: timestamp().defaultNow(), // Automatically set to the current timestamp
});

// Admin Table -
export const adminTable = mysqlTable("admin", {
	id: serial().primaryKey(),
	username: varchar({ length: 100 }).notNull(),
	email: varchar({ length: 100 }).notNull().unique(),
	password_hash: varchar({ length: 255 }).notNull(), // Store hashed passwords
	created_at: timestamp().defaultNow(), // Automatically set to the current timestamp
});

// Payment Table
export const paymentTable = mysqlTable("payments", {
	id: serial().primaryKey(),
	company_id: int().notNull(), // Foreign key referencing companies.id
	amount: decimal({ precision: 10, scale: 2 }).notNull(), // Decimal for accurate monetary values
	currency: varchar({ length: 10 }).default("GBP").notNull(), // Default to GBP, but can be adjusted
	payment_status: varchar({ length: 50 }).default("Pending").notNull(), // Status like 'Pending', 'Completed', etc.
	transaction_id: varchar({ length: 255 }).notNull(), // Unique transaction reference
	payment_method: varchar({ length: 100 }), // E.g., 'Credit Card', 'PayPal', etc.
	created_at: timestamp().defaultNow(), // Automatically set to the current timestamp
});
