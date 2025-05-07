
import bodyParser from "body-parser";
import cookieSession from "cookie-session";
import dotenv from "dotenv";
import express from "express";
import path from "node:path"; // Node.js's built-in path module, which provides utilities for working with file and directory paths.

// import the CRUD from the routes folder for each of the entities.

import adminRoutes from "./routes/admin.js";
import applicationsRoutes from "./routes/applications.js";
import companiesRoutes from "./routes/companies.js";
import graduatesRoutes from "./routes/graduates.js";
import jobsRoutes from "./routes/jobs.js";
import paymentsRoutes from "./routes/payments.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
	console.error("SESSION_SECRET environment variable not set");
	process.exit(1);
}
app.use( // Middleware - provided by the library 
	cookieSession({
		name: "session",
		keys: [sessionSecret],
	}),
);

// Set EJS as the view engine - this is for the Front-End
app.set("views", path.join(process.cwd(), "Views"));

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

//Diplay the homepage
app.get("/", (req, res) => {
	res.render("homepage/index");
});

// Diplay contact us Page 
app.get("/pages/contactUs", (req, res) => {
	res.render("pages/contactUs"); 
});

// Diplay About Us Page 
app.get("/pages/aboutUs", (req, res) => {
	res.render("pages/aboutUs"); 
});

// Diplay termsAndConditions
app.get("/pages/termsAndConditions", (req, res) => {
	res.render("pages/termsAndConditions"); 
});

// Start the server
app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});

// Dispaly Graduates Login page 
// app.get("/graduates/login", (req, res) => {
// 	res.render("graduates/login");
// });
// Diplay Graduates Sign Up page 
// router.get("/graduates/signup", (req, res) => {
//     res.render("graduates/signup"); 
// });




