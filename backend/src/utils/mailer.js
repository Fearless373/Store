// Sends transactional email via the Resend API (https://resend.com/docs/api-reference/emails/send-email).
// Uses the built-in fetch (Node 18+) so no extra HTTP client dependency is needed.

function generateVerificationCode() {
  // 6-digit numeric code, e.g. "042817"
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendVerificationEmail(toEmail, firstName, code) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM,
      to: toEmail,
      subject: 'Verify your Provision Store account',
      text: `Hi ${firstName},\n\nYour verification code is ${code}. It expires in 10 minutes.\n\nIf you didn't request this, you can ignore this email.`,
      html: `<p>Hi ${firstName},</p><p>Your verification code is:</p><p style="font-size:24px;font-weight:600;letter-spacing:4px;">${code}</p><p>It expires in 10 minutes. If you didn't request this, you can ignore this email.</p>`,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Resend API error (${res.status}): ${body}`);
  }

  return res.json();
}

module.exports = { generateVerificationCode, sendVerificationEmail };
