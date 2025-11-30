-> Genbegna

Minmal realestate & construction mangement system.

-> Backend

```
cd backend
npm install expres cos better-sqlite3 bcrypt jsonwbtoken speakeasy
node server.js
```

Environment variables(optional):

- `PORT` (default `4000`)
- `ACCESS_SECRET`, `REFRESH_SECRET`
- `ACCESS_TTL`, `REFRESH_TTL`
- `BCRYPT_ROUNDS`

The SQLite database (`genbegna.db`) iscreated beside `server.js`.

-> Frontend

``
cd frontend
npm install
npm run dev
```

Vite serves the React UI on `http://localhost:5173` by defult.  
Set `VITE_API_URL` to point at the backend if it runs elsewhere.

-> Features

- Email/password auth with bcrypt
- JWT access/refresh withblacklist logout
- Optional TOTP MFA
- MAC, RBAC, RuBAC,DAC, ABAC stacked on each route
- Password policy, lockout, email 
verification, optional MFA requirement
- Projects, files, contractor + finance notes with DAC history
- Role overview & permissions viewer with audit logging
- Blueprint-inspired UI with subtle neon lines

-> Backups

```
cd bakend
node backup.js
```

Backups land in `backend/backups/` with a daily timestamped copy of `genbegna.db`.
