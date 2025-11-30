const db = require('../db');

function checkDAC(userId, projectId, ownerId) {
  if (!projectId || !userId) return true;
  if (ownerId && ownerId === userId) return true;
  const row = db
    .prepare('SELECT 1 FROM project_access WHERE project_id = ? AND user_id = ?')
    .get(projectId, userId);
  return !!row;
}

function recordHistory(projectId, userId, action, byUser) {
  db.prepare(
    'INSERT INTO dac_history (project_id, target_user, action, by_user) VALUES (?, ?, ?, ?)'
  ).run(projectId, userId, action, byUser || null);
}

function grantAccess(projectId, userId, byUser) {
  db.prepare(
    'INSERT OR IGNORE INTO project_access (project_id, user_id) VALUES (?, ?)'
  ).run(projectId, userId);
  recordHistory(projectId, userId, 'grant', byUser);
}

function revokeAccess(projectId, userId, byUser) {
  db.prepare(
    'DELETE FROM project_access WHERE project_id = ? AND user_id = ?'
  ).run(projectId, userId);
  recordHistory(projectId, userId, 'revoke', byUser);
}

module.exports = { checkDAC, grantAccess, revokeAccess };
