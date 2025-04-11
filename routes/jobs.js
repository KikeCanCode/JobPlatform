import express from "express";
import Job from "../Model/jobsModel.js";
import { jobsTable } from "../db/schema.js";
import { ensureLoggedIn } from "../Middlewares/companyAuthentication.js";
import db from "../db/index.js"; // database connection

const router = express.Router();

//Display job Posting Form
router.get("/post-jobs", ensureLoggedIn, (req, res) => {
	res.render("jobs/post-jobs"); 
});

// Post a Job
router.post("/post-jobs", ensureLoggedIn, async (req, res) => {
	const {
		
		title,
		job_description: description,
		salary,
		location,
		// qualification_required:qualificationRequired,
		application_limit: applicationLimit,
		expiration_date: expirationDate,
		
	} = req.body;
	
	// const companyId = req.user.id; // Extracted from the token by ensureLoggedIn middleware
	const companyId = req.company.id;

	try {
		// await Job.create({
			await db
			.insert(jobsTable)
			.values({
			// Used to add data
			company_id: companyId,
			title,
			job_description: description,
			salary,
			location,
			//qualification_required, qualificationRequired,
			// application_limit: applicationLimit,
			// expiration_date: expirationDate,
			
		});
		res.status(201).send({ message: "Job posted successfuly!" });
	} catch (err) {
		console.error(err);
		res.status(500).send({ error: "Error posting job" });
	}
});

//Display job list on a webpage - 
router.get("/jobsList", async (req, res) => { // url endpont no need to add folder name
    try {
        const jobs = await Job.findAll(); // ORM approach for fetching all jobs
        res.render("jobs/jobList", { jobs });
    } catch (err) {
        console.error("Error fetching job list:", err);
        res.status(500).send({ error: "Error fetching job list" });
    }
});

// Get a single job by ID
router.get("/jobs/:id", async (req, res) => {
    const jobId = req.params.id;

    try {
        const job = await Job.findById(jobId); // ORM approach to get job by ID

        if (!job) {
            return res.status(404).send({ error: "Job not found" });
        }

        res.json(job);
    } catch (err) {
        console.error("Error fetching job:", err);
        res.status(500).send({ error: "Error fetching job details" });
    }
});

// Get all jobs Routes 
router.get("/jobsList", async (req, res) => {
	try {
		const jobs = await db
		.select()
		.from(jobsTable)
		.execute();

		res.json(jobs);
	} catch (err) {
		console.error("Error fetching jobs:", err);
		res.status(500).send({ error: "Error fetching job list" });
	}
});


// Get All Jobs by a Company - Ensure logged-in
router.get("/postedJobs", ensureLoggedIn, async (req, res) => {
	const companyId = req.user.id; // Extracted from the token by ensureLoggedIn middleware

	try {
		const jobs = await Job.findByCompanyId(companyId);
		res.json(jobs);
	} catch (err) {
		console.error(err);
		res.status(500).send({ error: "Error retrieving jobs" });
	}
});

// Update Job Status (e.g., Open, Close, Expired)
router.patch("/:jobId/status", ensureLoggedIn, async (req, res) => {
	const { jobI} = req.params;
	const { status } = req.body;

	try {
		await Job.updatesStatus(jobI, status);
		res.send({ message: "Job status updated successfully!" });
	} catch (err) {
		console.error(err);
		res.status(500).send({ error: "Error updatin jobs status" });
	}
});

/*

Search for jobs
router.get("/jobs", (req, res) => {
	const { lcation, skills, education, datePosted } = req.query;
	let query = " SELECT * FROM jobs WHERE 1=1";
	const queryParams = [];

	if (location) {
		query += "AND location = ?";
		queryParams.push(location);
	}
	if (skills) {
		query += "AND skills LIKE ?";
		queryParams.push(`%${skills}%`);
	}
	if (education) {
		query += "AND education =?";
		queryParams.push(education);
	}
	if (datePosted) {
		query += "AND date_posted >= ?";
		queryParams.push(datePosted);
	}

	db.query(query, queryParams, (err, results) => {
		if (err) return res.status(500).json({ error: err.message });
		res.json({ data: results });
	});
});
*/
//Search for jobs
router.get("/jobsList", async (req, res) => {
	const { title, location, skills, education, datePosted } = req.query;
	// Start with the base query
	
	let query = Job.query(); // Replace with your ORM's method for starting a query

	// Dynamically build query based on filters provided in query params
	if (title) {
        query = query.where("title", "LIKE", `${title}%`); 
    }
	if (location) {
		query = query.where("location", location); // Apply location filter
	}
	if (skills) {
		query = query.where("skills", "LIKE", `%${skills}%`); // Apply skills filter using LIKE
	}
	if (education) {
		query = query.where("education", education); // Apply education filter
	}
	if (datePosted) {
		query = query.where("date_posted", ">=", datePosted); // Apply datePosted filter
	}
	try {
        // const results = await query.execute();
		const jobs = await query.execute();
        res.render("jobs/jobsList", { jobs }); // Render results in a view
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
