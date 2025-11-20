const Admin = require("../models/admin.model"); // Mongoose only
const bcrypt = require("bcryptjs");
const { responseReturn } = require("../utils/response");
const { createToken } = require("../utils/createToken");

class AdminControllers {
    admin_login = async (req, res) => {
        const { email, password } = req.body;

        try {
            // 🔍 Find admin from MongoDB
            const admin = await Admin.findOne({ email });
            if (!admin) {
                return responseReturn(res, 404, { error: "Invalid Credentials" });
            }

            // 🔐 Validate password
            const match = await bcrypt.compare(password, admin.password);
            if (!match) {
                return responseReturn(res, 401, { error: "Invalid Credentials" });
            }

            // 🎫 Generate JWT token
            const token = await createToken({
                id: admin.adminId,
                role: admin.role,
            });

            // 🍪 Set secure cookie
            res.cookie("accessToken", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "Strict",
                expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            });

            // 📤 Response
            return responseReturn(res, 200, {
                token,
                admin,
                message: "Login successful",
            });

        } catch (error) {
            console.error("❌ Admin login error:", error);
            return responseReturn(res, 500, { error: error.message });
        }
    };
}

module.exports = new AdminControllers();
