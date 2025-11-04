import db from "../db/index.js"; // Import your Drizzle ORM instance
import bcrypt from "bcryptjs";
//import multer from "multer";


class Graduate {
	constructor(
		// username,
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
		// this.username = username;
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
	static async signup(email, password) {
		try {
			const hashedPassword = await bcrypt.hash(password, 10);

			const token = crypto.randomBytes(32).toString("hex");
			
			const result = await db
				.insert("graduates")
				.values({
					// username,
					email_address_unverified: email,
					email_verification_token: token,
					password_hash: hashedPassword,
				})
				.execute();

			const graduateId = result.insertId;

			return graduateId;

		} catch (err) {
			throw new Error(`Error during signup: ${err.message}`);
		}
}

	// Verify graduate email
	static async verifyEmail(token) {
		try {
			const [graduate] = await db
				.select()
				.from(graduatesTable)
				.where(eq(graduatesTable.email_verification_token, token))
				.execute();

			if (!graduate) {
				throw new Error("Invalid or expired verification token");
			}

			await db
				.update(graduatesTable)
				.set({
					email: graduate.email_address_unverified,
					email_verification_token: null,
				})
				.where(eq(graduatesTable.id, graduate.id))
				.execute();

			return true;
		} catch (err) {
			throw new Error(`Email verification failed: ${err.message}`);
		}
}


// Login only after verification
	static async login(email, password) {
		try {
			const [graduate] = await db
				.select()
				.from(graduatesTable)
				.where((fields, { eq }) => eq(fields.email, email));

			if (!graduate) {
				throw new Error("Please verify your email before logging in.");
			}

			const validPassword = await bcrypt.compare(password, graduate.password_hash);
			if (!validPassword) {
				throw new Error("Invalid email or password");
			}

			return graduate;
		} catch (err) {
			throw new Error(`Error during login: ${err.message}`);
		}
	}


/*// Graduate login and validate password
	static async login(email, password) {
		try {
			const results = await db
				.select()
				.from("graduates")
				.where({ email })
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
*/

// Update graduate profile
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
