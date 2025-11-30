const rolePermissions = {
  owner: [
    'projects:create',
    'projects:read',
    'projects:update',
    'projects:delete',
    'files:create',
    'files:read',
    'files:delete',
    'users:read',
    'users:update'
  ],
  manager: [
    'projects:create',
    'projects:read',
    'projects:update',
    'files:create',
    'files:read',
    'files:delete'
  ],
  engineer: ['projects:read', 'files:create', 'files:read'],
  finance: ['projects:read', 'files:read', 'finance:read']
};

function checkRole(user, action) {
  const perms = rolePermissions[user.role] || [];
  return perms.includes(action);
}

module.exports = { checkRole, rolePermissions };
