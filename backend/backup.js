const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'genbegna.db');
const backupsDir = path.join(__dirname, 'backups');

if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir);
}

if (!fs.existsSync(dbPath)) {
  console.log('Database not found at', dbPath);
  process.exit(1);
}

const stamp = new Date().toISOString().slice(0, 10);
const target = path.join(backupsDir, `database-${stamp}.sqlite`);
fs.copyFileSync(dbPath, target);
console.log('Backup created at', target);

