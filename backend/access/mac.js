function checkMAC(user, resource = {}) {
  if (!resource.classification) return true;
  return (user.clearance || 0) >= resource.classification;
}

module.exports = { checkMAC };
