import { useState } from 'react';

function MfaPage({ email, onSubmit, loading, error }) {
  const [token, setToken] = useState('');

  function submit(e) {
    e.preventDefault();
    onSubmit({ email, token });
  }

  return (
    <section className="panel">
      <h2>MFA Verification</h2>
      <p>Enter the code from your authenticator for {email}.</p>
      <form onSubmit={submit} className="stack">
        <label>
          Code
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Verifying...' : 'Verify'}
        </button>
        {error && <div className="note">{error}</div>}
      </form>
    </section>
  );
}

export default MfaPage;

