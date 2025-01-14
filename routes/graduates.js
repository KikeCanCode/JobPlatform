// Gradutes CRUD Operations

import bcrypt from "bcrypt";
import express from "express";
import multer from "multer"; // Multer is a node.js middleware for handling multipart/form-data, which is primarily usedused to uplode file
import fetch from "node-fetch";
import db from "../db/index.js"; // Drizzle Orm Connection
import { graduatesTable } from "../db/schema.js";
import verifyToken from "../Middlewares/verifyAdminToken.js";

const router = express.Router();

// Graduate Sign-up
router.post("/signup", async (req, res) => {
	const { username, email, password } = req.body;

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

// Graduate Login
router.post("/login", (req, res) => {
	const { username, password } = req.body;

	db.select()
		.from(graduatesTable)
		.where({ username })
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

					res.json({ message: " Login sucessful!" });
				} else {
					req.session = null

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

// Search for jobs
/*router.get("/jobs", (req, res) => {
	const { lcation, skills, education, datePosted } = req.query;
	let query = " SELECT * FROM jobs WHERE 1=1";
	const queryParams = [];

	if (location) {
		query += "AND location = ?";
		queryParams.push(location);
	}
	if (skills) {
		query += "AND skills LIKE ?";
		queryParams.push(`%${skills}%`);
	}
	if (education) {
		query += "AND education =?";
		queryParams.push(education);
	}
	if (datePosted) {
		query += "AND date_posted >= ?";
		queryParams.push(datePosted);
	}

	db.query(query, queryParams, (err, results) => {
		if (err) return res.status(500).json({ error: err.message });
		res.json({ data: results });
	});
});
*/
//Search for jobs
router.get("/jobs", async (req, res) => {
	const { title, location, skills, education, datePosted } = req.query;
	// Start with the base query
	let query = db.select("*").from("jobs"); // Select all fields from jobs table

	// Dynamically build query based on filters provided in query params
	if (location) {
		query = query.where("location", location); // Apply location filter
	}
	if (skills) {
		query = query.where("skills", "LIKE", `%${skills}%`); // Apply skills filter using LIKE
	}
	if (education) {
		query = query.where("education", education); // Apply education filter
	}
	if (datePosted) {
		query = query.where("date_posted", ">=", datePosted); // Apply datePosted filter
	}

	try {
		const results = await query.execute();
		res.json({ data: results });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
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

// Graduates Update detais
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
