import db from "../db/index.js"; // Database connection
import { paymentTable } from "../db/schema.js";

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
class Payment {
  
    static async createPayment({ companyId, jobId, amount, paymentMethod, status }) {
        try {
            const [payment] = await db
                .insert(paymentTable)
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
                    paymentId: paymentTable.id,
                    jobId: paymentTable.job_id,
                    amount: paymentTable.amount,
                    paymentMethod: paymentTable.payment_method,
                    status: paymentTable.status,
                    paymentDate: paymentTable.payment_date,
                })
                .from(paymentTable)
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
                .from(paymentTable)
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