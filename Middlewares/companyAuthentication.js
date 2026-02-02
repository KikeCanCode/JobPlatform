
import db from "../db/index.js"; // database connection

import { companiesTable } from "../db/schema.js";
export { ensureCompanyLoggedIn };
import { eq } from "drizzle-orm";

/*Middleware to check if a company is logged in. Usage:
router.method("/path", ensureLoggedIn, (req, res) => { ...
*/

// This puts the company object in req.company if they are logged in.
async function ensureCompanyLoggedIn (req, res, next) {
	if (!req.session?.companyId) {
		return res.redirect("/companies/login");
	}

	const results = await db
		.select()
		.from(companiesTable)
		.where(eq( companiesTable.id, req.session.companyId))
		.execute();

		req.company = results[0];

	if (!company || !company.email) {
		req.session = null; // Delete any session state and logout for safety
		return res.redirect("/companies/login"); //redirect to homepage
	}

	req.company = results[0];

	return next();
}
