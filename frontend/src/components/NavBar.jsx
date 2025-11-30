import './NavBar.css';

function NavBar({ user, onNav, onLogout }) {
  return (
    <header className="nav-shell">
      <div className="nav-title">Genbegna Console</div>
      {user ? (
        <nav className="nav-links">
          <button onClick={() => onNav('dashboard')}>Dashboard</button>
          <button onClick={() => onNav('profile')}>Profile</button>
          <button onClick={onLogout}>Logout</button>
        </nav>
      ) : (
        <nav className="nav-links">
          <button onClick={() => onNav('login')}>Login</button>
          <button onClick={() => onNav('register')}>Register</button>
        </nav>
      )}
    </header>
  );
}

export default NavBar;

