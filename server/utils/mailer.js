const nodemailer = require('nodemailer');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    },
    tls: { rejectUnauthorized: false }
});

/**
 * Send admin reply to student email
 * @param {string} to       - Student's email address
 * @param {string} subject  - Original message subject
 * @param {string} name     - Student's name
 * @param {string} original - Student's original message
 * @param {string} reply    - Admin's reply text
 */
async function sendReplyEmail(to, subject, name, original, reply) {
    const mailOptions = {
        from: `"LiraUni Hostel" <${process.env.MAIL_USER}>`,
        to,
        subject: `Re: ${subject}`,
        html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:0;">
            <!-- Header -->
            <div style="background:linear-gradient(135deg,#0369A1,#0E7490);padding:28px 32px;border-radius:8px 8px 0 0;">
                <h2 style="color:#fff;margin:0;font-size:20px;">🏠 LiraUni Hostel</h2>
                <p style="color:#BAE6FD;margin:4px 0 0;font-size:13px;">Lira University, Uganda</p>
            </div>

            <!-- Body -->
            <div style="background:#fff;padding:28px 32px;">
                <p style="color:#1e293b;font-size:15px;">Dear <strong>${name}</strong>,</p>
                <p style="color:#475569;font-size:14px;">Thank you for contacting us. Here is our reply to your message:</p>

                <!-- Admin Reply -->
                <div style="background:#EFF6FF;border-left:4px solid #0369A1;padding:16px 20px;border-radius:4px;margin:20px 0;">
                    <p style="color:#1e293b;font-size:14px;margin:0;line-height:1.6;">${reply.replace(/\n/g, '<br>')}</p>
                </div>

                <!-- Original Message -->
                <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:14px 18px;border-radius:4px;margin-top:20px;">
                    <p style="color:#64748b;font-size:12px;font-weight:600;margin:0 0 6px;text-transform:uppercase;letter-spacing:0.5px;">Your original message:</p>
                    <p style="color:#475569;font-size:13px;margin:0;font-style:italic;">"${original}"</p>
                </div>

                <p style="color:#475569;font-size:13px;margin-top:24px;">
                    If you have further questions, feel free to contact us again through our website.
                </p>
                <p style="color:#1e293b;font-size:14px;margin-top:8px;">
                    Best regards,<br>
                    <strong>LiraUni Hostel Team</strong>
                </p>
            </div>

            <!-- Footer -->
            <div style="background:#f1f5f9;padding:16px 32px;border-radius:0 0 8px 8px;text-align:center;">
                <p style="color:#94a3b8;font-size:12px;margin:0;">
                    📞 +256 763-172-781 &nbsp;|&nbsp; +256 787-566-280<br>
                    ✉️ okwangarobert563@gmail.com &nbsp;|&nbsp; asiteb21@gmail.com<br>
                    Lira University, Plot 7-9 Ireda Estate, Lira City, Uganda
                </p>
            </div>
        </div>
        `
    };

    return transporter.sendMail(mailOptions);
}

module.exports = { sendReplyEmail };
