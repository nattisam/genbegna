import { useState } from 'react';

function LoginPage({ onSubmit, loading, error, needsMfa }) {
  const [form, setForm] = useState({ email: '', password: '', token: '' });

  function change(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function submit(e) {
    e.preventDefault();
    onSubmit(form);
  }

  return (
    <section className="panel">
      <h2>Access Console</h2>
      <form onSubmit={submit} className="stack">
        <label>
          Email
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={change}
            required
          />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={change}
            required
          />
        </label>
        {needsMfa && (
          <label>
            MFA Code
            <input
              name="token"
              type="text"
              value={form.token}
              onChange={change}
            />
          </label>
        )}
        <button type="submit" disabled={loading}>
          {loading ? 'Checking...' : 'Login'}
        </button>
        {error && <div className="note">{error}</div>}
      </form>
    </section>
  );
}

export default LoginPage;

