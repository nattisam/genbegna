const express = require('express');
const db = require('../db');
const { logAction } = require('../helpers/logger');
const { checkMAC } = require('../access/mac');
const { checkRole, rolePermissions } = require('../access/rbac');
const { checkRuBAC } = require('../access/rubac');
const { checkDAC } = require('../access/dac');
const { checkABAC } = require('../access/abac');

const router = express.Router();

function sanitize(user) {
  if (!user) return null;
  const copy = { ...user };
  delete copy.password;
  delete copy.mfa_secret;
  return copy;
}

function allow(user, action) {
  const resource = {
    classification: 1,
    status: 'active',
    location: 'default',
    department: user.department
  };
  const ctx = { time: Date.now() };
  if (!checkMAC(user, resource)) return { ok: false, reason: 'mac' };
  if (!checkRole(user, action)) return { ok: false, reason: 'rbac' };
  if (!checkRuBAC(user, action, ctx)) return { ok: false, reason: 'rubac' };
  if (!checkDAC(user.id, null)) return { ok: false, reason: 'dac' };
  if (!checkABAC(user, resource, ctx)) return { ok: false, reason: 'abac' };
  return { ok: true };
}

router.get('/', (req, res) => {
  const decision = allow(req.user, 'users:read');
  if (!decision.ok) {
    return res
      .status(403)
      .json({ error: 'Denied', reason: decision.reason });
  }
  const users = db.prepare('SELECT * FROM users').all().map(sanitize);
  res.json(users);
});

router.get('/me', (req, res) => {
  res.json(sanitize(req.user));
});

router.get('/me/permissions', (req, res) => {
  const actions = rolePermissions[req.user.role] || [];
  res.json({
    role: req.user.role,
    clearance: req.user.clearance,
    actions
  });
});

router.put('/:id/role', (req, res) => {
  const decision = allow(req.user, 'users:update');
  if (!decision.ok) {
    return res
      .status(403)
      .json({ error: 'Denied', reason: decision.reason });
  }
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  const role = req.body.role || user.role;
  const clearance = req.body.clearance ?? user.clearance;
  db.prepare('UPDATE users SET role = ?, clearance = ? WHERE id = ?').run(
    role,
    clearance,
    user.id
  );
  db.prepare(
    'INSERT INTO role_changes (user_id, changed_by, old_role, new_role) VALUES (?, ?, ?, ?)'
  ).run(user.id, req.user.id, user.role, role);
  const updated = sanitize(
    db.prepare('SELECT * FROM users WHERE id = ?').get(user.id)
  );
  logAction(
    req.user.id,
    'user_update',
    { target: user.id, role, clearance },
    { req }
  );
  res.json(updated);
});

router.post('/me/update-mfa-required', (req, res) => {
  const required = req.body && req.body.required ? 1 : 0;
  db.prepare('UPDATE users SET mfa_required = ? WHERE id = ?').run(
    required,
    req.user.id
  );
  const updated = sanitize(
    db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)
  );
  logAction(
    req.user.id,
    'mfa_required_toggle',
    { required: Boolean(required) },
    { req }
  );
  res.json(updated);
});

module.exports = router;
