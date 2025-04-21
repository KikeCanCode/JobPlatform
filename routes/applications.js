import express from "express";
import { ensureLoggedIn } from "../Middlewares/graduateAuthentication.js";

const router = express.Router();

//Graduate apply to a Job

// router.post("/jobs/:jobId/apply", ensureLoggedIn, async (req, res) => {
// 	const { jobId } = request.body;
// 	const graduateId = req.graduateId;

// 	try {
// 		await db
// 		.insert(applicationsTable)
// 		.values({
// 			job_id: jobId,
// 			graduate_id: graduateId,
// 		});
// 		res.redirect("/graduates/myApplications");
			
// 	} catch (err) {
// 		console.error(err);
// 		res.status(500).json({ error: "Error submitting job application"  });
// 	}
// });

router.post("/jobs/:jobId/apply", ensureLoggedIn, async (req, res) => {
	const { jobId } = req.params;
	const graduateId = req.graduateId;

	try {
		await applyToJob(graduateId, jobId);
		res.redirect("/graduates/myApplications");
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Error applying for job" });
	}
});

//Get applications by Graduates

router.get("/graduates/:graduateI", ensureLoggedIn, async (req, res) => {
	const { graduateId } = req.params;

	try {
		const applications =
			await getApplicationByGraduates(graduateId);
		// res.status(200).json(applications);
		res.render("graduates/myApplications", { applications });
	} catch (err) {
		console.error(err);
		res
			.status(500)
			.send({ error: "Error retrieving applications for the graduate." });
	}
});

// Delete an Application
router.delete("/:applicationId", ensureLoggedIn, async (req, res) => {
	const { applicationId } = req.params;

	try {
		await deleteApplication(applicationId);
		res.status(200).send({ message: "Application deleted successfully!" });
	} catch (err) {
		console.error(err);
		res.status(500).send({ error: "Error deleting application." });
	}
});

export default router;
