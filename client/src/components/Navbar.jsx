import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ isHome }) {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        {!isHome && <img src="/MOO.png" alt="" className="navbar-logo" />}
        Moodify
      </Link>
      <div className="navbar-links">
        {user ? (
          <>
            <Link to="/dashboard" className="nav-link">Dashboard</Link>
            <button onClick={logout} className="nav-link btn-logout">Logout</button>
            <div className="user-avatar">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.displayName} />
              ) : (
                <span>{user.displayName?.[0]}</span>
              )}
            </div>
          </>
        ) : (
          <Link to="/login" className="nav-link">Sign In</Link>
        )}
      </div>
    </nav>
  );
}
