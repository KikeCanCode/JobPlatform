// Gradutes CRUD Operations

import bcrypt from "bcrypt";
import express from "express";
import multer from "multer"; // Multer is a node.js middleware for handling multipart/form-data, which is primarily usedused to uplode file
import fetch from "node-fetch";
import db from "../db/index.js"; // Drizzle Orm Connection
import { applicationsTable, graduatesTable, jobsTable } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { ensureLoggedIn } from "../Middlewares/graduateAuthentication.js";

const router = express.Router();

// Moved Graduates Middleware to the Middlewares Folder - import it


// Display Graduates Login Page

router.get("/login", (req, res) => {
	res.render("graduates/login" , { error: null, redirect: req.query.redirect || "" });
});

//  Route - Graduate Login
/*

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

*/

router.post("/login", (req, res) => {
	const { email, password, redirect } = req.body;

	db.select()
		.from(graduates)
		.where({ email })
		.execute()
		.then(async (results) => {
			if (results.length === 0) {
				return res.render("graduates/login", {
					error: "Invalid email or password",
					redirect,
				});
			}

			const graduate = results[0];

			try {
				const isMatch = await bcrypt.compare(password, graduate.password);

				if (isMatch) {
					req.session.mode = "graduate";
					req.session.graduateId = graduate.id;

					let redirectTo = "/graduates/dashboard";
					if (redirect) {
						redirectTo = redirect;
					}

					return res.redirect(redirectTo);

				// biome-ignore lint/style/noUselessElse: <explanation>
				} else {
					req.session = null;

					return res.render("graduates/login", {
						error: "Invalid email or password",
						redirect,
					});
				}
			} catch (error) {
				console.error("Login error:", error);
				return res.render("graduates/login", {
					error: "An error occurred. Please try again.",
					redirect,
				});
			}
		})
		.catch((error) => {
			console.error("Database error:", error);
			return res.render("graduates/login", {
				error: "An error occurred. Please try again.",
				redirect,
			});
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
// router.get("/dashboard", ensureLoggedIn, async (req, res) => {
// 	console.log(req.graduate);

// 	res.render("graduates/dashboard", { graduate: req.graduate });
// });
router.get("/dashboard", ensureLoggedIn, async (req, res) => { // Working - printing job applications 
	try {
		const graduateId = req.graduate.id;

		const applications = await db
			.select()
			.from(applicationsTable)
			.innerJoin(jobsTable, 
				eq(applicationsTable.job_id, jobsTable.id))
			.where(eq(applicationsTable.graduate_id, graduateId))
			.orderBy(applicationsTable.date_applied, 'desc'); 

		res.render("graduates/dashboard", { graduate: req.graduate, applications });
	} catch (err) {
		console.error(err);
		res.status(500).send("Error loading dashboard.");
	}

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

//Display Graduates Profile Update page 
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
			.where(eq(graduatesTable.id, req.graduate.id))			
			.execute();

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

// 1 Click on Apply Now -  Redirect to Login/Job Application page based on Login/or not

router.get("/jobs/:jobId/apply", async (req, res) => {
	const { jobId } = req.params;

	// Check if user is logged in
	if (!req.session.graduateId) {
		return res.redirect("/login");
	}

	// If logged in, redirect to the application submission page
	res.redirect(`/apply/${jobId}`);
});

// 2 - Apply for job - form submission

router.post("/jobs/:jobId/apply", ensureLoggedIn, async (req, res) => {
	const { jobId } = req.params;
	const graduateId = req.graduateId;

	if (!graduateId) {
		return res.redirect("/login");
	}
		try {
			await db
			.insert(applicationsTable)
			.values({
				graduateId,
				jobId,
			});
	
			res.redirect("/graduates/dashboard"); 
		} catch (err) {
			console.error(err);
			res.status(500).json({ error: "Error submitting job application" });
		}
	});


  //Job Detail Display 
router.get("/jobs/:jobId", async (req, res) => {
	const { jobId } = req.params;
	try {
	  const job = await db
	  .select()
	  .from(jobsTable)
	  .where(eq("jobs.id", jobId))
	  .then(rows => rows[0]);

	  if (!job) {
		return res.status(404).send("Job not found");
	}
	  res.render("graduates/jobsDetails", { job });
	} catch (error) {
	  console.error(error);
	  res.status(500).send("Error loading job details.");
	}
  });
  
// 3 - Display application form 
router.get("/apply/:jobId", ensureLoggedIn, async (req, res) => {

	const { jobId } = req.params;
	const graduateId = req.session.graduateId;
	if (!graduateId) {
		return res.redirect("/login");
	}
	try {
		// Fetch job details for the application form
		const job = await db
		.select()
		.from(jobsTable)
		.where(eq("jobs.id", jobId))
		.then(rows => rows[0]);
		if (!job) {
			return res.status(404).send("Job not found");
		}
		res.render("graduates/apply", { jobId, graduateId, job });
	} catch (error) {
		console.error("Error fetching job details:", error);
		res.status(500).send("Error loading application form.");
	}

	res.render("graduates/apply", { jobId,  graduateId }); 
});


//Multer setup for CV  Uploading - 
const cvStorage = multer.diskStorage({
    destination: (req, file, callBack) => {
        callBack(null, "uploads/cvs");
    },
    filename: (req, file, callBack) => {
        callBack(null, `${Date.now()}-${file.originalname}`);
    },
});

const uploadCV = multer({ storage: cvStorage });


 // 4 - Handle application form submission
   router.post("/apply/:jobId", uploadCV.single("cv"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No CV uploaded." });
    }

    const jobId = req.params.jobId;
    const { 
		firstName, 
		lastName, 
		email,
		coverLetter, 
		graduateId 
	} = req.body;
    const cvPath = req.file.path;

    try {
        const result = await db
            .insert(applicationsTable)
            .values({
				job_id: jobId,
                graduate_id: graduateId,
                first_name: firstName,
				last_name: lastName,
                email,
                cover_letter: coverLetter,
                cv: cvPath,
                date_applied: new Date(),
            })
            .execute();

			res.redirect("/graduates/dashboard");   
		} catch (err) {
        console.error("Application Error:", err);
        res.status(500).send("An error occurred while applying.");
    }
});

// View my applications 
router.get("/myApplications", ensureLoggedIn, async (req, res) => {
	const graduateId = req.graduateId;

	try {
		const results = await db
			.select()
			.from(applicationsTable)		
			.join(jobsTable, eq(applicationsTable.job_id, jobsTable.jobId)) //jobsTable.job_id: Refers to the column job_id in the jobsTable (database).
			.where(eq(applicationsTable.graduate_id, graduateId));
			// .execute();
			const applications = results;

		res.render("graduates/myApplications", { applications }); // aplication is aproperty - result is any
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
