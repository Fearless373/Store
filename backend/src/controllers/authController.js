const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getDB } = require('../config/db');
const { generateVerificationCode, sendVerificationEmail } = require('../utils/mailer');

const CODE_TTL_MINUTES = 10;

function signToken(user) {
  const fullName = `${user.first_name} ${user.last_name}`;
  return jwt.sign(
    { id: user._id.toString(), name: fullName, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
}

function publicUser(user) {
  return {
    id: user._id.toString(),
    name: `${user.first_name} ${user.last_name}`,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    role: user.role,
  };
}

// POST /api/auth/register
// body: { first_name, last_name, email, password, confirm_password }
// Creates an unverified account (role defaults to 'cashier') and emails a 6-digit code.
async function register(req, res) {
  const { first_name, last_name, email, password, confirm_password } = req.body;

  if (!first_name || !last_name || !email || !password || !confirm_password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  if (password !== confirm_password) {
    return res.status(400).json({ error: 'Password and confirmation do not match.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  try {
    const users = getDB().collection('users');
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await users.findOne({ email: normalizedEmail });
    if (existing && existing.email_verified) {
      return res.status(409).json({ error: 'An account with that email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);

    const doc = {
      first_name,
      last_name,
      email: normalizedEmail,
      password_hash: passwordHash,
      role: 'cashier',
      email_verified: false,
      verification_code: code,
      verification_code_expires_at: expiresAt,
      created_at: new Date(),
    };

    if (existing) {
      // Unverified account re-registering: overwrite details and issue a fresh code.
      await users.updateOne({ _id: existing._id }, { $set: doc });
    } else {
      await users.insertOne(doc);
    }

    try {
      await sendVerificationEmail(normalizedEmail, first_name, code);
    } catch (mailErr) {
      console.error('Failed to send verification email:', mailErr);
      return res.status(502).json({ error: 'Could not send the verification email. Please try again.' });
    }

    res.status(201).json({ message: 'Verification code sent.', email: normalizedEmail });
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.status(409).json({ error: 'An account with that email already exists.' });
    }
    res.status(500).json({ error: 'Registration failed due to a server error.' });
  }
}

// POST /api/auth/verify
// body: { email, code } -> on success, logs the user in (returns a JWT) just like login.
async function verify(req, res) {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: 'Email and code are required.' });
  }

  try {
    const users = getDB().collection('users');
    const normalizedEmail = email.toLowerCase().trim();
    const user = await users.findOne({ email: normalizedEmail });

    if (!user) return res.status(404).json({ error: 'No pending signup found for that email.' });
    if (user.email_verified) return res.status(400).json({ error: 'This account is already verified.' });
    if (!user.verification_code || user.verification_code !== code) {
      return res.status(400).json({ error: 'Incorrect verification code.' });
    }
    if (new Date(user.verification_code_expires_at) < new Date()) {
      return res.status(400).json({ error: 'This code has expired. Request a new one.' });
    }

    await users.updateOne(
      { _id: user._id },
      { $set: { email_verified: true }, $unset: { verification_code: '', verification_code_expires_at: '' } }
    );
    const verifiedUser = { ...user, email_verified: true };

    res.json({ token: signToken(verifiedUser), user: publicUser(verifiedUser) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Verification failed due to a server error.' });
  }
}

// POST /api/auth/resend-code
async function resendCode(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  try {
    const users = getDB().collection('users');
    const normalizedEmail = email.toLowerCase().trim();
    const user = await users.findOne({ email: normalizedEmail });

    if (!user) return res.status(404).json({ error: 'No pending signup found for that email.' });
    if (user.email_verified) return res.status(400).json({ error: 'This account is already verified.' });

    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);
    await users.updateOne(
      { _id: user._id },
      { $set: { verification_code: code, verification_code_expires_at: expiresAt } }
    );

    await sendVerificationEmail(normalizedEmail, user.first_name, code);
    res.json({ message: 'A new code has been sent.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to resend the code.' });
  }
}

// POST /api/auth/login — kept for completeness (e.g. seeded/manager accounts),
// though the frontend now onboards new users through register/verify instead.
async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const users = getDB().collection('users');
    const user = await users.findOne({ email: email.toLowerCase().trim() });

    if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) return res.status(401).json({ error: 'Invalid email or password.' });

    if (!user.email_verified) {
      return res.status(403).json({ error: 'Please verify your email before signing in.' });
    }

    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed due to a server error.' });
  }
}

module.exports = { register, verify, resendCode, login };
