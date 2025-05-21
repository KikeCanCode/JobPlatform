import db from "../db/index.js";
import { applicationsTable, graduatesTable, jobsTable} from "../db/schema.js"; // Import the table schema
import { eq } from "drizzle-orm";

class Application {
	constructor(id, jobId, graduateId, dateApplied) {
		this.id = id;
		this.jobId = jobId;
		this.graduateId = graduateId;
		this.dateApplied = dateApplied;
	}

  // Method to create a new application  
  static async createApplication ({ jobId, graduateId, firstName, lastName, email, coverLetter, cvPath}) {
    try {
        const result = await db
        .insert(applicationsTable)
        .values({
            job_id: Number(jobId),
            graduate_id: graduateId,
            first_name: firstName,
            last_name: lastName,
            email: email,
            cover_letter: coverLetter,
            cv_path: cvPath,
            date_applied: new Date(),
        })

        .returning("*"); // Return the inserted application data
        return result;
    } catch (err) {
        throw new Error(`Error creating application: ${err.message}`);
        }
 }

 // Method to retrieve applications by graduateId
 static async getApplicationByGraduate(graduateId) {
    try {
        const result = await db
        .select({
        applicationId: applicationsTable.id,
        jobId: applicationsTable.job_id,
        jobTitle: jobsTable.title,
        firstName: applicationsTable.first_name,     
        lastName: applicationsTable.last_name,      
        email: applicationsTable.email, 
        coverLetter: applicationsTable.cover_letter,
        cvPath: applicationsTable.cv_path,
        dateApplied: applicationsTable.date_applied,
      })
        .from(applicationsTable)
        .innerJoin(jobsTable, eq(applicationsTable.job_id, jobsTable.id))
        .where(eq(applicationsTable.graduate_id, graduateId));

        return result;
    
    } catch (err) {
        throw new Error (`Error retrieving applications for graduate ${graduateId}: ${err.message}`
			);
    }

 }
//Get Applications by Job (for recruiters)
 static async getApplicationsByJob(jobId) {
  try {
    return await db
      .select()
      .from(applicationsTable)
      .where(eq(applicationsTable.job_id, jobId));
  } catch (err) {
    throw new Error(`Error retrieving applications for job ${jobId}: ${err.message}`);
  }
}

// Method to delete an application by applicationId
static async deleteApplication(applicationId) {
    try {
        await db
            .delete(applicationsTable)
            .where(eq(applicationsTable.id, applicationId));

        return { success: true, message: "Application deleted successfully!" };
    } catch (err) {
        throw new Error(`Error deleting application: ${err.message}`);
        }
    }
}

export default Application;