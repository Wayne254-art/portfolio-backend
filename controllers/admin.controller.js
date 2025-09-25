const Admin = require("../models/admin.model");       // Sequelize (MySQL)
const AdminLog = require("../models/adminLog.model"); // Mongoose (MongoDB)
const bcrypt = require("bcryptjs");
const { responseReturn } = require("../utils/response");
const { createToken } = require("../utils/createToken");

class AdminControllers {
    admin_login = async (req, res) => {
        const { email, password } = req.body;

        try {
            // ✅ MySQL: find admin by email
            const admin = await Admin.findOne({ where: { email } });

            if (!admin) {
                return responseReturn(res, 404, { error: "Invalid Credentials" });
            }

            // ✅ MySQL: compare password
            const match = await bcrypt.compare(password, admin.password);
            if (!match) {
                // log failed attempt in Mongo
                await AdminLog.create({
                    adminId: admin.adminId,
                    action: "Failed Login",
                    email,
                });

                return responseReturn(res, 401, { error: "Invalid Credentials" });
            }

            // ✅ Generate JWT
            const token = await createToken({
                id: admin.adminId,
                role: admin.role,
            });

            // ✅ Log successful login in Mongo
            await AdminLog.create({
                adminId: admin.adminId,
                action: "Login",
                email: admin.email,
            });

            // ✅ Set cookie
            res.cookie("accessToken", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "Strict",
                expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            });

            // ✅ Unified response
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
