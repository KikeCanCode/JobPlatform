import { int, mysqlTable, serial, varchar } from "drizzle-orm/mysql-core";

export const graduatesTable = mysqlTable("graduates", {
	id: serial().primaryKey(),
	first_name: varchar({ length: 255 }),
	last_name: varchar({ length: 255 }),
	username: varchar({ length: 100 }).notNull(),
	email: varchar({ length: 100 }).notNull(),
	contact_number: varchar({ length: 255 }),
	password_hash: varchar({ length: 255 }).notNull(),
	qualification: varchar({ length: 255 }),
	bootcamp_institute: varchar({ length: 255 }),
	graduation_year: int(),
	skills: varchar({ length: 4_000 }),
});

// Additional tables go here!
