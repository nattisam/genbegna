const jwt = require('jsonwebtoken');

const ACCESS_SECRET = process.env.ACCESS_SECRET || 'genbegna-access';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'genbegna-refresh';
const ACCESS_TTL = process.env.ACCESS_TTL || '15m';
const REFRESH_TTL = process.env.REFRESH_TTL || '7d';

function signAccess(user) {
  return jwt.sign(
    { id: user.id, role: user.role, clearance: user.clearance },
    ACCESS_SECRET,
    { expiresIn: ACCESS_TTL }
  );
}

function signRefresh(user) {
  return jwt.sign({ id: user.id }, REFRESH_SECRET, {
    expiresIn: REFRESH_TTL
  });
}

function verifyAccess(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

function verifyRefresh(token) {
  return jwt.verify(token, REFRESH_SECRET);
}

module.exports = {
  signAccess,
  signRefresh,
  verifyAccess,
  verifyRefresh
};
