const Admin = require('../models/admin.model');
const bcrypt = require('bcryptjs');
const { responseReturn } = require('../utils/response');
const { createToken } = require('../utils/createToken');

class AdminControllers {
    admin_login = async (req, res) => {
        const { email, password } = req.body;

        try {
            const admin = await Admin.findOne({ where: { email } });

            if (admin) {
                const match = await bcrypt.compare(password, admin.password);

                if (match) {
                    const token = await createToken({
                        id: admin.userId,
                        role: admin.role,
                    });

                    res.cookie("accessToken", token, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === "production",
                        sameSite: "Strict",
                        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    });

                    return responseReturn(res, 200, {
                        token,
                        admin,
                        message: "Login successful",
                    });
                }
            }

            return responseReturn(res, 404, { error: "Invalid Credentials" });
        } catch (error) {
            return responseReturn(res, 500, { error: error.message });
        }
    };
}

module.exports = new AdminControllers();
