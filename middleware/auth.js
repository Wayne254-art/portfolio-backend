const jwt = require("jsonwebtoken");
const { responseReturn } = require("../utils/response");

const getRequestToken = (req) => {
    const cookieToken = req.cookies?.accessToken;
    const authHeader = req.headers.authorization || "";
    const bearerToken = authHeader.startsWith("Bearer ")
        ? authHeader.slice("Bearer ".length).trim()
        : null;

    return cookieToken || bearerToken;
};

const requireAdmin = (req, res, next) => {
    const token = getRequestToken(req);

    if (!token) {
        return responseReturn(res, 401, { error: "Authentication required" });
    }

    if (!process.env.JWT_SECRET) {
        return responseReturn(res, 500, { error: "Authentication is not configured" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== "admin") {
            return responseReturn(res, 403, { error: "Admin access required" });
        }

        req.admin = decoded;
        return next();
    } catch {
        return responseReturn(res, 401, { error: "Invalid or expired session" });
    }
};

module.exports = { requireAdmin };
