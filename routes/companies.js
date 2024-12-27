
// Comapnies Routes
export default () => undefined; // What is this?

import bcrypt from "bcrypt";
import express from "express"; 
import db from "../db"; // database connection
import jwt from "jsonwebtoken"; 
import jobDescriptionFilter from "../middlewares/jobDescriptionFilter.js";
import { companiesTable, jobsTable, applicationsTable } from "../db/schema.js";
import verifyToken from "../middleware/verifyToken.js";
import { verifyCaptcha } from "../middlewares/captchaMiddleware.js";

const router = express.Router();

// Function to generate a JWT token 

const generateTken = (company) => { 
    return jwt.sign(
        { id: company.id, role: "company"}, 
        process.env.JWT_SECRET, { expiresIn: "1h"});
};

// Companies Sign-up
router.post("/signup", async (req, res) => {
	const { name, email, password } = req.body; 
	try {
		const hashedPassword = await bcrypt.hash(password, 10);

		await db.insert(companiesTableTable).values({ name, email, password_hash: hashedPassword,
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
	const { email, password } = req.body;

	db.select() // Used for database query 
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
					res.json({ message: " Login sucessful!" });
				} else {
					res.status(401).json({
						error:
							"Incorrect username or password. Please check your credentials.",
					});
				}
			} catch (err) {
				res.status(500).send("Error comparing password");
			}
		});
});
 
// Post a Job 
router.post("/jobs", verifyToken, async (req, res) => {
    const { title, description, salary, location } = req.body;
    const companyId =req.user.id; // Extracted from the token by verifyToken middleware

 try {
    await db.insert(jobsTable).values({ // Used to add data 
        title,
        description,
        salary,
        location,
        company_id: companyId,
    });
    res.status(201).send({message: "Job posted successfuly!"});
 } catch (err) {
    console.error(err);
    res.status(500).send({error: "Error posting job"});
 }
});

//Review applications 
router.get("/applications/:jobId", verifyToken, async(req, res) => {
    const {jobId} = req.params;
    try {
        const applications = await db.select()
        .from(applicationsTable)
        .where({ job_id: jobId});

        res.json(applications);

    } catch (error) {
        console.error(err);
        res.status(500).send({ error: "error retrieving applications"});
    }
});

// Delete Account
router.delete("/delete", verifyToken, async (req, res) => {
    try {
        await db.delete()
        .from(companiesTable)
        .where({ id: companyId });
        res.send({ message: "company account deleted uccessfuly!"});
    } catch (error) {
        console.error(err);
        res.status(500).send({ error: "error deleting account"});
    }
});

// Pay Fee for posting a job 