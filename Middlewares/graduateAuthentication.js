import db from "../db/index.js"; // database connection

import { graduatesTable } from "../db/schema.js";

/*Middleware to check if a graduate is logged in. Usage:
router.method("/path", ensureLoggedIn, (req, res) => { ...
*/

// This puts the graduate object in req.graduate if they are logged in.
export async function ensureLoggedIn(req, res, next) {
    if (!req.session?.graduateId) {          // Check if there's a graduateId stored in the session
        const redirectUrl = encodeURIComponent(req.originalUrl);     // If not logged in, redirect to login page with original URL as the redirect target
        // return res.redirect("/graduates/login");
         return res.redirect(`/graduates/login?redirect=${redirectUrl}`);
    }

    const results = await db    // Fetch the graduate's data from the database using the stored session ID
        .select()
        .from(graduatesTable)
        .where({ id: req.session.graduateId });

    if (results.length !== 1) {         // If no graduate found (or multiple, which shouldn't happen), clear session and redirect
        req.session = null;             // Delete any session state and logout for safety
        return res.redirect("/");       //redirect to homepage
    }

    req.graduate = results[0]; //     // Store the graduate object in the request for use in later routes/controllers

    return next();              // Proceed to the next middleware or route handler
}