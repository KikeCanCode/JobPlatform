
import express from "express";
import { ensureLoggedIn } from "../Middlewares/graduateAuthentication.js";
import Application from "../Model/applicationsModel.js";

const router = express.Router();

router.post("/myapplications", ensureLoggedIn, async (req, res) => {
  const {
    jobId,
    graduateId,
    firstName,
    lastName,
    email,
    coverLetter,
    cvPath, 
  } = req.body;

  try {
    const application = await Application.createApplication({
      job_id: jobId,
      graduate_id: graduateId,
      first_name: firstName,
      last_name: lastName,
      email: email,
      cover_letter: coverLetter,
      cv_path: cvPath,
    
    });

    res.status(201).json(application);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Error creating application." });
  }
});

//Get applications by Graduates - Recruiters

router.get("/graduates/:graduateId", ensureLoggedIn, async (req, res) => {
	const { graduateId } = req.params;

	try {
		const applications = await Application.getApplicationByGraduate(graduateId);
		// res.status(200).json(applications);
		res.render("graduates/myApplications", { applications });
	} catch (err) {
		console.error(err);
		res.status(500).send({ error: "Error retrieving applications for the graduate." });
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
