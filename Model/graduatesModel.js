import db from "./db"; // Import your Drizzle ORM instance
import bcrypt from "bcryptjs";
import multer from "multer";

class Graduate {
	constructor(
		username,
		email,
		password,
		firstName,
		lastName,
		contactNumber,
		qualification,
		bootcampInstitute,
		graduationYear,
		skills,
		certificatePath,
	) {
		this.username = username;
		this.email = email;
		this.password = password;
		this.firstName = firstName;
		this.lastName = lastName;
		this.contactNumber = contactNumber;
		this.qualification = qualification;
		this.bootcampInstitute = bootcampInstitute;
		this.graduationYear = graduationYear;
		this.skills = skills;
		this.certificatePath = certificatePath;
	}
	// Graduate sign up
	static async signup(username, email, password) {
		try {
			const hashedPassword = await bcrypt.hash(password, 10);
			const result = await db
				.insert("graduates")
				.values({
					username,
					email,
					password_hash: hashedPassword,
				})
				.execute();

			return result;
		} catch (err) {
			throw new Error(`Error during signup: ${err.message}`);
		}
	}
	// Graduate login and validate password
	static async login(username, password) {
		try {
			const results = await db
				.select()
				.from("graduates")
				.where({ username })
				.execute();

			if (results.length === 0) {
				throw new Error("Invalid username or password");
			}

			const graduate = results[0];
			const isMatch = await bcrypt.compare(password, graduate.password_hash);

			if (!isMatch) {
				throw new Error("Incorrect username or password");
			}

			return graduate;
		} catch (err) {
			throw new Error(`Error during login: ${err.message}`);
		}
	}

	// Update graduate profile

	/*static async updateProfile(graduateId, firstName, lastName, email, contactNumber, qualification, bootcampInstitute, graduationYear, skills) {
    
    try {
      const results = await db.update('graduates')
        .set({
          first_name: firstName,
          last_name: lastName,
          email,
          contact_number: contactNumber,
          qualification,
          bootcamp_institute: bootcampInstitute,
          graduation_year: graduationYear,
          skills
        })
        .where('id', graduateId)
        .execute();

      return results;
    } catch (err) {
      throw new Error(`Error updating profile: ${err.message}`);
    }
  }*/

	static async updateProfile(opts = {}) {
		const {
			graduateId,
			firstName,
			lastName,
			email,
			contactNumber,
			qualification,
			bootcampInstitute,
			graduationYear,
			skills,
		} = opts;

		try {
			const results = await db
				.update("graduates")
				.set({
					first_name: firstName,
					last_name: lastName,
					email,
					contact_number: contactNumber,
					qualification,
					bootcamp_institute: bootcampInstitute,
					graduation_year: graduationYear,
					skills,
				})
				.where("id", "=", graduateId)
				.execute();

			return results;
		} catch (err) {
			throw new Error(`Error updating profile: ${err.message}`);
		}
	}

	// Upload graduate certificate
	static async uploadCertificate(graduateId, certificatePath) {
		try {
			const result = await db
				.update("graduates")
				.set({ certificate: certificatePath })
				.where("id", graduateId)
				.execute();

			return result;
		} catch (err) {
			throw new Error(`Error uploading certificate: ${err.message}`);
		}
	}

	// Get graduate profile details
	static async getProfile(graduateId) {
		try {
			const results = await db
				.select()
				.from("graduates")
				.where("id", graduateId)
				.execute();

			if (results.length === 0) {
				throw new Error("Graduate profile not found");
			}

			return results[0];
		} catch (err) {
			throw new Error(`Error retrieving profile: ${err.message}`);
		}
	}

	// Delete graduate account
	static async deleteAccount(graduateId) {
		try {
			await db.delete().from("graduates").where({ id: graduateId }).execute();

			return { message: "Graduate account deleted successfully!" };
		} catch (err) {
			throw new Error(`Error deleting account: ${err.message}`);
		}
	}

	// Graduate apply for job
	static async applyForJob(graduateId, jobId) {
		try {
			await db
				.insert()
				.into("applications")
				.values({ graduate_id: graduateId, job_id: jobId })
				.execute();

			return { message: "Job application submitted successfully!" };
		} catch (err) {
			throw new Error(`Error applying for job: ${err.message}`);
		}
	}
}

export default Graduate;
