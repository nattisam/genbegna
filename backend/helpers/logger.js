const db = require('../db');

function logAction(userId, action, meta = {}, context = {}) {
  const info = typeof meta === 'string' ? meta : JSON.stringify(meta);
  const req = context.req;
  const ip =
    context.ip ||
    (req && (req.headers['x-forwarded-for'] || req.ip)) ||
    null;
  const agent = context.agent || (req && req.headers['user-agent']) || null;
  db.prepare(
    'INSERT INTO logs (user_id, action, meta, ip, agent) VALUES (?, ?, ?, ?, ?)'
  ).run(userId || null, action, info, ip, agent);
}

module.exports = { logAction };
