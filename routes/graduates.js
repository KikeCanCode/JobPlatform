// Gradutes CRUD Operations

import bcrypt from "bcrypt";
import express from "express";
import multer from "multer"; // Multer is a node.js middleware for handling multipart/form-data, which is primarily usedused to uplode file
import fetch from "node-fetch";
import db from "../db/index.js"; // Drizzle Orm Connection
import { applicationsTable, graduatesTable, jobsTable } from "../db/schema.js";
import { eq } from "drizzle-orm";

const router = express.Router();

/*Middleware to check if a graduate is logged in. Usage:
router.method("/path", ensureLoggedIn, (req, res) => { ...
*/

// This puts the graduate object in req.graduate if they are logged in.
async function ensureLoggedIn(req, res, next) {
	if (!req.session?.graduateId) {
		return res.redirect("/graduates/login");
	}

	const results = await db
		.select()
		.from(graduatesTable)
		.where({ id: req.session.graduateId });

	if (results.length !== 1) {
		req.session = null; // Delete any session state and logout for safety
		return res.redirect("/"); //redirect to homepage
	}

	req.graduate = results[0];

	return next();
}

// Display Graduates Login Page
router.get("/login", (req, res) => {
	res.render("graduates/login");
});

//  Route - Graduate Login
router.post("/login", (req, res) => {
	const { email, password } = req.body;
	db.select()
		.from(graduatesTable)
		.where({ email })
		.execute()
		.then(async (results) => {
			if (results.length === 0) {
				return res.status(401).send("Invalid password or username");
			}

			const graduate = results[0];

			try {
				const isMatch = await bcrypt.compare(password, graduate.password_hash);

				if (isMatch) {
					req.session.mode = "graduate";
					req.session.graduateId = graduate.id;

					return res.redirect("/graduates/dashboard");
				
				// biome-ignore lint/style/noUselessElse: <explanation>
								} else {
					req.session = null;
				
					return res.status(401).json({
						error:
							"Incorrect username or password. Please check your credentials.",
					});
				}
			} catch (err) {
				console.log(err) // Just notification
				res.status(500).send("Error logging in");
			}
		});
});

// Display Graduates Sign-Up Page
router.get("/signup", (req, res) => {
	res.render("graduates/signup");
});

// Route - Graduate Sign-up
router.post("/signup", async (req, res) => {
	const { email, password } = req.body;

	try {
		const hashedPassword = await bcrypt.hash(password, 10);

		const result = await db
			.insert(graduatesTable)
			.values({
				email,
				password_hash: hashedPassword,
			}).$returningId()

		const { id } = result[0]; // get the id of the inserted graduate

		req.session.graduateId = id; // read back into session

		return res
			.redirect("/graduates/registrationForm")
	} catch (err) {
		console.log(err)
		res.status(500).send("Error creating account");
	}
});

// Display Graduates Registration Page
router.get("/registrationForm", ensureLoggedIn, async (req, res) => {
	const graduate = req.graduate;
	return res.render("graduates/registrationForm", { graduate });
});

//Route - Graduates Registration
router.post("/registrationForm", ensureLoggedIn, async (req, res) => { // no need to include email and password in the constructor as they were already collected.
	const { firstName, lastName, contactNumber, qualification, bootcampInstitute, graduationYear, skills, certificatePath } = req.body;

	try {
		// Retrieve email & password from session
		const id = req.session.graduateId;
		await db
			.update(graduatesTable)
			.set({
				first_name: firstName,
				last_name: lastName,
				contact_number: contactNumber,
				qualification,
				bootcamp_institute: bootcampInstitute,
				graduation_year: graduationYear,
				skills,
			})
			.where(eq(graduatesTable.id, id)); // In Drizzle, updates are usually done like this (eq)?
		
		// Redirect to the dashboard
		res.redirect("/graduates/dashboard");
	} catch (error) {
		console.error(error);
		res.status(500).send("Error saving registration details");
	}
});

//Display Graduates Dashboard
router.get("/dashboard", ensureLoggedIn, async (req, res) => {
	console.log(req.graduate);

	res.render("graduates/dashboard", { graduate: req.graduate });
});

// View Graduate profile
router.get("/profile", ensureLoggedIn, async (req, res) => {
	try {
		// Query to fetch specific fields from the graduatesTable
		const graduate = req.graduate;

		res.render("graduates/profile", { graduate: graduate });
	} catch (err) {
		console.log(err)
		res.status(500).body("Internal Server Error");
	}
});

