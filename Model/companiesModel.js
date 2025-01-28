import db from "../db/index.js"; 
import bcrypt from "bcryptjs";
import { processStripePayment } from "../Service/paymentService.js";
import { companiesTable, jobsTable, applicationsTable, graduatesTable } from "../db/schema.js";
class Company {
	constructor(
		name,
		email,
		password,
		contactNumber,
		address,
		profile,
	) {
		this.name = name;
		this.email = email;
		this.password = password;
		this.contactNumber = contactNumber;
		this.address = address;
		this.profile = profile;
	    }

// Company Sign-up
static async signup(name, email, password) {
	try {
		const hashedPassword = await bcrypt.hash(password, 10);
		const result = await db
			.insert("companies")
			.values({
				name,
				email,
			    password_hash: hashedPassword,
				})
			.returning("*"); // Return the created company's details

			return result;
	} catch (err) {
		throw new Error(`Error during signup: ${err.message}`);
	}
}

// Company Login
static async login(email, password) {
	try {
		const results = await db
			.select()
			.from("companies")
			.where({ email })
			.execute();

	if (results.length === 0) {
		throw new Error("Invalid email or password");
	}

    const company = results[0];
    const isMatch = await bcrypt.compare(password, company.password_hash);

	if (!isMatch) {
		throw new Error("Incorrect email or password");
	}

		return company;
	} catch (err) {
		throw new Error(`Error during login: ${err.message}`);
	}
}

// Post a Job without paymnet 
/*static async postJob(companyId, title, description, salary, location) {
	try {
		const result = await db
			.insert("jobs")
			.values({
				title,
				description,
				salary,
				location,
				company_id: companyId,
				})
			.returning("*");

			return result;
		} catch (err) {
			throw new Error(`Error posting job: ${err.message}`);
		}
	}*/

// Review Applications
static async reviewApplications(jobId) {
	try {
		const applications = await db
			.select({
				applicationId: applicationsTable.id,
				graduateId: graduatesTable.id,
				graduateName: graduatesTable.name,
				applicationDate: applicationsTable.created_at,
			})
			.from(applicationsTable)
			.innerJoin(
				graduatesTable, 
				graduatesTable.id, 
				applicationsTable.graduate_id
			)
			.where(applicationsTable.job_id, "=", jobId)
			.execute();
			
        if (applications.length === 0) {
			throw new Error("No applications found for this job.");
		}

			return applications;
	} catch (err) {
			throw new Error(`Error retrieving applications: ${err.message}`);
	}
}

// Update Profile
static async updateProfile(opts = {}) {
	const {
		companyId,
		name,
		email,
		contactNumber,
		address,
		profile,
		} = opts;

	try {
		const results = await db
			.update(companiesTable)
			.set({
				name,
				email,
				contact_number: contactNumber,
				address,
				profile,
			})
			//.where("id", "=", companyId)
			.where(companiesTable.id, "=", companyId) //ensures there’s no confusion between the id column of companiesTable and any potential id column in jobsTable.
			.execute();

		if (results.affectedRows === 0) {
			throw new Error("Company not found");
		}

		return { message: "Company profile updated successfully!" };
	} catch (err) {
			throw new Error(`Error updating profile: ${err.message}`);
	}
}

// Method to handle payment and job posting
static async postJobWithPayment(companyId, jobDetails, paymentDetails) {
    const { title, description, salary, location } = jobDetails;

        try {
// Step 1: Verify company exists
const companyExists = await db
    .select()
    .from(companiesTable)
    //.where("id", companyId)
	.where(companiesTable.id, "=", companyId)
    .execute();

    if (companyExists.length === 0) {
         throw new Error("Company not found");
    }

 // Step 2: Process payment
    const paymentResult = await processStripePayment(paymentDetails.amount); // This could be Stripe/PayPal logic
        if (paymentResult !== "success") {
			throw new Error("Payment failed");
         }

// Step 3: Post job
const job = await db.insert(jobsTable).values({
    title,
    description,
    salary,
    location,
     company_id: companyId,
    }).execute();

    return {
        success: true,
        message: "Job posted successfully!",
        job,
            };
    } catch (error) {
            throw new Error(`Error posting job with payment: ${error.message}`);
     }
}
// Delete Account
static async deleteAccount(companyId) {
	try {
		const result = await db
		.delete()
		.from(companiesTable)
		.where({ id: companyId })
		.execute();

		if (result.length === 0) {
			throw new Error("Company not found");
		}

	return { message: "Company account deleted successfully!" };
	} catch (err) {
			throw new Error(`Error deleting account: ${err.message}`);
	}
	}
}

export default Company;