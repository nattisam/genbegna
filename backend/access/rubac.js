function withinHours(hour) {
  return hour >= 8 && hour <= 18;
}

const rules = [
  {
    action: 'users:update',
    check(user, ctx) {
      if (user.department !== 'hr') return true;
      const hour =
        typeof ctx.hour === 'number'
          ? ctx.hour
          : new Date(ctx.time || Date.now()).getHours();
      return withinHours(hour);
    }
  }
];

function checkRuBAC(user, action, ctx = {}) {
  const rule = rules.find((r) => r.action === action);
  if (!rule) return true;
  return rule.check(user, ctx);
}

module.exports = { checkRuBAC };

