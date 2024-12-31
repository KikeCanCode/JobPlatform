
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

const generateToken = (company) => { 
    return jwt.sign(
        { id: company.id, role: "company"}, 
        process.env.JWT_SECRET, { expiresIn: "1h"});
};

// Companies Sign-up
router.post("/signup", async (req, res) => {
	const { name, email, password } = req.body; 
	
	try {
		const hashedPassword = await bcrypt.hash(password, 10);
// Insert into the database using Drizzle ORM
		await db
		.insert(companiesTable)
		.values({ name, email, password_hash: hashedPassword,
		});

		return res
			.status(201)
			.send({ message: "Company account created successfully!" });
	} catch (err) {
		res.status(500).send({ Error: "Error creating account" });
	}
});

// Companies Login
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const results = await db
            .select()
            .from(companiesTable)
            .where(companiesTable.email, "=", email);

        if (results.length === 0) {
            return res.status(401).send({ error: "Invalid email or password" });
        }

        const company = results[0];
        const isMatch = await bcrypt.compare(password, company.password_hash);

        if (!isMatch) {
            return res.status(401).json({
                error: "Incorrect email or password. Please check your credentials.",
            });
        }

        const token = generateToken(company);
        res.json({ message: "Login successful!", token });
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Error during login" });
    }
});

// Post a Job 
router.post("/jobs", verifyToken, async (req, res) => {
    const { title, description, salary, location } = req.body;
    const companyId = req.user.id; // Extracted from the token by verifyToken middleware

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

/* // Post a Job - Option 2 which one is suitable?
router.post("/", verifyToken, async (req, res) => {
    const { title, description, salary } = req.body;
    const companyId = req.user.id; // Extracted from token by authMiddleware

    try {
        await Job.create({ title, description, salary, companyId });
        res.status(201).send({ message: "Job posted successfully!" });
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Error posting job" });
    }
});
*/

//Review applications 
router.get("/applications/:jobId", verifyToken, async(req, res) => {
    const {jobId} = req.params;
    try {
        const applications = await db
		.select({
			applicationId: applicationsTable.id,
			graduateId: applicationsTable.graduate_id,
			graduateName: graduatesTable.name,
			dateApplied: applicationsTable.date_applied,
		})
		.from(applicationsTable)
		.innerJoin(graduatesTable, graduatesTable.id, "=", applicationsTable.graduate_id)
		.where(applicationsTable.job_id, "=", jobId);

	// Check if no applications found
	if (applications.length === 0) {
		return res.status(404).json({ message: "No applications found for this job." });
	}

	res.status(200).json(applications);
} catch (error) {
	console.error(error);
	res.status(500).send({ error: "Error retrieving applications" });
}
});


// Delete Account
router.delete("/delete", verifyToken, async (req, res) => {
    try {
        await db
		.delete()
        .from(companiesTable)
        .where({ id: companyId });
        res.send({ message: "company account deleted uccessfuly!"});
    } catch (error) {
        console.error(err);
        res.status(500).send({ error: "error deleting account"});
    }
});

// Pay Fee for posting a job 