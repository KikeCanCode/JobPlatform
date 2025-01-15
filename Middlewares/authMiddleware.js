import jwt from "jsonwebtoken";

const verifyToken = (req, res, next) => {
	const token = req.headers.authorization?.split(" ")[1]; // Extract the token
	if (!token)
		return res.status(401).json({ error: "Access Denied. No Token Provided." });
	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		req.user = decoded; // Attach user info to the request object
		next(); // Pass control to the next middleware
	} catch (err) {
		res.status(403).json({ error: "Invalid or Expired Token" });
	}
};

export default verifyToken;