//Display Graduates Dashboard
router.get("/updateProfile", ensureLoggedIn, async (req, res) => {
    try {
        console.log(req.graduate); //Check if graduate data exists
        const graduate = req.graduate;
        if (!graduate) {
            return res.status(404).json({ error: "graduate not found" });
        }
		res.render("graduates/updateProfile", { graduate });
	    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Graduates Update details
router.post("/updateProfile", ensureLoggedIn, async (req, res) => { // Chnage PUT method to POST - (So No need script.js)
	const { 
		firstName, 
		lastName, 
		email, 
		contactNumber, 
		qualification, 
		bootcampInstitute, 
		graduationYear, 
		skills, } = req.body;

	try {
		const results = await db
			.update(graduatesTable)
			.set({
				first_name: firstName,
				last_name: lastName,
				email,
				contact_number: contactNumber,
				qualification,
				bootcamp_institute: bootcampInstitute,
				graduation_year: graduationYear,
				skills,
			})
			// .where("id", graduateId)
			.where(eq(graduatesTable.id, req.graduate.id))			.execute();

		if (results.affectedRows === 0) {
			//If affectedRows is 0, it means that no rows in the database were updated,
			return res.status(404).json({ error: "Graduate not found" });
		}
		// res.json({ message: "Graduate profile updated successfully!" });
		
		res.redirect("/graduates/profile"); // Redirect to the profile page after update	} catch (err) {
		} catch (err) {
			console.log(err)
		res.status(500).json({ error: err.message });

	}
});

//Apply for jobs
router.get("/jobs/:jobId/apply", ensureLoggedIn, async (req, res) => {
	const { jobId } = req.params;
	const graduateId = req.graduateId;

	try {
		await db
			.insert()
			.into(applicationsTable)
			.values({ graduate_id: graduateId, job_id: jobId }) //map to the respective database column names
			.execute();

		res.json({ message: "Job application submitted successfully!" });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// View Job applications
router.get("/myApplications", ensureLoggedIn, async (req, res) => {
	const graduateId = req.graduateId;

	try {
		const results = await db
			.select()
			.from(applicationsTable)
			.join(jobsTable, 'applications.job_id', '=', 'jobsTable.job_id') //jobsTable.job_id: Refers to the column job_id in the jobsTable (database).
			.where('applications.graduate_id', graduateId)
			.execute();

		res.render("graduates/myApplications", { applications: results }); // aplication is aproperty - result is any
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});



// Bootcamp Certificate Uploading - Configure Multer storage

const storage = multer.diskStorage({
    destination: (req, file, callBack) => {
        callBack(null, "uploads/certificates"); // Create this folder exists in the root project
    },
    filename: (req, file, callBack) => {
        callBack(null, `${Date.now()}-${file.originalname}`);
    },
});

const upload = multer({ storage });

// Upload certificate route
router.post("/upload-certificate", upload.single("certificate"), async (req, res) => { // "/upload-certificate" -  is just an endpoint URL, not a file path. 
    if (!req.file) { 
        return res.status(400).json({ error: "No file uploaded." });
    }

    const graduateId = req.body.graduateId;
    const certificatePath = req.file.path; // Refers to the Path where file is stored

    try {
        const results = await db
            .update(graduatesTable)
            .set({ certificate: certificatePath })
            .where(eq(graduatesTable.id, graduateId))
            .execute();

        if (results.affectedRows === 0) {
            return res.status(404).json({ error: "Graduate not found" });
        }

        res.json({ message: "Certificate uploaded successfully!", path: certificatePath });
    } catch (err) {
        console.error("Upload Error:", err);
        res.status(500).json({ error: err.message });
    }
});

//Delete Graduate Account

router.delete("/delete", ensureLoggedIn, async (req, res) => {
	try {
		await db
			.delete()
			.from(graduatesTable)
			.where({ id: req.graduateId });
		res.send({ message: "Graduate account deleted successfuly!" });
	} catch (error) {
		console.error(err);
		res.status(500).send({ error: "error deleting account" });
	}
});

// Integrating CAPTCHA verification
router.post("/signup", async (req, res) => {
	const { password, recaptchaToken } = req.body;
	const verifyUrl = " "; // register domain name on google recaptcha to get the url

	try {
		const captchaResponse = await fetch(verifyUrl, { method: " POST" });
		const data = await captchaResponse.json();
		if (!data.success) {
			return res.status(400).send("CAPTCHA verification failed.");
		}
	} catch (err) {
		res.status(500).send("CAPTCHA verification erro.");
	}
});

//Logout Route - this destroys session and redirects to login
router.get("/logout", (req, res) => {
	req.session.destroy(() => {
		res.redirect("/graduates/login");
	});
});

export default router;
