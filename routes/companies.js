// Companies Routes
import bcrypt from "bcrypt";
import express from "express";
import db from "../db/index.js"; // database connection
import { applicationsTable, companiesTable, jobsTable } from "../db/schema.js";
//import Stripe from "stripe"; // Import Stripe for payment processing 
import { eq } from "drizzle-orm";
import { ensureLoggedIn } from "../Middlewares/companyAuthentication.js";
import { desc } from "drizzle-orm";

const router = express.Router();

// Moved Companies Middleware to Middleware Folder - Import it above.  
// Display companies Login Page  
router.get("/login", (req, res) => {
    res.render("companies/login");
});

//  Route - Companies Login
router.post("/login", (req, res) => {
	const { email, password } = req.body; 
	db.select()
		.from(companiesTable)
		.where({ email }) 
		.execute()
		.then(async (results) => {
			if (results.length === 0) {
				return res.status(401).send("Invalid password or username");
			}

			const company = results[0];

			try {
				const isMatch = await bcrypt.compare(password, company.password_hash);

				if (isMatch) {
					req.session.mode = "company";
					req.session.companyId = company.id;

					return res.redirect("/companies/dashboard");
				
				// biome-ignore lint/style/noUselessElse: <explanation>
								} else {
					req.session = null;

					return res.status(401).json({
						error:
							"Incorrect username or password. Please check your credentials.",
					});
				}
				
			} catch (err) {
				console.log(err) // Just notification 
				res.status(500).send("Error logging in");
			}
		});
});

// Route - Display companies Sign-Up Page  
router.get("/signup", (req, res) => {
    res.render("companies/signup");
	
});

// Route - Companies Sign-up
router.post("/signup", async (req, res) => {
	const { email, password } = req.body;

	try {
		const hashedPassword = await bcrypt.hash(password, 10);
		
		const result = await db
		.insert(companiesTable)
		.values({ // id property - descontructing
			email,
			password_hash: hashedPassword,
		}).$returningId();

		const { id } = result[0]; // Extract the id from the result

		req.session.companyId = id; // read back into session

		return res
			.redirect("/companies/registrationForm")
	} catch (err) { 
		console.log(err)
		res.status(500).send("Error creating account");
	}
}); 

// Display Comoanies Registration Page
router.get("/registrationForm", ensureLoggedIn, async (req, res) => {
	const company = req.company;
	return res.render("companies/registrationForm", { company });	
});

// Route - Companies Registration
router.post("/registrationForm", ensureLoggedIn, async (req, res) => { // no need to include email and password in the constructor as they were already collected.
	const { companyName, contactNumber, companyAddress, companyProfile } = req.body;

	try {
		// Retrieve email & password from session
		const id = req.session.companyId;
		await db
			.update(companiesTable)
			.set({
				company_name: companyName,  // Ensure correct column names
				contact_number: contactNumber,
				company_address: companyAddress,
				company_profile: companyProfile
			})
			.where(eq(companiesTable.id, id));

		// Redirect to the dashboard
		res.redirect("/companies/dashboard");
	} catch (error) {
		console.error(error);
		res.status(500).send("Error saving registration details");
	}
});

//Display companies Dashboard - Updated to dispay posted jobs to the dashboard
router.get("/dashboard", ensureLoggedIn, async (req, res) => {
	// console.log(req.company);
	try {
		const companyId = req.company.id;
		
		// Fetch only jobs posted by this company
		const jobs = await db
			.select()
			.from(jobsTable)
			.where(eq(jobsTable.company_id, companyId))
			.orderBy(jobsTable.created_at, 'desc'); // Use 'desc' directly for descending order	res.render("companies/dashboard", { company: req.company });
			
			res.render("companies/dashboard", {company: req.company, jobs });
		} catch (err) {
	console.error(err);
	res.status(500).send("Something went wrong while loading the dashboard.");
}
});

// View Companies profile
router.get("/profile", ensureLoggedIn, async (req, res) => {
	try {
		// Query to fetch specific fields from the companiesTable
		const company = req.company;

		res.render("companies/profile", { company: company });
	} catch (err) {
		console.log(err)
		res.status(500).body("Internal Server Error");
	}
});
/*
Instead of trying to fetch the company again, I simply passed req.company because ensureLoggedIn already retrieved the company from the database.
*/

