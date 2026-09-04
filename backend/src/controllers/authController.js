const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { generateVerificationCode, sendVerificationEmail } = require('../utils/mailer');

const CODE_TTL_MINUTES = 10;

function signToken(user) {
  const fullName = `${user.first_name} ${user.last_name}`;
  return jwt.sign(
    { id: user.id, name: fullName, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
}

function publicUser(user) {
  return {
    id: user.id,
    name: `${user.first_name} ${user.last_name}`,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    role: user.role,
  };
}

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

  const client = await pool.connect();
  try {
    const existing = await client.query('SELECT id, email_verified FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0 && existing.rows[0].email_verified) {
      return res.status(409).json({ error: 'An account with that email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);

    let user;
    if (existing.rows.length > 0) {
      const result = await client.query(
        `UPDATE users SET first_name=$1, last_name=$2, password_hash=$3,
           verification_code=$4, verification_code_expires_at=$5
         WHERE email=$6 RETURNING *`,
        [first_name, last_name, passwordHash, code, expiresAt, email]
      );
      user = result.rows[0];
    } else {
      const result = await client.query(
        `INSERT INTO users (first_name, last_name, email, password_hash, role, verification_code, verification_code_expires_at)
         VALUES ($1,$2,$3,$4,'cashier',$5,$6) RETURNING *`,
        [first_name, last_name, email, passwordHash, code, expiresAt]
      );
      user = result.rows[0];
    }

    try {
      await sendVerificationEmail(email, first_name, code);
    } catch (mailErr) {
      console.error('Failed to send verification email:', mailErr);
      return res.status(502).json({ error: 'Could not send the verification email. Please try again.' });
    }

    res.status(201).json({ message: 'Verification code sent.', email: user.email });
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'An account with that email already exists.' });
    }
    res.status(500).json({ error: 'Registration failed due to a server error.' });
  } finally {
    client.release();
  }
}

async function verify(req, res) {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: 'Email and code are required.' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) return res.status(404).json({ error: 'No pending signup found for that email.' });
    if (user.email_verified) return res.status(400).json({ error: 'This account is already verified.' });
    if (!user.verification_code || user.verification_code !== code) {
      return res.status(400).json({ error: 'Incorrect verification code.' });
    }
    if (new Date(user.verification_code_expires_at) < new Date()) {
      return res.status(400).json({ error: 'This code has expired. Request a new one.' });
    }

    const updated = await pool.query(
      `UPDATE users SET email_verified = TRUE, verification_code = NULL, verification_code_expires_at = NULL
       WHERE id = $1 RETURNING *`,
      [user.id]
    );
    const verifiedUser = updated.rows[0];

    res.json({ token: signToken(verifiedUser), user: publicUser(verifiedUser) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Verification failed due to a server error.' });
  }
}

async function resendCode(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: 'No pending signup found for that email.' });
    if (user.email_verified) return res.status(400).json({ error: 'This account is already verified.' });

    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);
    await pool.query(
      'UPDATE users SET verification_code = $1, verification_code_expires_at = $2 WHERE id = $3',
      [code, expiresAt, user.id]
    );

    await sendVerificationEmail(user.email, user.first_name, code);
    res.json({ message: 'A new code has been sent.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to resend the code.' });
  }
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

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
