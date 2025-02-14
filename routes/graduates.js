// Gradutes CRUD Operations

import bcrypt from "bcrypt";
import express from "express";
import multer from "multer"; // Multer is a node.js middleware for handling multipart/form-data, which is primarily usedused to uplode file
import fetch from "node-fetch";
import db from "../db/index.js"; // Drizzle Orm Connection
import { graduatesTable } from "../db/schema.js";
import verifyToken from "../Middlewares/verifyAdminToken.js";

const router = express.Router();


// Display Graduates Login Page  
app.get("/login", (req, res) => {
    res.render("graduates/login");
});

// Display Graduates Sign-Up Page  
app.get("/signup", (req, res) => {
    res.render("graduates/signup");
});


// Graduate Sign-up
router.post("/signup", async (req, res) => {
	const { email, password } = req.body;

	try {
		const hashedPassword = await bcrypt.hash(password, 10);

		await db.insert(graduatesTable).values({
			//...req.body,
			username,
			email,
			password_hash: hashedPassword,
		});

		return res
			.status(201)
			.send({ message: "Graduate account created successfully!" });
	} catch (err) {
		res.status(500).send({ Error: "Error hashing password" });
	}
});

// Graduate Sign-up process handling - redirect to registration page 
router.post("/signup", async (req, res) => {
	const { email, password } = req.body;

	try {
		const hashedPassword = await bcrypt.hash(password, 10);

		// Store email & password temporarily (for registration step)
		req.session.tempUser = { email, password: hashedPassword }; // req.session.tempUseris a temporary storage for user data using sessions in Express

		// Redirect to registration form
		res.redirect("/graduates/registrationForm");
	} catch (err) {
		console.error(err);
		res.status(500).send({ Error: "Error hashing password" });
	}
});

router.post("/register", async (req, res) => { // no need to include email and password in the constructor as they were already collected.
    const { firstName, lastName, contactNumber, qualification, bootcampInstitute, graduationYear, skills, certificatePath } = req.body;

    try {
        // Retrieve email & password from session
        const { email, password } = req.session.tempUser;

        // Insert user into the database
        await db.insert(graduatesTable).values({
            email,
            password_hash: password, // Already hashed
            firstName,
            lastName,
            contactNumber,
            qualification,
            bootcampInstitute,
            graduationYear,
            skills,
            certificatePath
        });

        // Clear session data
        req.session.tempUser = null;

        // Redirect to the dashboard (to be created later)
        res.redirect("graduates/dashboard");
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});

// Graduate Login
router.post("/login", (req, res) => {
	const { email, password } = req.body; //const { username, password } = req.body;
	db.select()
		.from(graduatesTable)
		.where({ email })//.where({ username })
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
				res.status(500).send("Error logging in");
			}
		});
});

// Take graduates to the Dashbord
async function getCurrentUser(req, res) {
	if (req.session?.graduateId) {
		const results = await db
			.select()
			.from(graduatesTable)
			.where({ id: req.session.graduateId });

		if (results.length !== 1) {
			req.session = null; // Delete any session state and logout for safety
			res.redirect("/");
		}

		return results[0];
	}

	return null;
}

router.get("/dashboard", async (req, res) => { 
	const graduate = await getCurrentUser(req, res); // Coukd extract this to use as Middleware - put in Middle folder for reusability for bigger project.
	if (!graduate) {
		return res.redirect("/");
	}

	res.render("graduates/dashboard", { graduate: graduate });
});


//Garduates apply for a job
/*router.get("/jobs/:jobId/apply", verifyToken, (req, res) => {
	const { jobId } = req.params;
	const graduateId = req.graduateId;

	databaseConnection.query(
		"INSERT INTO applications (graduate_id, job_id) VALUES (?, ?)",
		[graduateId, jobId],
		(err) => {
			if (err) return res.status(500).send(err);
			res.json({ message: "Job application submitted successfully!" });
		},
	);
});*/

