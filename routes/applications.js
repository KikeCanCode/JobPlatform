
import express from "express";
import { ensureLoggedIn } from "../Middlewares/graduateAuthentication.js";
import Application from "../Model/applicationsModel.js"; // Class 
import multer from "multer";
import { ensureCompanyLoggedIn } from "../Middlewares/companyAuthentication.js";

const router = express.Router();

// Multer configuration 
const cvStorage = multer.diskStorage({
	destination: (req, file, callBack) => {
		callBack(null, "uploads/cvs");
	},
	filename: (req, file, callBack) => {
		callBack(null, `${Date.now()}-${file.originalname}`);
	},
});

const uploadCV = multer({ storage: cvStorage });


// Graduate Application Submission
// router.post("/myApplications", ensureLoggedIn,  uploadCV.single("cv"), async (req, res) => { 
 router.post("/apply", ensureLoggedIn, uploadCV.single("cv"), async (req, res) => {
  const graduateId = req.session.graduateId;
  const {
    jobId,
    // graduateId,
    firstName,
    lastName,
    email,
    coverLetter,
    // cvPath, 
  } = req.body;

  const cvPath = req.file.filename; // multer adds this

  try {
     await Application.createApplication({
      	jobId,
		graduateId,
		firstName,
		lastName,
		email,
		coverLetter,
		cvPath,
      	date_applied: new Date(),
    
    });

    res.redirect("/graduates/myApplications");
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Error creating application." });
  }
});


//Get applications by Graduates - Recruiters

router.get("/graduates/graduateId", ensureCompanyLoggedIn, async (req, res) => { // "/graduates/:graduateId" - this was displaying applications by all graduates
	const { graduateId } = req.params;

	try {
		const applications = await Application.getApplicationByGraduate(Number(graduateId));
		// res.status(200).json(applications);
		res.render("graduates/myApplications", { applications });
	} catch (err) {
		console.error(err);
		res.status(500).send({ error: "Error retrieving applications for the graduate." });
	}
});


// Delete an Application - companies
router.delete("/:applicationId", ensureCompanyLoggedIn, async (req, res) => { // Updated Middleware from ensureLoggedIn to ensureCompanyLoggedIn as it was rendering graduates login after deleting.
	const { applicationId } = req.params;

	try {
		// await deleteApplication(applicationId);
		await  Application.deleteApplication(applicationId);
		res.redirect("/companies/applications");
	} catch (err) {
		console.error(err);
		res.status(500).send({ error: "Error deleting application." });
	}
});


// Graduate withdraws their application
router.delete("/graduate/:applicationId", ensureLoggedIn, async (req, res) => {
    const { applicationId } = req.params;

    try {
        await Application.deleteApplication(applicationId);
        res.redirect("/graduates/myApplications");
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Error withdrawing application." });
    }
});


export default router;
