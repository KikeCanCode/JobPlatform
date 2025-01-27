import db from "../db/index.js"; // Database connection
//import { adminTable, companiesTable, graduatesTable, jobsTable } from "../db/schema.js";
import { companiesTable, graduatesTable, jobsTable } from "../db/schema.js";

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
class Admin {
	/*// Login Admin
	static async login(username, password) {
		try {
			const admin = await db
				.select()
				.from(adminsTable)
				.where({ username })
				.limit(1)
				.execute();

			if (admin.length === 0) {
				throw new Error("Admin not found");
			}

			// Check if the password matches (use hashed passwords in real-world applications)
			const isMatch = password === admin[0].password;
			if (!isMatch) {
				throw new Error("Invalid username or password");
			}

			return admin[0]; // Return admin details if login is successful
		} catch (error) {
			throw new Error(`Error during admin login: ${error.message}`);
		}
	}*/

	// Get Company by ID
	static async getCompanyById(companyId) {
		try {
			const company = await db
				.select()
				.from(companiesTable)
				.where({ id: companyId })
				.limit(1)
				.execute();

			if (!company.length) {
				throw new Error("Company not found");
			}

			return company[0];
		} catch (error) {
			throw new Error(`Error fetching company details: ${error.message}`);
		}
	}

	// Get Graduate by ID
	static async getGraduateById(graduateId) {
		try {
			const graduate = await db
				.select()
				.from(graduatesTable)
				.where({ id: graduateId })
				.limit(1)
				.execute();

			if (!graduate.length) {
				throw new Error("Graduate not found");
			}

			return graduate[0];
		} catch (error) {
			throw new Error(`Error fetching graduate details: ${error.message}`);
		}
	}

	// Get All Companies
	static async getAllCompanies() {
		try {
			const companies = await db.select().from(companiesTable).execute();
			return companies;
		} catch (error) {
			throw new Error(`Error fetching all companies: ${error.message}`);
		}
	}

	// Get All Graduates
	static async getAllGraduates() {
		try {
			const graduates = await db.select().from(graduatesTable).execute();
			return graduates;
		} catch (error) {
			throw new Error(`Error fetching all graduates: ${error.message}`);
		}
	}

	// Delete Company by ID
	static async deleteCompanyById(companyId) {
		try {
			await db.delete().from(companiesTable).where({ id: companyId });
			return { message: "Company deleted successfully" };
		} catch (error) {
			throw new Error(`Error deleting company: ${error.message}`);
		}
	}

	// Delete Graduate by ID
	static async deleteGraduateById(graduateId) {
		try {
			await db.delete().from(graduatesTable).where({ id: graduateId });
			return { message: "Graduate deleted successfully" };
		} catch (error) {
			throw new Error(`Error deleting graduate: ${error.message}`);
		}
	}

	// Delete Job Posting by ID
	static async deleteJobById(jobId) {
		try {
			await db.delete().from(jobsTable).where({ id: jobId });
			return { message: "Job deleted successfully" };
		} catch (error) {
			throw new Error(`Error deleting job: ${error.message}`);
		}
	}
}

export default Admin;