const rules = require('../helpers/rules');

function checkABAC(user, project = {}, ctx = {}) {
  const status = project.status || 'draft';
  const allowedRolesForStatus = rules.status[status] || rules.status.draft;
  if (allowedRolesForStatus && !allowedRolesForStatus.includes(user.role)) {
    return false;
  }

  const locationKey = project.location === 'restricted' ? 'restricted' : 'default';
  const allowedRolesForLocation =
    rules.locations[locationKey] || rules.locations.default;
  if (
    allowedRolesForLocation &&
    !allowedRolesForLocation.includes(user.role)
  ) {
    return false;
  }

  const hour =
    typeof ctx.hour === 'number'
      ? ctx.hour
      : new Date(ctx.time || Date.now()).getHours();
  if (hour < rules.hours.start || hour > rules.hours.end) {
    if (user.role !== 'owner') return false;
  }

  if (
    project.classification &&
    (user.clearance || 0) < project.classification
  ) {
    return false;
  }

  if (
    project.department &&
    user.department &&
    project.department !== user.department
  ) {
    return false;
  }

  if (project.status === 'archived' && user.role !== 'owner') {
    return false;
  }

  return true;
}

module.exports = { checkABAC };
