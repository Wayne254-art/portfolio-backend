const Admin = require("../models/admin.model");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const mongoose = require("mongoose");
const { responseReturn } = require("../utils/response");
const { createToken } = require("../utils/createToken");
const { cleanString, isValidEmail, normalizeEmail } = require("../utils/sanitize");

const publicAdmin = (admin) => ({
    adminId: admin.adminId,
    dbId: admin._id?.toString(),
    name: admin.name,
    email: admin.email,
    role: admin.role,
    createdAt: admin.createdAt,
    updatedAt: admin.updatedAt,
});

const authCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
});

const buildAdminLookup = (decoded = {}) => {
    const clauses = [];
    const possibleAdminId = decoded.adminId || decoded.id;

    if (possibleAdminId) clauses.push({ adminId: possibleAdminId });
    if (decoded.email) clauses.push({ email: decoded.email });
    if (decoded.dbId && mongoose.Types.ObjectId.isValid(decoded.dbId)) {
        clauses.push({ _id: decoded.dbId });
    }
    if (decoded.id && mongoose.Types.ObjectId.isValid(decoded.id)) {
        clauses.push({ _id: decoded.id });
    }

    return clauses.length > 0 ? { $or: clauses } : null;
};

class AdminControllers {
    admin_login = async (req, res) => {
        const email = normalizeEmail(req.body.email);
        const password = cleanString(req.body.password, 200);

        if (!isValidEmail(email) || !password) {
            return responseReturn(res, 400, { error: "Email and password are required" });
        }

        try {
            const admin = await Admin.findOne({ email });
            if (!admin) {
                return responseReturn(res, 401, { error: "Invalid credentials" });
            }

            const match = await bcrypt.compare(password, admin.password);
            if (!match) {
                return responseReturn(res, 401, { error: "Invalid credentials" });
            }

            if (!admin.adminId) {
                admin.adminId = crypto.randomUUID();
                await admin.save();
            }

            const token = await createToken({
                id: admin.adminId,
                adminId: admin.adminId,
                dbId: admin._id.toString(),
                email: admin.email,
                role: admin.role,
            });

            res.cookie("accessToken", token, authCookieOptions());

            return responseReturn(res, 200, {
                admin: publicAdmin(admin),
                token,
                message: "Login successful",
            });
        } catch (error) {
            console.error("Admin login error:", error.message);
            return responseReturn(res, 500, { error: "Login failed" });
        }
    };

    admin_me = async (req, res) => {
        try {
            const lookup = buildAdminLookup(req.admin);
            if (!lookup) {
                return responseReturn(res, 401, { error: "Invalid admin session" });
            }

            const admin = await Admin.findOne(lookup).lean();
            if (!admin) {
                return responseReturn(res, 404, { error: "Admin account not found" });
            }

            return responseReturn(res, 200, {
                admin: publicAdmin(admin),
            });
        } catch (error) {
            console.error("Admin session lookup error:", error.message);
            return responseReturn(res, 500, { error: "Unable to verify session" });
        }
    };

    admin_logout = async (req, res) => {
        res.clearCookie("accessToken", authCookieOptions());
        return responseReturn(res, 200, { message: "Logged out successfully" });
    };
}

module.exports = new AdminControllers();