router.get("/jobs/:jobId/apply", verifyToken, async (req, res) => {
	const { jobId } = req.params;
	const graduateId = req.graduateId;

	try {
		await db
			.insert()
			.into("applications")
			.values({ graduate_id: graduateId, job_id: jobId })
			.execute();

		res.json({ message: "Job application submitted successfully!" });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// View  Job applications
/*router.get("/applications", verifyToken, (req, res) => {
	databaseConnection.query(
		`SELECT job.job_title, jobs.company, jobs.location, applications.date_applied
				FROM applications
				JOIN jobs ON aplications.job_id = jobs.job_id
				WHERE applications.graduate_id = ?`,
		[req.graduateId],
		(err, results) => {
			if (err) return res.status(500).send(err);
			res.json(results);
		},
	);
});*/

// View Graduate profile
/*router.get("/profile", verifyToken, (req, res) => {
	databaseConnection.query(
		"SELECT username, email, first_name, last_name FROM graduates WHERE graduate_id = ?",
		[req.graduateId],
		(err, results) => {
			if (err) return res.status(500).send(err);
			res.json(results[0]);
		},
	);
});*/

// View Graduate profile
router.get("/profile", verifyToken, async (req, res) => {
	try {
		const results = await db
			.select("username", "email", "first_name", "last_name")
			.from("graduates")
			.where("graduate_id", req.graduateId)
			.execute();

		if (results.length === 0) {
			return res.status(404).json({ error: "Graduate profile not found" });
		}

		res.json(results[0]);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Bootcamp Certificate Uploading -
// Configure Multer storage
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

/*router.post("/upload-certificate", upload.single("certificate"), (req, res) => {
	const graduateId = req.body.graduateId;
	const certificatePath = req.file.path;

	databaseConnection.query(
		"UPDATE graduates SET certificate = ? WHERE graduate_id = ?",
		[certificatePath, graduateId],
		(err) => {
			if (err) return res.status(500).send("Error uploading certificate.");
			res.send("Certificate upload succesfully.");
		},
	);
});*/

// upload certificatte Rooute

router.post(
	"/upload-certificate",
	upload.single("certificate"),
	async (req, res) => {
		const graduateId = req.body.graduateId;
		const certificatePath = req.file.path;

		try {
			const results = await db
				.update("graduates")
				.set({ certificate: certificatePath })
				.where("graduate_id", graduateId)
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

// Graduates Update details
router.put("/update-profile", async (req, res) => {
	const {
		graduateId,
		firstName,
		lastName,
		email,
		username,
		contactNumber,
		qualification,
		bootcampInstitute,
		graduationYear,
		skills,
	} = req.body;

	try {
		const results = await db
			.update(graduatesTable)
			.set({
				first_name: firstName,
				last_name: lastName,
				email,
				username,
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
		res.status(500).json({ error: err.message });
	}
});

//Delete Graduate Account
// router.delete("/account", verifyToken, (req, res) => {
// 	const graduateId = req.graduateId;
// 	databaseConnection.query(
// 		"DELETE FROM applications WHERE graduate_id = ?", //Delete graduate's applications first
// 		[graduateId],
// 		(err) => {
// 			if (err) return res.status(500).send("Error deleting applications");

// 			databaseConnection.query(
// 				"DELETE FROM graduates WHERE graduate_id =?",
// 				[graduateId],
// 				(err) => {
// 					if (err) return res.status(500).send("Error deleting account");
// 					res.json("Account successfully deleted");
// 				},
// 			);
// 		},
// 	);
// });
router.delete("/delete", verifyToken, async (req, res) => {
	try {
		await db.delete().from(graduatesTable).where({ id: companyId });
		res.send({ message: "Graduate account deleted successfuly!" });
	} catch (error) {
		console.error(err);
		res.status(500).send({ error: "error deleting account" });
	}
});

// Integrating CAPTCHA verification
router.post("/signup", async (req, res) => {
	const { username, password, recaptchaToken } = req.body;
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

export default router;
/*
https://www.npmjs.com/package/multer
https://www.geeksforgeeks.org/how-to-verify-recaptcha-in-node-js-server-call/
https://dvmhn07.medium.com/jwt-authentication-in-node-js-a-practical-guide-c8ab1b432a49
*/
