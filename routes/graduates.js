// Gradutes CRUD Operations

import express from "express";
import bcrypt from "bcrypt";
import databaseConnection from "../database.js"; // 
import multer from "multer"; // Multer is a node.js middleware for handling multipart/form-data, which is primarily usedused to uplode file
import path from "path";
import fetch from "node-fetch";
import { Router } from "express"; //with brackets { }) are used when exporting specific functions, objects, or variables.
import verifyToken from "../middleware/verifyToken.js";
import { verifyCaptcha } from "../middlewares/captchaMiddleware.js";



const router = express.Router();

// Graduate Sign-up 
router.post("/signup", async (req, res) => {
    const {username, first_name, last_name, email, contact_number, password, qualification, bootcamp_institute, graduation_year, skills, location} = req.body;
try {
    const hashedPassword = await bcrypt.hash(password, 10);

    databaseConnection.query( 
        "INSERT INTO graduates (username, first_name, last_name, email, contact_number, password_hash, qualification, bootcamp_institute, graduation_year, skills, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 
            [username, first_name, last_name, email, contact_number, hashedPassword, qualification, bootcamp_institute, graduation_year, skills, location],
        
        (err) => {
            if (err) return res.status(500).json({ error: "Database error while creating account. Please try again later." });
            res.status(201).send({message: "Graduate account created successfully!"});
        } 
    );

} catch (err) {
    res.status(500).send({Error: "Error hashing password"});
}
});

// Graduate Login 
router.post("/login", (req, res) => {
    const { username, password } = req.body;
    databaseConnection.query(

    "SELECT * FROM graduates WHERE username = ?",

    [username],
    async (err, results) => {
        if (err) return res.status(500).send(err);
        if(results.lenght === 0) return res.status(401).send("Invalid password or username");
      
        try {
            const isMatch = await bcrypt.compare(password, results[0].password_hash);
            if(isMatch) {
               res.json({ message: " Login sucessful!"});
            } else {
                res.status(401).json({ error: "Incorrect username or password. Please check your credentials."});
            }

        } catch (err) {
            res.status(500).send("Error comparing password");
        }
    });
});

// Search for jobs
router.get("/jobs", (req, res) => {
    const {lcation, skills, education, datePosted } = req.query;
    let query = " SELECT * FROM jobs WHERE 1=1";
    const queryParams = [];

    if(location) {
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

    databaseConnection.query(query, queryParams, (err, results) => {
        if (err) return res.status(500).json({error: err.message});
        res.json({data: results});
    });
});

//Garduates apply for a job 
router.get("/jobs/:jobId/apply", verifyToken, (req, res) => {
    const {jobId} = req.params;
    const graduateId = req.graduateId;

    databaseConnection.query (
        "INSERT INTO applications (graduate_id, job_id) VALUES (?, ?)",
        [graduateId, jobId],
        (err) => {
            if (err) return res.status(500).send(err);
            res.json({message:"Job application submitted successfully!"});
        }
    );
});

// View  Job applications 
router.get("/applications", verifyToken, (req, res) => {
    databaseConnection.query(
        `SELECT job.job_title, jobs.company, jobs.location, applications.date_applied
        FROM applications
        JOIN jobs ON aplications.job_id = jobs.job_id
        WHERE applications.graduate_id = ?`,
        [req.graduateId],
        (err, results) => {
            if (err) return res.status(500).send(err);
            res.json(results);
        }
    );
});

// View Graduate profile
router.get("/profile", verifyToken, (req, res) => {
    databaseConnection.query(
        "SELECT username, email, first_name, last_name FROM graduates WHERE graduate_id = ?",
        [req.graduateId],
        (err, results) => {
            if(err) return res.status(500).send(err);
            res.json(results[0]);
        }
    );
});

// Bootcamp Certificate Uploading - 
// Configure Multer storage  
const storage = multer.diskStorage({
    destination: (req, file, callBack ) => {
        callBack(null, "uploads/certificates");
    },
    filename: (req, file, callBack) => {
        callBack(null, `${Date.now()}-${file.originalname}`);
    },
});

const upload = multer({storage});

// upload certificatte Rooute

router.post("/upload-certificate", upload.single("certificate"), (req, res) => {
    const graduateId = req.body.graduateId;
    const certificatePath = req.file.path;

    databaseConnection.query(
        "UPDATE graduates SET certificate = ? WHERE graduate_id = ?",
        [certificatePath, graduateId],
        (err) => {
            if(err) return res.status(500).send("Error uploading certificate.");
            res.send("Certificate upload succesfully.");
        }
    );
});

//Delete Graduate Account
router.delete("/account", verifyToken, (req,res)=> {
    const graduateId = req.graduateId;
    databaseConnection.query("DELETE FROM applications WHERE graduate_id = ?", //Delete graduate's applications first 
        [graduateId], (err) => {
            if (err) return res.status(500).send("Error deleting applications");

            databaseConnection.query("DELETE FROM graduates WHERE graduate_id =?",
                [graduateId], (err) => {
                    if (err) return res.status(500).send("Error deleting account");
                res.json("Account successfully deleted");
            });
        });        
});

// Integrating CAPTCHA verification
router.post("/signup", async (req, res) => {
    const { username, password, recaptchaToken } = req.body;
    const verifyUrl = " "               // register domain name on google recaptcha to get the url 

    try {
        const captchaResponse = await fetch(verifyUrl, { method: " POST"});
        const data = await captchaResponse.json();
        if (!data.success) {
            return res.status(400).send("CAPTCHA verification failed.");
        }       
    } catch (err) {
        res.status(500).send("CAPTCHA verification erro.")
    }
});



export default router;
/*
https://www.npmjs.com/package/multer
https://www.geeksforgeeks.org/how-to-verify-recaptcha-in-node-js-server-call/
https://dvmhn07.medium.com/jwt-authentication-in-node-js-a-practical-guide-c8ab1b432a49
*/