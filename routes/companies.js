// Companies Routes
import bcrypt from "bcrypt";
import express from "express";
import jwt from "jsonwebtoken";
import db from "../db/index.js"; // database connection
import { applicationsTable, companiesTable, jobsTable } from "../db/schema.js";
import verifyToken from "../Middlewares/verifyAdminToken.js";
//import Stripe from "stripe"; // Import Stripe for payment processing 
const router = express.Router();

// Function to generate a JWT token

const generateToken = (company) => {
	return jwt.sign({ id: company.id, role: "company" }, process.env.JWT_SECRET, {
		expiresIn: "1h",
	});
};

// Companies Sign-up
router.post("/signup", async (req, res) => {
	const { name, email, password } = req.body;

	try {
		const hashedPassword = await bcrypt.hash(password, 10);
		// Insert into the database using Drizzle ORM
		await db.insert(companiesTable).values({
			name,
			email,
			password_hash: hashedPassword,
		});

		return res
			.status(201)
			.send({ message: "Company account created successfully!" });
	} catch (err) {
		res.status(500).send({ Error: "Error creating account" });
	}
});

// Companies Login
router.post("/login", (req, res) => {
	const { email, password } = req.body; //const { username, password } = req.body;
	db.select()
		.from(companiesTable)
		.where({ email })//.where({ username })
		.execute()
		.then(async (results) => {
			if (results.length === 0) {
				return res.status(401).send("Invalid password or username");
			}

			const graduate = results[0];

			try {
				const isMatch = await bcrypt.compare(password, company.password_hash);

				if (isMatch) {
					req.session.mode = "company";
					req.session.companyId = company.id;

					res.redirect("/company/dashboard");
				} else {
					req.session = null;

					res.status(401).json({
						error:
							"Incorrect username or password. Please check your credentials.",
					});
				}
			} catch (err) {
				res.status(500).send("Error logging in");
			}
		});
});
// Take Companies to the Dashbord
async function getCurrentUser(req, res) {
	if (req.session?.companyId) {
		const results = await db
			.select()
			.from(companiesTable)
			.where({ id: req.session.companyId });

		if (results.length !== 1) {
			req.session = null; // Delete any session state and logout for safety
			res.redirect("/");
		}

		return results[0];
	}

	return null;
}

router.get("/dashboard", async (req, res) => {
	const company = await getCurrentUser(req, res);
	if (!company) {
		return res.redirect("/");
	}

	res.render("company/dashboard", { company: company });
});

//Review applications
router.get("/applications/:jobId", verifyToken, async (req, res) => {
	const { jobId } = req.params;
	try {
		const applications = await db
			.select()
			// .select({
			// 	applicationId: applicationsTable.id,
			// 	graduateId: applicationsTable.graduate_id,
			// 	graduateName: graduatesTable.name,
			// 	dateApplied: applicationsTable.date_applied,
			// })
			.from(applicationsTable)
			.innerJoin(
				graduatesTable,
				graduatesTable.id,
				"=",
				applicationsTable.graduate_id,
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
		console.error(error);
		res.status(500).send({ error: "Error retrieving applications" });
	}
});

// Companies Update details
router.put("/update-profile", async (req, res) => {
	const {
		companyId,
		companyName,
		email,
		username,
		contactNumber,
		companyAddress,
		companyProfile,
	} = req.body;

	try {
		const results = await db
			.update(graduatesTable)
			.set({
				company_name: companyName,
				username,
				email,
				contact_number: contactNumber,
				company_address: companyAddress,
				company_profiles: companyProfile,
			})
			.where("id", graduateId)
			.execute();

		if (results.affectedRows === 0) {
			//If affectedRows is 0, it means that no rows in the database were updated,
			return res.status(404).json({ error: "Company not found" });
		}
		res.json({ message: "Company details updated successfully!" });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Delete Account
router.delete("/delete", verifyToken, async (req, res) => {
	try {
		await db.delete().from(companiesTable).where({ id: companyId });

		res.send({ message: "company account deleted successfuly!" });
	} catch (error) {
		console.error(err);
		res.status(500).send({ error: "error deleting account" });
	}
});

// Pay Fee for posting a job

//const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); // Use your Stripe secret key

// Post a Job with Payment
router.post("/jobs-with-payment", verifyToken, async (req, res) => {
	const { title, description, salary, location, amount, currency } = req.body;
	const companyId = req.user.id; // Extracted from the token by verifyToken middleware

	try {
		// Step 1: Create a Payment Intent
		const paymentIntent = await stripe.paymentIntents.create({
			amount, // Amount in the smallest currency unit (e.g., 500 for £5.00)
			currency, // Currency code, e.g., 'gbp'
			description: `Job Post Payment for ${title}`, // Payment description
			metadata: { companyId, title }, // Add metadata for tracking
		});

		// Step 2: Confirm the payment (frontend should send client_secret for this)
		// For now, return the client secret to the frontend
		return res.status(201).send({
			clientSecret: paymentIntent.client_secret,
			message: "Payment intent created successfully. Confirm payment to post the job!",
		});
	} catch (err) {
		console.error(err.message);
		return res.status(500).send({ error: "Error processing payment" });
	}
});

// Confirm Job Posting after Payment
router.post("/confirm-job-post", verifyToken, async (req, res) => {
	const { title, description, salary, location, paymentIntentId } = req.body;
	const companyId = req.user.id;

	try {
		// Step 1: Retrieve the payment intent to confirm successful payment
		const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

		if (paymentIntent.status !== "succeeded") {
			return res.status(400).send({ error: "Payment not completed. Cannot post the job." });
		}

		// Step 2: Insert the job into the database after successful payment
		await db.insert(jobsTable).values({
			title,
			description,
			salary,
			location,
			company_id: companyId,
		});

		res.status(201).send({ message: "Job posted successfully after payment!" });
	} catch (err) {
		console.error(err.message);
		return res.status(500).send({ error: "Error confirming job post after payment" });
	}
});

export default router;
