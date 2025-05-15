import express from "express";
import Job from "../Model/jobsModel.js";
import { jobsTable } from "../db/schema.js";
import { ensureLoggedIn } from "../Middlewares/companyAuthentication.js";
import db from "../db/index.js"; // database connection
import { eq } from "drizzle-orm";
import { and } from "drizzle-orm";


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
		qualification_required:qualificationRequired,
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
			qualification_required: qualificationRequired,
			application_limit: applicationLimit,
			expiration_date: expirationDate,
			
		});
		// Redirect to dashboard or send response
	res.redirect("/companies/dashboard"); 
	} catch (err) {
		console.error(err);
		res.status(500).send({ error: "Error posting job" });
	}
});

//Display all jobs Routes (General Job Listing)
router.get("/jobsList", async (req, res) => { // url endpont no need to add folder name
    try {
        const jobs = await Job.findAll(); // ORM approach for fetching all jobs
        res.render("jobs/jobsList", { jobs });
    } catch (err) {
        console.error("Error fetching job list:", err);
        res.status(500).send({ error: "Error fetching job list" });
    }
});

router.get("/jobsDetails/:jobId", async (req, res) => {
  const { jobId } = req.params;

  try {
    const jobResult = await db
      .select()
      .from(jobsTable)
      .where(eq(jobsTable.id, jobId));

    const job = jobResult[0];

    if (!job) {
      return res.status(404).send("Job not found");
    }
	const isLoggedIn = !!req.session.gradauteId; // track login


    res.render("jobs/jobsDetails", { job, ensureLoggedIn, isLoggedIn });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error loading job details.");
  }
});

// Display form with Pre-filled details for editing.
router.get("/updateJobs/:id", ensureLoggedIn, async (req, res) => { 
	const jobId = req.params.id; 

	try {
		const job = await db
			.select()
			.from(jobsTable)
			.where(
				and(
					eq(jobsTable.id, jobId),
					eq(jobsTable.company_id, req.company.id)
				)
			)
			.execute();

		if (job.length === 0) {
			return res.status(404).send("Job not found or not authorised");
		}

		res.render("jobs/updateJobs", { job: job[0] }); 
	} catch (err) {
		console.error(err);
		res.status(500).send("Error fetching job for update");
	}
});

// Update Posted Jobs  
router.post("/updateJobs/:id", ensureLoggedIn, async (req, res) => { // Not working with PUT for some reason...
	const jobId = req.params.id;
	const {
		title,
		job_description: description,
		salary,
		location,
		qualification_required: qualificationRequired,
		application_limit: applicationLimit,
		expiration_date: expirationDate
	} = req.body;

	try {
		const results = await db
			.update(jobsTable)
			.set({
				title,
				job_description: description,
				salary,
				location,
				qualification_required: qualificationRequired,
				application_limit: applicationLimit,
				expiration_date: expirationDate
			})
			.where(
				and( //and() combines the two conditions below, so both must be true for the update to proceed.
					eq(jobsTable.id, jobId), //ensures targeting the correct job.
					eq(jobsTable.company_id, req.company.id)// ensures the job belongs to the requesting company.
				)
			)
			.execute();

		if (results.affectedRows === 0 || results.count === 0) {
			return res.status(404).json({ error: "Job not found or not authorised" });
		}

		// Redirect to the company's Dashboard after successful update
		res.redirect("/companies/dashboard");
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: err.message });
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

        res.render("jobs/jobsDetails", {job});
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Error fetching job details" });
    }
});



// Get All Jobs by a Company - Ensure logged-in
router.get("/postedJobs", ensureLoggedIn, async (req, res) => {
	const companyId = req.company.id; // Extracted from the token by ensureLoggedIn middleware

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
	const { jobId} = req.params;
	const { status } = req.body;
// Define allowed statuses
	const allowedStatuses = ["Open", "Closed", "Expired"];

	// Validate status input
	if (!allowedStatuses.includes(status)) {
		return res.status(400).json({
			error: `Invalid status. Allowed values are: ${allowedStatuses.join(", ")}`
		});
	}

	try {
		// Check if job exists and belongs to the logged-in company
		const job = await db
			.select()
			.from(jobsTable)
			.where(
				and(
					eq(jobsTable.id, jobId),
					eq(jobsTable.company_id, req.company.id)
				)
			)
			.execute();

		if (job.length === 0) {
			return res.status(404).json({ error: "Job not found or not authorised" });
		}

		// Update job status
		const result = await db
			.update(jobsTable)
			.set({ status })
			.where(eq(jobsTable.id, jobId))
			.execute();

		if (result.affectedRows === 0 || result.count === 0) {
			return res.status(400).json({ error: "Failed to update job status" });
		}

		res.json({ message: "Job status updated successfully!" });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Error updating job status" });
	}
});

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

// Delete Job 
router.post("/deleteJob/:id", ensureLoggedIn, async (req, res) => {
	try {
		await db
			.delete(jobsTable)
			.where(
				and(
					eq(jobsTable.id, req.params.id),
					eq(jobsTable.company_id, req.company.id)
				)
			)
			.execute();
		res.redirect("/companies/dashboard");
	} catch (err) {
		console.error(err);
		res.status(500).send("Error deleting job");
	}
});

export default router;
