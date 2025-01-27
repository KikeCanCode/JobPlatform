import db from "../db.js"; // Database connection
import { paymentsTable } from "../db/schema.js";

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
class Payment {
  
    static async createPayment({ companyId, jobId, amount, paymentMethod, status }) {
        try {
            const [payment] = await db
                .insert(paymentsTable)
                .values({
                    company_id: companyId,
                    job_id: jobId,
                    amount,
                    payment_method: paymentMethod,
                    status,
                })
                .returning("*"); // Return all columns of the inserted payment

            return payment;
        } catch (error) {
            throw new Error(`Error creating payment: ${error.message}`);
        }
    }

    
    static async getPaymentHistory(companyId) {
        try {
            const payments = await db
                .select({
                    paymentId: paymentsTable.id,
                    jobId: paymentsTable.job_id,
                    amount: paymentsTable.amount,
                    paymentMethod: paymentsTable.payment_method,
                    status: paymentsTable.status,
                    paymentDate: paymentsTable.payment_date,
                })
                .from(paymentsTable)
                .where({ company_id: companyId });

            return payments;
        } catch (error) {
            throw new Error(`Error retrieving payment history: ${error.message}`);
        }
    }

    
    static async getPaymentById(paymentId) {
        try {
            const payment = await db
                .select()
                .from(paymentsTable)
                .where({ id: paymentId })
                .first();

            if (!payment) {
                throw new Error("Payment not found.");
            }

            return payment;
        } catch (error) {
            throw new Error(`Error retrieving payment: ${error.message}`);
        }
    }
}

export default Payment;