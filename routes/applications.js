import express from "express";
import { ensureLoggedIn } from "../Middlewares/graduateAuthentication.js";

const router = express.Router();

//Get applications by Graduates

router.get("/graduates/:graduateId", ensureLoggedIn, async (req, res) => {
	const { graduateId } = req.params;

	try {
		const applications = await getApplicationByGraduates(graduateId);
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
