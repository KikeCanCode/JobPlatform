export default () => undefined;

export const proccprocessStripePayment = async (amount) => {
    
    try {
//stripe payment login
        console.log(`Processing Stripe payment for amount: ${amount}`);
        return "success"; // Simulate success
    } catch (error) {
        console.error("Stripe payment failed:", error);
        return "failed";
    }
};
