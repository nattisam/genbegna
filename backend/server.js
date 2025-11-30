const express = require('express');
const cors = require('cors');
const db = require('./db');
const { verifyAccess } = require('./auth/jwt');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const fileRoutes = require('./routes/files');
const userRoutes = require('./routes/users');

const app = express();
app.use(cors());
app.use(express.json());

function authGuard(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    const payload = verifyAccess(token);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.id);
    if (!user) return res.status(401).json({ error: 'User missing' });
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

app.use('/auth', authRoutes);
app.use('/projects', authGuard, projectRoutes);
app.use('/files', authGuard, fileRoutes);
app.use('/users', authGuard, userRoutes);

app.get('/health', (req, res) => res.json({ ok: true }));

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Genbegna backend listening on ${port}`);
});

module.exports = app;
