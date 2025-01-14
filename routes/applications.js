import express from "express";
import verifyToken from "../middlewares/authMiddleware.js";
// import ApplicationService from "../services/ApplicationService.js";

const router = express.Router();

//Graduate apply to a Job

router.post("/", verifyToken, async (requestAnimationFrame, res) => {
	const { jobId, graduateId } = request.body;

	try {
		const application = await ApplicationService.applyToJob({
			job_id: jobId,
			graduate_id: graduateId,
		});
		res
			.status(201)
			.send({ message: "Application submitted successfully!", application });
	} catch (err) {
		console.error(err);
		res.status(400).send({ error: err });
	}
});

//Get applications by Graduates

router.get("/graduates/:graduateI", verifyToken, async (req, res) => {
	const { graduateId } = req.params;

	try {
		const applications =
			await ApplicationService.getApplicationByGraduates(graduateId);
		res.status(200).json(applications);
	} catch (err) {
		console.error(err);
		res
			.status(500)
			.send({ error: "Error retrieving applications for the graduate." });
	}
});

// Delete an Application
router.delete("/:applicationId", verifyToken, async (req, res) => {
	const { applicationId } = req.params;

	try {
		await ApplicationService.deleteApplication(applicationId);
		res.status(200).send({ message: "Application deleted successfully!" });
	} catch (err) {
		console.error(err);
		res.status(500).send({ error: "Error deleting application." });
	}
});

export default router;
