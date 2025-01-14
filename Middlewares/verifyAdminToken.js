import jwt from "jsonwebtoken";

const verifyAdminToken = (req, res, next) => {
	const token = req.headers.authorization;
	if (!token) {
		return res.status(403).json({ error: "Access denied, no token provided" });
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		if (decoded.role !== "admin") {
			return res
				.status(403)
				.json({ error: "Access denied, admin role required" });
		}
		req.user = decoded;
		next();
	} catch (err) {
		res.status(400).json({ error: "Invalid token" });
	}
};

export default verifyAdminToken;
