const express = require("express");
const adminControllers = require("../controllers/admin.controller");
const { requireAdmin } = require("../middleware/auth");
const rateLimit = require("../middleware/rateLimit");

const router = express.Router();

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 8,
    keyPrefix: "admin-login",
    message: "Too many login attempts. Please wait and try again.",
});

router.post("/admin-login", loginLimiter, adminControllers.admin_login);
router.get("/admin-me", requireAdmin, adminControllers.admin_me);
router.post("/admin-logout", adminControllers.admin_logout);

module.exports = router;
