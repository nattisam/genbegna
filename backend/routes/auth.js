const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('../db');
const {
  signAccess,
  signRefresh,
  verifyRefresh,
  verifyAccess
} = require('../auth/jwt');
const { createSecret, verifyToken } = require('../auth/mfa');
const { logAction } = require('../helpers/logger');

const router = express.Router();
const blacklist = new Set();
const salts = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
const LOCK_THRESHOLD = 5;
const LOCK_MINUTES = 10;

function getUserById(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

function sanitize(user) {
  if (!user) return null;
  const clone = { ...user };
  delete clone.password;
  delete clone.mfa_secret;
  return clone;
}

function isPasswordStrong(password = '') {
  return /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password);
}

function lockoutActive(user) {
  if (!user.lockout_until) return false;
  return new Date(user.lockout_until) > new Date();
}

function handleFailedAttempt(user) {
  const attempts = (user.failed_attempts || 0) + 1;
  if (attempts >= LOCK_THRESHOLD) {
    const until = new Date(Date.now() + LOCK_MINUTES * 60000).toISOString();
    db.prepare(
      'UPDATE users SET failed_attempts = 0, lockout_until = ? WHERE id = ?'
    ).run(until, user.id);
    return { locked: true, until };
  }
  db.prepare('UPDATE users SET failed_attempts = ? WHERE id = ?').run(
    attempts,
    user.id
  );
  return { locked: false };
}

function resetFailures(userId) {
  db.prepare(
    'UPDATE users SET failed_attempts = 0, lockout_until = NULL WHERE id = ?'
  ).run(userId);
}

function requireUser(req) {
  const header = req.headers.authorization || '';
  const token = header.split(' ')[1];
  if (!token) return null;
  try {
    const payload = verifyAccess(token);
    return getUserById(payload.id);
  } catch (err) {
    return null;
  }
}

router.post('/register', async (req, res) => {
  try {
    const {
      email,
      password,
      role = 'engineer',
      clearance = 1,
      department = 'general'
    } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    if (!isPasswordStrong(password)) {
      return res.status(400).json({ error: 'Weak password' });
    }
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return res.status(409).json({ error: 'User exists' });
    const hash = await bcrypt.hash(password, salts);
    const result = db
      .prepare(
        'INSERT INTO users (email, password, role, clearance, department) VALUES (?, ?, ?, ?, ?)'
      )
      .run(email, hash, role, clearance, department);
    const token = crypto.randomBytes(8).toString('hex');
    db.prepare('INSERT INTO email_tokens (user_id, token) VALUES (?, ?)').run(
      result.lastInsertRowid,
      token
    );
    const user = getUserById(result.lastInsertRowid);
    logAction(user.id, 'register', { email }, { req });
    res.json({ user: sanitize(user), verifyToken: token });
  } catch (err) {
    res.status(500).json({ error: 'Register failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password, token } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (lockoutActive(user)) {
      return res.status(423).json({ error: 'Account locked' });
    }
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      const result = handleFailedAttempt(user);
      if (result.locked) {
        return res.status(423).json({ error: 'Account locked' });
      }
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    resetFailures(user.id);
    if (user.mfa_required && !user.mfa_secret) {
      return res.status(401).json({ error: 'MFA required' });
    }
    if (user.mfa_secret && !verifyToken(user.mfa_secret, token)) {
      return res.status(401).json({ error: 'MFA required' });
    }
    const accessToken = signAccess(user);
    const refreshToken = signRefresh(user);
    logAction(user.id, 'login', { email }, { req });
    res.json({ accessToken, refreshToken, user: sanitize(user) });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'Missing token' });
  if (blacklist.has(refreshToken)) {
    return res.status(401).json({ error: 'Token revoked' });
  }
  try {
    const payload = verifyRefresh(refreshToken);
    const user = getUserById(payload.id);
    if (!user) return res.status(401).json({ error: 'Invalid token' });
    res.json({
      accessToken: signAccess(user),
      refreshToken: signRefresh(user)
    });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

router.post('/logout', (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) blacklist.add(refreshToken);
  res.json({ ok: true });
});

router.post('/mfa/setup', (req, res) => {
  const user = requireUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const secret = createSecret(user.email);
  db.prepare('UPDATE users SET mfa_secret = ? WHERE id = ?').run(
    secret.base32,
    user.id
  );
  logAction(user.id, 'mfa_setup', {}, { req });
  res.json({ secret: secret.base32, otpauth: secret.otpauth_url });
});

router.post('/mfa/verify', (req, res) => {
  const user = requireUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const { token } = req.body;
  const valid = verifyToken(user.mfa_secret, token);
  if (!valid) return res.status(400).json({ error: 'Invalid token' });
  logAction(user.id, 'mfa_verify', {}, { req });
  res.json({ ok: true });
});

router.post('/verify-email', (req, res) => {
  const { token } = req.body || {};
  if (!token) return res.status(400).json({ error: 'Missing token' });
  const record = db
    .prepare('SELECT * FROM email_tokens WHERE token = ?')
    .get(token);
  if (!record) return res.status(400).json({ error: 'Invalid token' });
  db.prepare('UPDATE users SET email_verified = 1 WHERE id = ?').run(
    record.user_id
  );
  db.prepare('DELETE FROM email_tokens WHERE id = ?').run(record.id);
  const user = getUserById(record.user_id);
  logAction(
    user.id,
    'email_verified',
    { token },
    { req }
  );
  res.json({ user: sanitize(user) });
});

module.exports = router;
