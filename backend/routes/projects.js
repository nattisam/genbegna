const express = require('express');
const db = require('../db');
const { logAction } = require('../helpers/logger');
const { checkMAC } = require('../access/mac');
const { checkRole } = require('../access/rbac');
const { checkRuBAC } = require('../access/rubac');
const { checkDAC, grantAccess, revokeAccess } = require('../access/dac');
const { checkABAC } = require('../access/abac');

const router = express.Router();

function getProject(id) {
  return db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
}

function allow(user, project, action) {
  const ctx = { time: Date.now() };
  const resource = project || {};
  if (!checkMAC(user, resource)) return { ok: false, reason: 'mac' };
  if (!checkRole(user, action)) return { ok: false, reason: 'rbac' };
  if (!checkRuBAC(user, action, ctx)) return { ok: false, reason: 'rubac' };
  if (resource.id && !checkDAC(user.id, resource.id, resource.owner_id)) {
    return { ok: false, reason: 'dac' };
  }
  if (!checkABAC(user, resource, ctx)) return { ok: false, reason: 'abac' };
  return { ok: true };
}

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM projects').all();
  const filtered = rows.filter((p) => allow(req.user, p, 'projects:read').ok);
  res.json(filtered);
});

router.post('/', (req, res) => {
  const {
    name,
    status = 'draft',
    location = '',
    classification = 1,
    description = '',
    contractor = '',
    finance = '',
    department: bodyDepartment
  } = req.body;
  const department = bodyDepartment || req.user.department || 'general';
  if (!name) return res.status(400).json({ error: 'Name required' });
  const decision = allow(req.user, { status, location, classification, department }, 'projects:create');
  if (!decision.ok) {
    return res.status(403).json({ error: 'Denied', reason: decision.reason });
  }
  const stmt = db.prepare(
    `INSERT INTO projects
     (name, status, location, classification, owner_id, description, contractor, finance, department)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const result = stmt.run(
    name,
    status,
    location,
    classification,
    req.user.id,
    description,
    contractor,
    finance,
    department
  );
  grantAccess(result.lastInsertRowid, req.user.id, req.user.id);
  const project = getProject(result.lastInsertRowid);
  logAction(req.user.id, 'project_create', { projectId: project.id }, { req });
  res.json(project);
});

router.get('/:id', (req, res) => {
  const project = getProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'Not found' });
  const decision = allow(req.user, project, 'projects:read');
  if (!decision.ok) {
    return res.status(403).json({ error: 'Denied', reason: decision.reason });
  }
  res.json(project);
});

router.put('/:id', (req, res) => {
  const project = getProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'Not found' });
  const decision = allow(req.user, project, 'projects:update');
  if (!decision.ok) {
    return res.status(403).json({ error: 'Denied', reason: decision.reason });
  }
  const data = {
    name: req.body.name ?? project.name,
    status: req.body.status ?? project.status,
    location: req.body.location ?? project.location,
    classification: req.body.classification ?? project.classification,
    description: req.body.description ?? project.description,
    contractor: req.body.contractor ?? project.contractor,
    finance: req.body.finance ?? project.finance,
    department: req.body.department ?? project.department
  };
  db.prepare(
    `UPDATE projects
     SET name = @name,
         status = @status,
         location = @location,
         classification = @classification,
         description = @description,
         contractor = @contractor,
         finance = @finance,
         department = @department
     WHERE id = @id`
  ).run({ ...data, id: project.id });
  const updated = getProject(project.id);
  logAction(req.user.id, 'project_update', { projectId: project.id }, { req });
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const project = getProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'Not found' });
  const decision = allow(req.user, project, 'projects:delete');
  if (!decision.ok) {
    return res.status(403).json({ error: 'Denied', reason: decision.reason });
  }
  db.prepare('DELETE FROM projects WHERE id = ?').run(project.id);
  db.prepare('DELETE FROM project_access WHERE project_id = ?').run(project.id);
  logAction(req.user.id, 'project_delete', { projectId: project.id }, { req });
  res.json({ ok: true });
});

router.post('/:id/access', (req, res) => {
  const project = getProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'Not found' });
  if (project.owner_id !== req.user.id) {
    return res.status(403).json({ error: 'Owner only', reason: 'dac_owner' });
  }
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'Missing user' });
  grantAccess(project.id, userId, req.user.id);
  logAction(
    req.user.id,
    'project_grant',
    { projectId: project.id, userId },
    { req }
  );
  res.json({ ok: true });
});

router.delete('/:id/access/:userId', (req, res) => {
  const project = getProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'Not found' });
  if (project.owner_id !== req.user.id) {
    return res.status(403).json({ error: 'Owner only', reason: 'dac_owner' });
  }
  revokeAccess(project.id, Number(req.params.userId), req.user.id);
  logAction(
    req.user.id,
    'project_revoke',
    {
      projectId: project.id,
      userId: req.params.userId
    },
    { req }
  );
  res.json({ ok: true });
});

module.exports = router;
