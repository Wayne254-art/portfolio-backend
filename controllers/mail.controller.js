const nodemailer = require("nodemailer");

class MailControllers {
    send_mail = async (req, res) => {
        const { name, email, contact, message } = req.body;

        // ✓ Basic validation
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields",
            });
        }

        try {
            // ✓ Create transporter (Gmail-safe configuration)
            const transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST || "smtp.gmail.com",
                port: Number(process.env.EMAIL_PORT) || 587,
                secure: false, // Only true for port 465
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });

            // ✓ Optional: verify connection
            await transporter.verify().catch(() => {
                console.log("⚠ Email server verification skipped.");
            });

            // ✓ Gmail requires FROM to be your own email — use replyTo for user's email
            const mailOptions = {
                from: `"Portfolio Contact" <${process.env.EMAIL_USER}>`,
                replyTo: `${name} <${email}>`,
                to: process.env.EMAIL_TO,
                subject: "New Portfolio Message",
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background: #f9f9f9; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
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

            // ✓ Send email
            await transporter.sendMail(mailOptions);

            return res.status(200).json({
                success: true,
                message: "Email sent successfully",
            });

        } catch (error) {
            console.error("❌ Email error:", error.message);

            return res.status(500).json({
                success: false,
                message: "Email sending failed",
                error: error.message,
            });
        }
    };
}

module.exports = new MailControllers();
