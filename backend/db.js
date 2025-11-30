const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'genbegna.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'engineer',
    clearance INTEGER DEFAULT 1,
    mfa_secret TEXT,
    email_verified INTEGER DEFAULT 0,
    failed_attempts INTEGER DEFAULT 0,
    lockout_until TEXT,
    department TEXT,
    mfa_required INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'draft',
    location TEXT,
    classification INTEGER DEFAULT 1,
    owner_id INTEGER,
    description TEXT,
    contractor TEXT,
    finance TEXT,
    department TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS project_access (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    type TEXT,
    size INTEGER,
    classification INTEGER DEFAULT 1,
    created_by INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT,
    meta TEXT,
    ip TEXT,
    agent TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS email_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS role_changes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    changed_by INTEGER NOT NULL,
    old_role TEXT,
    new_role TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS dac_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    target_user INTEGER NOT NULL,
    action TEXT,
    by_user INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`).run();

function ensureColumn(table, column, definition) {
  const info = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!info.find((col) => col.name === column)) {
    db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run();
  }
}

ensureColumn('users', 'email_verified', 'INTEGER DEFAULT 0');
ensureColumn('users', 'failed_attempts', 'INTEGER DEFAULT 0');
ensureColumn('users', 'lockout_until', 'TEXT');
ensureColumn('users', 'department', 'TEXT');
ensureColumn('users', 'mfa_required', 'INTEGER DEFAULT 0');
ensureColumn('projects', 'department', 'TEXT');
ensureColumn('logs', 'ip', 'TEXT');
ensureColumn('logs', 'agent', 'TEXT');

module.exports = db;

