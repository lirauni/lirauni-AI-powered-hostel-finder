require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const nodemailer = require('nodemailer');

console.log('Testing email with:');
console.log('  MAIL_USER:', process.env.MAIL_USER);
console.log('  MAIL_PASS:', process.env.MAIL_PASS ? '***set***' : 'NOT SET');

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

transporter.verify(function(err, success) {
    if (err) {
        console.log('\n❌ Connection FAILED:', err.message);
        console.log('\nFull error:', err);
    } else {
        console.log('\n✅ Gmail connection verified! Sending test email...');
        transporter.sendMail({
            from: '"LiraUni Hostel" <' + process.env.MAIL_USER + '>',
            to: process.env.MAIL_USER,
            subject: 'Test Email - LiraUni Hostel',
            text: 'This is a test email from LiraUni Hostel system.'
        }, function(err2, info) {
            if (err2) {
                console.log('❌ Send FAILED:', err2.message);
            } else {
                console.log('✅ Email sent successfully! Message ID:', info.messageId);
            }
        });
    }
});
