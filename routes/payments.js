export default () => undefined;

import express from "express";
import db from "../db/index.js"; // Database connection
import { paymentTable, jobsTable, companiesTable } from "../db/schema.js";
import verifyToken from "../Middlewares/authMiddleware.js"; // Middleware for authentication
//import { processStripePayment, processPayPalPayment } from "../Services/paymentService.js"; // Payment service

const router = express.Router();

// Create a Payment
router.post("/", verifyToken, async (req, res) => {
    const { jobId, amount, paymentMethod } = req.body;
    const companyId = req.user.id; // Extracted from token

    try {
        // Check if job exists and belongs to the company
        const job = await db
            .select()
            .from(jobsTable)
            .where({ id: jobId, company_id: companyId })
            .first();

        if (!job) {
            return res.status(404).send({ error: "Job not found or unauthorized access." });
        }
// validate paymnet 
if(paymentMethod !== "Stripe") {
    return res.status(400).send({ error: "Invalid payment method. Only Stripe is supported." }); 
}
// Process payment
let paymentStatus = "failed"; 
paymentStatus = await proccprocessStripePayment(amount); // Stripe payment logic

//Save payment record 
const [payment] = await db 
.insert(paymentTable) 
.values({
    company_id: companyId,
    job_id: jobId,
    amount,
    payment_method: paymentMethod,
    status: paymentStatus, 
})
    .returning ("*");  // "*" tells the database to return all the columns of the affected rows.
    if (paymentStatus === "success") {
        res.status(201).send({ message: "Payment processed successfully!", payment });
    } else {
        res.status(400).send({ error: "Payment failed." });
    } 
} catch (error) { 
    console.error(error);
    res.status(500).send({ error: "Error processing payment."});
}
});

// Get Payment History for a Company
router.get("/", verifyToken, async (req, res) => {
    const companyId = req.user.id;

    try {
    const payments = await db 
    .select({
        paymentId: paymentTable.id,
        jobId: paymentTable.job_id,
        amount: paymentTable.amount,
        paymentMethod: paymentTable.payment_method,
        status: paymentTable.status,
        paymentDate: paymentTable.payment_date,

    })
    .from (paymentTable)
    .where({ company_id: companyId })
    res.status(200).json(paymnet);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Error retrieving payment history." });
    }
});


