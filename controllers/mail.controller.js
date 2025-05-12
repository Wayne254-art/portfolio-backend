
const nodemailer = require('nodemailer')

class mailControllers {
    send_mail = async (req, res) => {
        const { name, email, contact, message } = req.body;

        try {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });

            await transporter.sendMail({
                from: `"${name}" <${email}>`,
                to: process.env.EMAIL_TO,
                subject: 'New Message from Portfolio',
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px; background: #f9f9f9;">
                    <h2 style="color: #2c3e50; border-bottom: 2px solid #00b894; padding-bottom: 10px;">
                       New Portfolio Form Submission
                    </h2>
                    <p style="font-size: 16px;"><strong>Name:</strong> ${name}</p>
                    <p style="font-size: 16px;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #0984e3;">${email}</a></p>
                    <p style="font-size: 16px;"><strong>Contact:</strong> <a href="tel:${contact}" style="color: #0984e3;">${contact}</a></p>
                    <p style="font-size: 16px;"><strong>Message:</strong></p>
                    <div style="background: #fff; padding: 15px; border-left: 4px solid #00cec9; font-size: 15px; line-height: 1.5;">
                      ${message.replace(/\n/g, '<br/>')}
                    </div>
                    <p style="margin-top: 20px; font-size: 14px; color: #636e72;">
                       Sent on: ${new Date().toLocaleString()}
                    </p>
                  </div>
                `,
            });

            res.status(200).json({ success: true, message: 'Email sent successfully' });
        } catch (error) {
            console.error('Email error:', error);
            res.status(500).json({ success: false, message: 'Email sending failed' });
        }
    }
}

module.exports = new mailControllers();