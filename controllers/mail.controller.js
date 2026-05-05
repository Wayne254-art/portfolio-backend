const nodemailer = require("nodemailer");
const Message = require("../models/message.model");
const {
    cleanMultiline,
    cleanString,
    escapeHtml,
    isValidEmail,
    normalizeEmail,
} = require("../utils/sanitize");

const getClientIp = (req) => {
    const forwarded = req.headers["x-forwarded-for"];
    return String(forwarded || req.ip || req.socket?.remoteAddress || "")
        .split(",")[0]
        .trim();
};

class MailControllers {
    send_mail = async (req, res) => {
        const name = cleanString(req.body.name, 120);
        const email = normalizeEmail(req.body.email);
        const contact = cleanString(req.body.contact, 40);
        const message = cleanMultiline(req.body.message, 2000);

        if (!name || !isValidEmail(email) || !message) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid name, email, and message.",
            });
        }

        try {
            const savedMessage = await Message.create({
                name,
                email,
                contact,
                message,
                sourceIp: getClientIp(req),
                userAgent: cleanString(req.headers["user-agent"], 300),
            });

            if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !process.env.EMAIL_TO) {
                return res.status(202).json({
                    success: true,
                    message: "Message received. Email delivery is not configured yet.",
                    messageId: savedMessage.messageId,
                });
            }

            const transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST || "smtp.gmail.com",
                port: Number(process.env.EMAIL_PORT) || 587,
                secure: Number(process.env.EMAIL_PORT) === 465,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });

            const safeName = escapeHtml(name);
            const safeEmail = escapeHtml(email);
            const safeContact = escapeHtml(contact || "Not provided");
            const safeMessage = escapeHtml(message).replace(/\n/g, "<br/>");

            await transporter.sendMail({
                from: `"Portfolio Contact" <${process.env.EMAIL_USER}>`,
                replyTo: `${safeName} <${email}>`,
                to: process.env.EMAIL_TO,
                subject: "New Portfolio Message",
                text: [
                    `Name: ${name}`,
                    `Email: ${email}`,
                    `Contact: ${contact || "Not provided"}`,
                    "",
                    message,
                ].join("\n"),
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background: #f9f9f9; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
                        <h2 style="color: #172554; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
                            New Portfolio Form Submission
                        </h2>
                        <p><strong>Name:</strong> ${safeName}</p>
                        <p><strong>Email:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
                        <p><strong>Contact:</strong> ${safeContact}</p>
                        <p><strong>Message:</strong></p>
                        <div style="background: #fff; padding: 15px; border-left: 4px solid #2563eb;">
                            ${safeMessage}
                        </div>
                        <p style="margin-top: 20px; font-size: 14px; color: #475569;">
                            Sent on: ${new Date().toLocaleString()}
                        </p>
                    </div>
                `,
            });

            return res.status(200).json({
                success: true,
                message: "Message sent successfully",
                messageId: savedMessage.messageId,
            });
        } catch (error) {
            console.error("Email/message error:", error.message);

            return res.status(500).json({
                success: false,
                message: "Message could not be sent. Please try again later.",
            });
        }
    };

    get_messages = async (req, res) => {
        try {
            const status = cleanString(req.query.status, 20);
            const query = status && ["new", "read", "archived"].includes(status) ? { status } : {};
            const messages = await Message.find(query).sort({ createdAt: -1 }).limit(100).lean();

            return res.status(200).json({
                messages,
                count: messages.length,
            });
        } catch (error) {
            console.error("Message fetch error:", error.message);
            return res.status(500).json({ error: "Unable to load messages" });
        }
    };

    update_message_status = async (req, res) => {
        const status = cleanString(req.body.status, 20);
        if (!["new", "read", "archived"].includes(status)) {
            return res.status(400).json({ error: "Invalid message status" });
        }

        try {
            const message = await Message.findOneAndUpdate(
                { messageId: req.params.messageId },
                { status },
                { new: true }
            ).lean();

            if (!message) return res.status(404).json({ error: "Message not found" });
            return res.status(200).json(message);
        } catch (error) {
            console.error("Message status error:", error.message);
            return res.status(500).json({ error: "Unable to update message" });
        }
    };

    delete_message = async (req, res) => {
        try {
            const message = await Message.findOneAndDelete({ messageId: req.params.messageId });
            if (!message) return res.status(404).json({ error: "Message not found" });
            return res.status(200).json({ message: "Message deleted successfully" });
        } catch (error) {
            console.error("Message delete error:", error.message);
            return res.status(500).json({ error: "Unable to delete message" });
        }
    };
}

module.exports = new MailControllers();
