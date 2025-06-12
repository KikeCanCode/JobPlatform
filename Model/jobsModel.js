/*The Job class is a model class designed to perform database operations related to jobs. 
It provides static methods for interacting with the database, such as creating or retrieving jobs.
Useful when the focus is on performing CRUD operations on the database.
Differ from gragaute& companies because they are creating an instance */



import db from "../db/index.js";
import { jobsTable } from "../db/schema.js"; // Import the table schema

// JobModel Class
// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
class Job {
	// Create a new job
	static async create({
		companyId,
		title,
		description,
		salary,
		location,
		qualificationRequired,
		applicationLimit,
		expirationDate,
		
	}) {
		try {
			const result = await db
				.insert(jobsTable)
				.values({
					company_id: companyId,
					title,
					job_description: description,
					salary,
					location,
					qualification_required: qualificationRequired,
					application_limit: applicationLimit ? Number.parseInt(applicationLimit) : null,
					expiration_date: expirationDate ? new Date(expirationDate) : null,
					is_active: true, // mark job as active
  					last_activity_at: new Date(), // set initial activity timestamp
				})
				.execute();
			return result;
		} catch (err) {
			throw new Error(`Error creating job: ${err.message}`);
		}
	}

	// Get applications for a specific graduate, sorted by newest first
async getApplicationByGraduate(graduateId) {
    return await db
      .select()
      .from(applicationsTable)
      .where(eq(applicationsTable.graduate_id, graduateId))
      .orderBy(desc(applicationsTable.date_applied));
  }
// Find All Jobs - (Genaeal Job Listing)
static async findAll() {
	try {
		const jobs = await db
		.select()
		.from(jobsTable)
		.execute();
		return jobs;
	} catch (err) {
		throw new Error(`Error retrieving all jobs: ${err.message}`);
	}
}
	// Find jobs by company ID
	static async findByCompanyId(companyId) {
		try {
			const jobs = await db
				.select()
				.from(jobsTable)
				.where(jobsTable.company_id.eq(companyId))
				.execute();
			return jobs;
		} catch (err) {
			throw new Error(`Error retrieving jobs: ${err.message}`);
		}
	}

	// Update job status
	static async updateStatus(jobId, status) {
		try {
			const result = await db
				.update(jobsTable)
				.set({ status }) // Add a 'status' column if needed in your table
				.where(jobsTable.id.eq(jobId))
				.execute();
			return result;
		} catch (err) {
			throw new Error(`Error updating job status: ${err.message}`);
		}
	}
}
export default Job;