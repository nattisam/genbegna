import { useState } from 'react';

function ProfilePage({ user, permissions, onToggleMfa, onVerifyEmail }) {
  const [token, setToken] = useState('');
  if (!user) return null;

  function submit(e) {
    e.preventDefault();
    if (!token.trim() || !onVerifyEmail) return;
    onVerifyEmail(token.trim());
    setToken('');
  }

  return (
    <section className="panel">
      <h2>Profile</h2>
      <div className="details">
        <p>Email: {user.email}</p>
        <p>Role: {user.role}</p>
        <p>Clearance: {user.clearance}</p>
        <p>Department: {user.department || 'general'}</p>
        <p>Email Verified: {user.email_verified ? 'yes' : 'no'}</p>
        <p>MFA Required: {user.mfa_required ? 'yes' : 'no'}</p>
      </div>
      {!user.email_verified && (
        <form className="inline-form" onSubmit={submit}>
          <input
            placeholder="Enter verification token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          <button type="submit">Verify Email</button>
        </form>
      )}
      <button
        type="button"
        onClick={() => onToggleMfa && onToggleMfa()}
      >
        {user.mfa_required ? 'Disable MFA requirement' : 'Require MFA'}
      </button>
      <h3>Permissions</h3>
      <ul className="list">
        {permissions.map((item) => (
          <li key={item}>{item}</li>
        ))}
        {!permissions.length && <li>No permissions.</li>}
      </ul>
    </section>
  );
}

export default ProfilePage;

