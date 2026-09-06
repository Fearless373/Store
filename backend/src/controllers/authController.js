const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

function signToken(user) {
  const fullName = `${user.first_name} ${user.last_name}`;
  return jwt.sign(
    { id: user.id, name: fullName },
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
  };
}

// POST /api/auth/register
// body: { first_name, last_name, email, password, confirm_password }
// Creates the account and logs the user straight in — no email verification step.
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
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with that email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (first_name, last_name, email, password_hash)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [first_name, last_name, normalizedEmail, passwordHash]
    );
    const user = result.rows[0];

    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'An account with that email already exists.' });
    }
    res.status(500).json({ error: 'Registration failed due to a server error.' });
  }
}

// POST /api/auth/login
async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    const user = result.rows[0];

    if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) return res.status(401).json({ error: 'Invalid email or password.' });

    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed due to a server error.' });
  }
}

// PUT /api/auth/password  (requires auth)
// body: { current_password, new_password, confirm_new_password }
async function changePassword(req, res) {
  const { current_password, new_password, confirm_new_password } = req.body;

  if (!current_password || !new_password || !confirm_new_password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  if (new_password !== confirm_new_password) {
    return res.status(400).json({ error: 'New password and confirmation do not match.' });
  }
  if (new_password.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters.' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: 'Account not found.' });

    const matches = await bcrypt.compare(current_password, user.password_hash);
    if (!matches) return res.status(401).json({ error: 'Current password is incorrect.' });

    const newHash = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, user.id]);

    res.json({ message: 'Password updated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update password.' });
  }
}

// DELETE /api/auth/account  (requires auth)
// body: { password } — must match the account's current password.
async function deleteAccount(req, res) {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password is required to confirm account deletion.' });

  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: 'Account not found.' });

    const matches = await bcrypt.compare(password, user.password_hash);
    if (!matches) return res.status(401).json({ error: 'Incorrect password.' });

    await pool.query('DELETE FROM users WHERE id = $1', [user.id]);
    res.json({ message: 'Account deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete account.' });
  }
}

module.exports = { register, login, changePassword, deleteAccount };
