import express from "express";
import jwt from "jsonwebtoken";
import verifyAdminToken from "../Middlewares/verifyAdminToken.js";
import db from "../db/index.js"; // database connection
import { companiesTable, graduatesTable } from "../db/schema.js";

const router = express.Router();

// Generate a token for admin
const generateAdminToken = (admin) => {
	return jwt.sign({ id: admin.id, role: "admin" }, process.env.JWT_SECRET, {
		expiresIn: "1h",
	});
};

const isAdmin = () => true;

// Admin Login
router.post("/login", async (req, res) => {
	const { username, password } = req.body;

	try {
		const admin = await db
			.select()
			.from(adminsTable)
			.where({ username })
			.limit(1)
			.execute();

		if (admin.length === 0) {
			return res.status(401).json({ error: "Invalid username or password" });
		}

		const isMatch = password === admin[0].password; // Assuming plaintext password; use hashing in real scenarios

		if (isMatch) {
			const token = generateAdminToken(admin[0]);
			res.status(200).json({ message: "Login successful!", token });
		} else {
			res.status(401).json({ error: "Invalid username or password" });
		}
	} catch (error) {
		console.error(error);
		res.status(500).send({ error: "Error during login" });
	}
});

//Get Company by Id
router.get("/companies/:id", verifyAdminToken, isAdmin, async (req, res) => {
	const { id } = req.params;

	try {
		const company = await db
			.select()
			.from(companiesTable)
			.where({ id })
			.limit(1);

		if (!company.length) {
			return res.status(400).json({ error: "Company not found" });
		}

		res.status(200).json(company[0]);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Error retrieving company details" });
	}
});

// Get Graduate by id
router.get("/graduates/:id", verifyAdminToken, isAdmin, async (req, res) => {
	const { id } = req.params;

	try {
		const company = await db
			.select()
			.from(graduatesTable)
			.where({ id })
			.limit(1);

		if (!company.length) {
			return res.status(400).json({ error: "Graduate not found" });
		}

		res.status(200).json(graduate[0]);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Error retrieving graduate details" });
	}
});

//Get all registerd Companies
router.get("/companies", verifyAdminToken, async (req, res) => {
	try {
		const companies = await db.select().from(companiesTable).execute();

		res.status(200).json(companies);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Error fetching companies" });
	}
});

// Get all Graduates
router.get("/graduates", verifyAdminToken, async (req, res) => {
	try {
		const graduates = await db.select().from(graduatesTable).execute();
		res.status(200).json(graduates);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Error fetching graduates" });
	}
});

// Delete a Company account (by Id)
router.delete("/companies/:id", verifyAdminToken, async (req, res) => {
	const { id } = req.params;
	try {
		await db.delete().from(companiesTable).where({ id });

		res.status(200).json({ message: "Company deleted successfully" });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Error deleting company" });
	}
});

//Delete a graduate account (by Id)
router.delete("/graduates/:id", verifyAdminToken, async (req, res) => {
	const { id } = req.params;
	try {
		await db.delete().from(graduatesTable).where({ id });

		res.status(200).json({ message: "Graduate deleted successfully" });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Error deleting graduate" });
	}
});

// Add Update Endpoint? To enable them to update details?

export default router;
