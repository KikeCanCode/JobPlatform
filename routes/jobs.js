import express from "express";
import verifyToken from "../Middlewares/authMiddleware.js";
import Job from "../Model/jobsModel.js";
import { jobsTable } from "../db/schema.js";

const router = express.Router();



//Display job list on a webpage - (Webpage route) Fetches jobs from the database/Renders an HTML page (jobs/jobList.ejs) to display

router.post("/jobsList", (req, res) => {  
    res.redirect("/jobs/jobList"); 
});

router.get("/jobList", async (req, res) => {
	try {
		const jobs = await db
		.select()
		.from(jobsTable)
		.execute();
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
		const job = await db
			.select()
			.from(jobsTable)
			.where({ id: jobId })
			.execute();

		if (job.length === 0) {
			return res.status(404).send({ error: "Job not found" });
		}

		res.json(job[0]);
	} catch (err) {
		console.error("Error fetching job:", err);
		res.status(500).send({ error: "Error fetching job details" });
	}
});

// Get all jobs Routes 
router.get("/jobs", async (req, res) => {
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

// Post a Job
router.post("/jobs", verifyToken, async (req, res) => {
	const {
		title,
		description,
		salary,
		qualificationRequired,
		applicationLimit,
		expirationDate,
		location,
	} = req.body;
	const companyId = req.user.id; // Extracted from the token by verifyToken middleware

	try {
		await Job.create({
			// Used to add data
			companyId,
			title,
			description,
			salary,
			qualificationRequired,
			applicationLimit,
			expirationDate,
			location,
		});
		res.status(201).send({ message: "Job posted successfuly!" });
	} catch (err) {
		console.error(err);
		res.status(500).send({ error: "Error posting job" });
	}
});

// Get All Jobs by a Company
router.get("/", verifyToken, async (req, res) => {
	const companyId = req.user.id; // Extracted from the token by verifyToken middleware

	try {
		const jobs = await Job.findByCompanyId(companyId);
		res.json(jobs);
	} catch (err) {
		console.error(err);
		res.status(500).send({ error: "Error retrieving jobs" });
	}
});

// Update Job Status (e.g., Open, Close, Expired)
router.patch("/:jobId/status", verifyToken, async (req, res) => {
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

// Search for jobs
/*router.get("/jobs", (req, res) => {
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
router.get("/jobs", async (req, res) => {
	const { title, location, skills, education, datePosted } = req.query;
	// Start with the base query
	let query = db.select("*").from("jobs"); // Select all fields from jobs table

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

	/*try {
		const results = await query.execute();
		res.json({ data: results });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}*/
	try {
        const results = await query.execute();
        res.render("jobs/jobsList", { jobs: jobsList }); // Render results in a view
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


export default router;