// Display Company UpdateProfile  
router.get("/updateProfile", ensureLoggedIn, async (req, res) => {
    try {
        console.log(req.company); //Check if company data exists
        const company = req.company;
        if (!company) {
            return res.status(404).json({ error: "Company not found" });
        }
        res.render("companies/updateProfile", { company });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Companies Update details
router.post("/updateProfile", ensureLoggedIn, async (req, res) => {
	const {
		companyName,
		email,
		contactNumber,
		companyAddress,
		companyProfile,
	} = req.body;

	try {
		const results = await db
			.update(companiesTable)
			.set({
				company_name: companyName,
				email,
				contact_number: contactNumber,
				company_address: companyAddress,
				company_profile: companyProfile,
			})
			// .where("id", req.company.id)
			.where(eq(companiesTable.id, req.company.id))
			.execute();

		if (results.affectedRows === 0) {
			//If affectedRows is 0, it means that no rows in the database were updated,
			return res.status(404).json({ error: "Company not found" });
		}
//		res.json({ message: "Company details updated successfully!" });
		
		res.redirect("/companies/profile"); // Redirect to the profile page after update

} catch (err) {
		res.status(500).json({ error: err.message });
	}
});


// Display Posted Jobs
router.get("/jobs", async (req, res) => {
	try {
		const jobs = await db
			.select()
			.from(jobsTable)
			.orderBy(desc(jobsTable.created_at)); // Sort newest first

		res.render("jobs", { jobs }); 
	} catch (err) {
		console.error(err.message);
		res.status(500).send({ error: "Failed to fetch jobs" });
	}
});

// Display Jobs Posting Form
router.get("/post-jobs", ensureLoggedIn, async (req, res) => {
	const company = req.company;
	res.render("jobs/post-jobs", { company }); 
});

// POST a Job without payment
router.post("/post-jobs", ensureLoggedIn, async (req, res) => {
	const {
		title,
		job_description,
		salary,
		location,
		qualification_required: qualificationRequired,
		application_limit: applicationLimit,
		expiration_date: expirationDate,
	} = req.body;

	// const companyId = req.user.id; // from the ensureLoggedIn middleware
	const companyId = req.company.id;

	try {
		// await Job.create({
			await db
			.insert(jobsTable)
			.values({
			company_id: companyId,
			title,
			job_description,
			salary,
			location,
			qualification_required: qualificationRequired,
			application_limit: applicationLimit,
			expiration_date: expirationDate,
			 
		});

		// res.status(201).send({ message: "Job posted successfully!" });
	// Redirect to dashboard or send response
	res.redirect("/companies/dashboard"); 
	} catch (err) {
		console.error(err);
		res.status(500).send({ error: "Error posting job" });
	}
});


//Review applications
router.get("/applications/:jobId", ensureLoggedIn, async (req, res) => {
	const { jobId } = req.params;
	try {
		const applications = await db
			.select()
			.from(applicationsTable)
			.innerJoin(
				graduatesTable,
				graduatesTable.id,
				"=",
				applicationsTable.company_id,
			)
			.where(applicationsTable.job_id, "=", jobId);

		// Check if no applications found
		if (applications.length === 0) {
			return res
				.status(404)
				.json({ message: "No applications found for this job." });
		}

		res.status(200).json(applications);
	} catch (error) {
		console.error(err);
		res.status(500).send({ error: "Error retrieving applications" });
	}
});


// Pay Fee for posting a job

//const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); // Use your Stripe secret key

// Post a Job with Payment
// router.post("/post-job-with-payment", ensureLoggedIn, async (req, res) => {
// 	const { title, description, salary, location, amount, currency } = req.body;
// 	const companyId = req.user.id; // Extracted from the token by verifyToken middleware

// 	try {
// 		// Step 1: Create a Payment Intent
// 		const paymentIntent = await stripe.paymentIntents.create({
// 			amount, // Amount in the smallest currency unit (e.g., 500 for £5.00)
// 			currency, // Currency code, e.g., 'gbp'
// 			description: `Job Post Payment for ${title}`, // Payment description
// 			metadata: { companyId, title }, // Add metadata for tracking
// 		});

// 		// Step 2: Confirm the payment (frontend should send client_secret for this)
// 		// For now, return the client secret to the frontend
// 		return res.status(201).send({
// 			clientSecret: paymentIntent.client_secret,
// 			message: "Payment intent created successfully. Confirm payment to post the job!",
// 		});
// 	} catch (err) {
// 		console.error(err.message);
// 		return res.status(500).send({ error: "Error processing payment" });
// 	}
// });

// Confirm Job Posting after Payment
// router.post("/confirm-job-post", ensureLoggedIn, async (req, res) => {
// 	const { title, description, salary, location, paymentIntentId } = req.body;
// 	const companyId = req.user.id;

// 	try {
// 		// Step 1: Retrieve the payment intent to confirm successful payment
// 		const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

// 		if (paymentIntent.status !== "succeeded") {
// 			return res.status(400).send({ error: "Payment not completed. Cannot post the job." });
// 		}

// 		// Step 2: Insert the job into the database after successful payment
// 		await db.insert(jobsTable).values({
// 			title,
// 			description,
// 			salary,
// 			location,
// 			company_id: companyId,
// 		});

// 		res.status(201).send({ message: "Job posted successfully after payment!" });
// 	} catch (err) {
// 		console.error(err.message);
// 		return res.status(500).send({ error: "Error confirming job post after payment" });
// 	}
// });


//Save the payment into the Database after payment confirmation
router.post("/save-job", ensureLoggedIn, async (req, res) => {
	const { title, description, salary, location } = req.body;
	const companyId = req.user.id;

	try {
		await db.insert(jobsTable).values({
			title,
			description,
			salary,
			location,
			company_id: companyId,
			created_at: new Date(),
		});

		res.status(201).json({ message: "Job posted successfully!" });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Failed to save job" });
	}
});


  // Delete Account
  router.delete("/delete", ensureLoggedIn, async (req, res) => {
	try {
		const companyID = req.company.id;
		await db.delete().from(companiesTable).where({ id: companyID });

		req.session = null; // Delete the session after deleting the account

		// TODO: Redirect to homepage?
		res.send({ message: "company account deleted successfuly!" });
	} catch (error) {
		console.error(err);
		res.status(500).send({ error: "error deleting account" });
	}
});

// Integrating CAPTCHA verification
router.post("/signup", async (req, res) => {
	const { password, recaptchaToken } = req.body;
	const verifyUrl = " "; // register domain name on google recaptcha to get the url

	try {
		const captchaResponse = await fetch(verifyUrl, { method: " POST" });
		const data = await captchaResponse.json();
		if (!data.success) {
			return res.status(400).send("CAPTCHA verification failed.");
		}
	} catch (err) {
		res.status(500).send("CAPTCHA verification erro.");
	}
});

//Logout Route - this destroys session and redirects to login
router.get("/logout", (req, res) => {
	req.session = null;
	res.redirect("/companies/login");
});
export default router;
