import db from "../db/index.js";
import { applicationsTable } from "../db/schema.js"; // Import the table schema

class Application {
	constructor(id, jobId, graduateId, dateApplied) {
		this.id = id;
		this.jobId = jobId;
		this.graduateId = graduateId;
		this.dateApplied = dateApplied;
	}

  // Method to create a new application  
  static async createApplicaion ({ jobId, graduateId }) {
    try {
        const result = await db
        .insert(applicationsTable)
        .values({
            job_id: jobId,
            graduate_id: graduateId,
        })
        .returning("*"); // Return the inserted application data
    } catch (err) {
        throw new Error(`Error creating application: ${err.message}`);
        }
 }

 // Method to retrieve applications by graduateId
 static async getApplicationByGraduate(graduateId) {
    try {
        const result = await db
        .select()
        .from(applicationsTable)
        .where("graduates_id", graduateId);

        return result;
    
    } catch (err) {
        throw new Error (`Error retrieving applications for graduate ${graduateId}: ${err.message}`
			);
    }

 }

// Method to delete an application by applicationId
static async deleteApplication(applicationId) {
    try {
        await db
            .delete(applicationsTable)
            .where("id", applicationId);

        return { success: true, message: "Application deleted successfully!" };
    } catch (err) {
        throw new Error(`Error deleting application: ${err.message}`);
        }
    }
}

export default Application;