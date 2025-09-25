const nodemailer = require("nodemailer");

class MailControllers {
    send_mail = async (req, res) => {
        const { name, email, contact, message } = req.body;

        // 🔹 Basic validation
        if (!name || !email || !message) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        try {
            // 🔹 Transporter setup (better Gmail config with fallback)
            const transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST || "smtp.gmail.com",
                port: process.env.EMAIL_PORT || 587,
                secure: false, // true if using port 465
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });

            // 🔹 Verify transporter before sending
            await transporter.verify();

            // 🔹 Email content
            const mailOptions = {
                from: `"${name}" <${process.env.EMAIL_USER}>`, // always use your own email as "from" (Gmail policy)
                replyTo: email, // user’s email goes here instead
                to: process.env.EMAIL_TO,
                subject: "New Message from Portfolio",
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px; background: #f9f9f9;">
                        <h2 style="color: #2c3e50; border-bottom: 2px solid #00b894; padding-bottom: 10px;">
                            New Portfolio Form Submission
                        </h2>
                        <p><strong>Name:</strong> ${name}</p>
                        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                        <p><strong>Contact:</strong> ${contact || "Not provided"}</p>
                        <p><strong>Message:</strong></p>
                        <div style="background: #fff; padding: 15px; border-left: 4px solid #00cec9;">
                            ${message.replace(/\n/g, "<br/>")}
                        </div>
                        <p style="margin-top: 20px; font-size: 14px; color: #636e72;">
                            Sent on: ${new Date().toLocaleString()}
                        </p>
                    </div>
                `,
            };

            // 🔹 Send email
            await transporter.sendMail(mailOptions);

            res.status(200).json({ success: true, message: "Email sent successfully" });
        } catch (error) {
            console.error("❌ Email error:", error.message);
            res.status(500).json({ success: false, message: "Email sending failed", error: error.message });
        }
    };
}

module.exports = new MailControllers();
