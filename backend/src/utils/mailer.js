const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (!transporter) {
    const requiredSettings = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'];
    const missingSettings = requiredSettings.filter((setting) => !process.env[setting]);
    if (missingSettings.length > 0) {
      throw new Error(`SMTP is not configured. Missing: ${missingSettings.join(', ')}`);
    }

    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

function generateVerificationCode() {
  // 6-digit numeric code, e.g. "042817"
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendVerificationEmail(toEmail, firstName, code) {
  const mailer = getTransporter();
  await mailer.sendMail({
    from: process.env.SMTP_FROM,
    to: toEmail,
    subject: 'Verify your Provision Store account',
    text: `Hi ${firstName},\n\nYour verification code is ${code}. It expires in 10 minutes.\n\nIf you didn't request this, you can ignore this email.`,
    html: `<p>Hi ${firstName},</p><p>Your verification code is:</p><p style="font-size:24px;font-weight:600;letter-spacing:4px;">${code}</p><p>It expires in 10 minutes. If you didn't request this, you can ignore this email.</p>`,
  });
}

module.exports = { generateVerificationCode, sendVerificationEmail };
