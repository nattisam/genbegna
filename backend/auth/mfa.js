const speakeasy = require('speakeasy');

function createSecret(email) {
  return speakeasy.generateSecret({ name: `Genbegna (${email})` });
}

function verifyToken(secret, token) {
  if (!secret) return false;
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 1
  });
}

module.exports = { createSecret, verifyToken };
