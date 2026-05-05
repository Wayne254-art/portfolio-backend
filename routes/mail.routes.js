const express = require("express");
const mailControllers = require("../controllers/mail.controller");
const { requireAdmin } = require("../middleware/auth");
const rateLimit = require("../middleware/rateLimit");

const router = express.Router();

const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    keyPrefix: "contact",
    message: "Too many contact messages. Please try again later.",
});

router.post("/send-email", contactLimiter, mailControllers.send_mail);
router.get("/messages", requireAdmin, mailControllers.get_messages);
router.patch("/messages/:messageId", requireAdmin, mailControllers.update_message_status);
router.delete("/messages/:messageId", requireAdmin, mailControllers.delete_message);

module.exports = router;
