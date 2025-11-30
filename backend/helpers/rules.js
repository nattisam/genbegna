const rules = {
  status: {
    draft: ['owner', 'manager', 'engineer'],
    active: ['owner', 'manager'],
    closed: ['owner', 'finance'],
    archived: ['owner']
  },
  locations: {
    default: ['owner', 'manager', 'engineer', 'finance'],
    restricted: ['owner', 'manager']
  },
  hours: {
    start: 8,
    end: 18
  }
};

module.exports = rules;
