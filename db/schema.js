import {
	int,
	mysqlTable,
	serial,
	varchar,
	text,
	timestamp,
	decimal,
	boolean,


} from "drizzle-orm/mysql-core";

// Graduates Table
export const graduatesTable = mysqlTable("graduates", {
	id: serial().primaryKey(),
	first_name: varchar({ length: 255 }),
	last_name: varchar({ length: 255 }),
	// username: varchar({ length: 100 }).notNull(),
	// email: varchar({ length: 100 }).notNull().unique(),
	
	email: varchar({ length: 100 }).unique(), // email will stay empty until verified
    email_address_unverified: varchar({ length: 100 }),
    email_verification_token: varchar({ length: 255 }),
	contact_number: varchar({ length: 255 }),
	password_hash: varchar({ length: 255 }).notNull(),
	qualification: varchar({ length: 255 }),
	bootcamp_institute: varchar({ length: 255 }),
	graduation_year: int(),
	skills: varchar({ length: 4_000 }),
	certificate: varchar ({ length: 500 }),
	created_at: timestamp().defaultNow(),
  	updated_at: timestamp().defaultNow().onUpdateNow(),
  	deleted_at: timestamp().default(null), // Soft delete column
	registration_completed: boolean().default(false)

});

// Companies Table
export const companiesTable = mysqlTable("companies", {
	id: serial().primaryKey(),
	company_name: varchar({ length: 255 }),
	// username: varchar({ length: 100 }).notNull(),
	email: varchar({ length: 100 }).notNull().unique(),
	
	// email: varchar({ length: 100 }).unique(), // email will stay empty until verified
    // email_address_unverified: varchar({ length: 100 }),
    // email_verification_token: varchar({ length: 255 }),
	password_hash: varchar({ length: 255 }).notNull(),
	contact_number: varchar({ length: 255 }),
	company_address: varchar({ length: 500 }),
	company_profile: varchar({ length: 500 }),
  	created_at: timestamp().defaultNow(), // Automatically set to the current timestamp,
  	updated_at: timestamp().defaultNow().onUpdateNow(),
  	deleted_at: timestamp().default(null) // Soft delete column

});

// Jobs Table
export const jobsTable = mysqlTable("jobs", {
	id: serial().primaryKey(),
	company_id: int().notNull(), // Foreign key referencing companies.id
	title: varchar({ length: 255 }).notNull(),
	job_description: text().notNull(),
	location: varchar({ length: 255 }),
	salary: varchar({ length: 100 }),
	created_at: timestamp().defaultNow(), // Automatically set to the current timestamp
	qualification_required: varchar({ length: 500 }), // Added field
	application_limit: int(), // Added field (assuming it's a number, adjust type if needed)
	expiration_date: timestamp(), // Added field
	is_active: boolean().default(true).notNull(), // Handle application limit
	// last_activity_at: timestamp().defaultNow().notNull(),
	no_experience_required: boolean().notNull().default(true),

});

// Applications Table
export const applicationsTable = mysqlTable("applications", {
	id: serial().primaryKey(),
	job_id: int().notNull(), // Foreign key referencing jobs.id
	graduate_id: int().notNull(), // Foreign key referencing graduates.id
	first_name: varchar ({ length: 255 }), 
	last_name: varchar ({ length: 255 }), 
	email: varchar ({ length: 255 }), 
	cover_letter: varchar({ length: 1000 }).default(null), //
	cv_path: varchar ({ length: 500 }), // path to uploaded CV
	date_applied: timestamp().defaultNow(), // Automatically set to the current timestamp

});

// Admin Table -
export const adminTable = mysqlTable("admin", {
	id: serial().primaryKey(),
	// username: varchar({ length: 100 }).notNull(),
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
