import fetch from "node-fetch";

export const verifyCaptcha = async (req, res, next) => {
    const { recaptchaToken } = req.body;
    const verifyUrl = " "; // register on google to get the link 

    try {
        const captchaResponse = await fetch(verifyUrl, { method: "POST" });
        const data = await captchaResponse.json();

        if (!data.success) {
            return res.status(400).send("CAPTCHA verification failed.");
        }

        next();
    } catch (err) {
        res.status(500).send("CAPTCHA verification error.");
    }
};