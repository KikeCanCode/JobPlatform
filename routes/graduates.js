// Gradutes CRUD Operations

import bcrypt from "bcrypt";
import express from "express";
import multer from "multer"; // Multer is a node.js middleware for handling multipart/form-data, which is primarily usedused to uplode file
import fetch from "node-fetch";
import db from "../db/index.js"; // Drizzle Orm Connection
import { applicationsTable, graduatesTable, jobsTable } from "../db/schema.js";
import verifyToken from "../Middlewares/verifyAdminToken.js";
import { eq } from "drizzle-orm";

const router = express.Router();

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

					res.redirect("/graduates/dashboard");
				} else {
					req.session = null;

					res.status(401).json({
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

		const { id } = await db
		.insert(graduatesTable)
		.values({ 
			email,
			password_hash: hashedPassword,
		}).$returningId();

		req.session.graduateId = id; // read back into session

		return res
			.redirect("/graduates/registrationForm")
	} catch (err) { 
		console.log(err)
		res.status(500).send("Error creating account" );
	}
}); 

// Display Graduates Registration Page  - Ensure to render login page when clicked or back 
// router.get("/registrationForm", async (req, res) => {
// 	const graduate = await getCurrentUser(req, res); // Could extract this to use as Middleware - put in Middle folder for reusability for bigger project.
// 	if (!graduate) {
// 		return res.redirect("/graduates/login"); // redirecct to login page 
// 	}
//     res.render("graduates/registrationForm"); // redirect to registeration page after login 
	 
// });

// Display Graduates Registration Page
router.get("/registrationForm", async (req, res) => {
    const graduate = await getCurrentUser(req, res); 

    // if (!graduate) {
        return res.render("graduates/registrationForm");
    
    // res.redirect("/graduates/dashboard"); 
	// return res.redirect("/graduates/dashboard"); 

});

//Route - Graduates Registration 
router.post("/registrationForm", async (req, res) => { // no need to include email and password in the constructor as they were already collected.
    const { firstName, lastName, contactNumber, qualification, bootcampInstitute, graduationYear, skills, certificatePath } = req.body;

    try {
        // Retrieve email & password from session
        const id  = req.session.graduateId;
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
 		// req.session.mode = "graduate"
        // Redirect to the dashboard 
        res.redirect("/graduates/dashboard");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error saving registration details");
    }
});

//Display Graduates Dashboard
router.get("/dashboard", async (req, res) => {
	const graduate = await getCurrentUser(req, res);
	// if (!graduate) { // Removed !
	if (graduate) {
		// return res.redirect("/"); // This was the issue why it logged me out and redirect to the home page.
	}

	res.render("graduates/dashboard", { graduate: graduate});
});

// // Display Graduates Dashboard
// router.get("/dashboard", async (req, res) => { 
// 	const graduate = await getCurrentUser(req, res); // Could extract this to use as Middleware - put in Middleware folder for reusability for bigger project.
// 	if (!graduate) {
// 		// return res.redirect("/"); // This was the issue why it loggin me out and redirect to the home page.
// 	}
// 	res.render("graduates/dashboard", { graduate: graduate });
	
// });

// Take graduates to the Dashbord
async function getCurrentUser(req, res) {
	if (req.session?.graduateId) {
		const results = await db
			.select()
			.from(graduatesTable)
			.where({ id: req.session.graduateId });

		if (results.length !== 1) {
			// req.session = null; // Delete any session state and logout for safety
			// res.redirect("/"); //redirect to homepage
			res.redirect("/gradautes/dashboard");
			return null; // Instead of redirecting to homepage
		}

		return results[0];
	}

	return null;
}

//Apply for jobs
router.get("/jobs/:jobId/apply", verifyToken, async (req, res) => {
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
router.get("/myApplications", verifyToken, async (req, res) => {
	const graduateId = req.graduateId;

	try {
		const results = await db
			.select()
			.from( applicationsTable)
			.join( jobsTable, 'applications.job_id', '=', 'jobsTable.job_id') //jobsTable.job_id: Refers to the column job_id in the jobsTable (database).
			.where('applications.graduate_id', graduateId)
			.execute();

		res.render("graduates/myApplications", { applications: results }); // aplication is aproperty - result is any 
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// View Graduate profile
router.get("/profile", async (req, res) => {
	try {
		// Query to fetch specific fields from the graduatesTable
		const graduate = await getCurrentUser(req, res);
	
		res.render("graduates/profile", { graduate: graduate} );
	} catch (err) {
		console.log(err)
		res.status(500)("Internal Server Error");
	}

});

// Graduates Update details
router.put("/updateProfile", async (req, res) => {
	const {
		graduateId, firstName, lastName, email, contactNumber, qualification, bootcampInstitute, graduationYear, skills, } = req.body;

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
			.where("id", graduateId)
			.execute();

		if (results.affectedRows === 0) {
			//If affectedRows is 0, it means that no rows in the database were updated,
			return res.status(404).json({ error: "Graduate not found" });
		}
		res.json({ message: "Graduate profile updated successfully!" });
	} catch (err) {
		// res.status(500).json({ error: err.message });
		res.status(500).json({ error: err.message });

	}
});


// Bootcamp Certificate Uploading - Configure Multer storage
const storage = multer.diskStorage({
	destination: (req, file, callBack) => {
		callBack(null, "uploads/certificates");
	},
	filename: (req, file, callBack) => {
		callBack(null, `${Date.now()}-${file.originalname}`);
	},
});

const upload = multer({ storage });

// upload certificatte Rooute

router.post("/upload-certificate",upload.single("certificate"),async (req, res) => {

		const graduateId = req.body.graduateId;
		const certificatePath = req.file.path;

		try {
			const results = await db
				.update(graduatesTable)
				.set({ certificate: certificatePath })
				.where(eq(graduatesTable.id, graduateId))
				.execute();

			if (results.affectedRows === 0) {
				return res.status(404).json({ error: "Graduate not found" });
			}

			res.json({ message: "Certificate uploaded successfully!" });
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	},
);

//Delete Graduate Account

router.delete("/delete", verifyToken, async (req, res) => {
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
