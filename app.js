import path from "node:path"; // Node.js's built-in path module, which provides utilities for working with file and directory paths.
import bodyParser from "body-parser";
import ejs from "ejs";
import express from "express";

// import the CRUD from the routes folder for each of the entities.

import adminRoutes from "./routes/admin.js";
import applicationsRoutes from "./routes/applications.js";
import companiesRoutes from "./routes/companies.js";
import graduatesRoutes from "./routes/graduates.js";
import jobsRoutes from "./routes/jobs.js";
import paymentsRoutes from "./routes/payments.js";

const app = express();
const port = process.env.PORT || 3000;

// Set EJS as the view engine - this is for the Front-End
app.set("view engine", "ejs");

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));

//Routes/Endpoints
app.use("/graduates", graduatesRoutes);
app.use("/companies", companiesRoutes);
app.use("/jobs", jobsRoutes);
app.use("/applications", applicationsRoutes);
app.use("/admin", adminRoutes);
app.use("/payments", paymentsRoutes);

//Homepage Route -to diplay the homepage
app.get("/", (req, res) => {
	res.sendFile(path.join(process.cwd(), "public", "index.html")); //The process.cwd() method returns the current working directory of the Node.js process.
});

// Start the server
app.listen(port, () => {
	console.log(`Server running on port ${port}`);
});

/*
https://blog.logrocket.com/node-js-project-architecture-best-practices/

https://dev.to/santypk4/bulletproof-node-js-project-architecture-4epf
https://developerport.medium.com/understanding-process-env-port-in-node-js-e09aef80384c
https://stackoverflow.com/questions/55363851/how-i-display-index-js-file-onto-the-server-in-js
 */
