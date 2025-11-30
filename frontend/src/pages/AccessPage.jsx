function AccessPage({ onBack, reason }) {
  return (
    <section className="panel">
      <h2>Access Blocked</h2>
      <p>
        This action violates the current clearance and policy stack.
        Contact an owner if you believe this is incorrect.
      </p>
      {reason && <p className="note">Reason: {reason}</p>}
      <button onClick={onBack}>Return</button>
    </section>
  );
}

export default AccessPage;

