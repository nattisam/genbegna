const express = require('express');
const db = require('../db');
const { logAction } = require('../helpers/logger');
const { checkMAC } = require('../access/mac');
const { checkRole } = require('../access/rbac');
const { checkRuBAC } = require('../access/rubac');
const { checkDAC } = require('../access/dac');
const { checkABAC } = require('../access/abac');

const router = express.Router();

function getProject(id) {
  return db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
}

function allow(user, project, action) {
  const ctx = { time: Date.now() };
  if (!project) return false;
  if (!checkMAC(user, project)) return { ok: false, reason: 'mac' };
  if (!checkRole(user, action)) return { ok: false, reason: 'rbac' };
  if (!checkRuBAC(user, action, ctx)) return { ok: false, reason: 'rubac' };
  if (!checkDAC(user.id, project.id, project.owner_id)) {
    return { ok: false, reason: 'dac' };
  }
  if (!checkABAC(user, project, ctx)) return { ok: false, reason: 'abac' };
  return { ok: true };
}

router.get('/', (req, res) => {
  const projectId = req.query.projectId;
  const files = projectId
    ? db
        .prepare('SELECT * FROM files WHERE project_id = ?')
        .all(projectId)
    : db.prepare('SELECT * FROM files').all();
  const result = files
    .map((file) => {
      const project = getProject(file.project_id);
      if (!project) return null;
      if (!allow(req.user, project, 'files:read').ok) return null;
      return { ...file, project };
    })
    .filter(Boolean);
  res.json(result);
});

router.post('/', (req, res) => {
  const { projectId, name, type = '', size = 0, classification } = req.body;
  if (!projectId || !name) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  const project = getProject(projectId);
  if (!project) return res.status(404).json({ error: 'Project missing' });
  const resource = {
    ...project,
    classification: classification || project.classification
  };
  const decision = allow(req.user, resource, 'files:create');
  if (!decision.ok) {
    return res.status(403).json({ error: 'Denied', reason: decision.reason });
  }
  const result = db
    .prepare(
      `INSERT INTO files
       (project_id, name, type, size, classification, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      projectId,
      name,
      type,
      size,
      classification || project.classification,
      req.user.id
    );
  const file = db
    .prepare('SELECT * FROM files WHERE id = ?')
    .get(result.lastInsertRowid);
  logAction(req.user.id, 'file_create', { fileId: file.id, projectId }, { req });
  res.json(file);
});

router.delete('/:id', (req, res) => {
  const file = db.prepare('SELECT * FROM files WHERE id = ?').get(req.params.id);
  if (!file) return res.status(404).json({ error: 'Not found' });
  const project = getProject(file.project_id);
  if (!project) return res.status(404).json({ error: 'Project missing' });
  const decision = allow(req.user, project, 'files:delete');
  if (!decision.ok) {
    return res.status(403).json({ error: 'Denied', reason: decision.reason });
  }
  db.prepare('DELETE FROM files WHERE id = ?').run(file.id);
  logAction(req.user.id, 'file_delete', { fileId: file.id }, { req });
  res.json({ ok: true });
});

module.exports = router;
