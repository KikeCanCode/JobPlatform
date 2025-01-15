import express from "express";
import verifyToken from "../middlewares/authMiddleware.js";
import Job from "../Model/jobs.Model.js";

const router = express.Router();

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
	try {
		const jobs = await Job.findByCompanyid(companyId);
		res.json(jobs);
	} catch (err) {
		console.error(err);
		res.status(500).send({ error: "Error retrieving jobs" });
	}
});

// Update Job Status (e.g., Open, Close, Expired)
router.patch("/:jobid/status", verifyToken, async (req, res) => {
	const { jobI } = req.params;
	const { status } = req.body;

	try {
		await Job.updatesStatus(jobI, status);
		res.send({ message: "Job status updated successfully!" });
	} catch (err) {
		console.error(err);
		res.status(500).send({ error: "Error updatin jobs status" });
	}
});

export default router;
