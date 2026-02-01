import db from "../db/index.js"; // database connection

import { graduatesTable } from "../db/schema.js";
import { eq } from "drizzle-orm";

/*Middleware to check if a graduate is logged in. Usage:
router.method("/path", ensureLoggedIn, (req, res) => { ...
*/
export const ensureLoggedIn = async (req, res, next) => {
  if (!req.session?.graduateId) {
    return res.redirect("/graduates/login");
  }

  const result = await db
    .select()
    .from(graduatesTable)
    .where(eq(graduatesTable.id, req.session.graduateId))
    .execute();

  const graduate = result[0];

  // Session exists but user doesn't (or not verified properly)
  if (!graduate || !graduate.email) { //Prevents unverified users from accessing protected pages
    req.session = null; // safety logout
    return res.redirect("/graduates/login");
  }

  req.graduate = graduate;
  next();
};

// This puts the graduate object in req.graduate if they are logged in.
/*export async function ensureLoggedIn(req, res, next) {
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
}*/