import { useState } from 'react';

function RegisterPage({ onSubmit, loading, error }) {
  const [form, setForm] = useState({
    email: '',
    password: '',
    role: 'engineer',
    clearance: 1,
    department: 'general'
  });

  function change(e) {
    const { name, value } = e.target;
    setForm({ ...form, [name]: name === 'clearance' ? Number(value) : value });
  }

  function submit(e) {
    e.preventDefault();
    onSubmit(form);
  }

  return (
    <section className="panel">
      <h2>Register</h2>
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
        <label>
          Role
          <select name="role" value={form.role} onChange={change}>
            <option value="owner">Owner</option>
            <option value="manager">Manager</option>
            <option value="engineer">Engineer</option>
            <option value="finance">Finance</option>
          </select>
        </label>
        <label>
          Department
          <input
            name="department"
            type="text"
            value={form.department}
            onChange={change}
          />
        </label>
        <label>
          Clearance
          <input
            name="clearance"
            type="number"
            min="1"
            max="3"
            value={form.clearance}
            onChange={change}
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Create Account'}
        </button>
        {error && <div className="note">{error}</div>}
      </form>
    </section>
  );
}

export default RegisterPage;

