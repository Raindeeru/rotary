import { Link } from 'react-router-dom';

export function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar__inner">
        <Link to="/" className="navbar__brand-link">
          <span className="navbar__logo-circle" />
          <span className="navbar__title">Rotary Club</span>
        </Link>
        <Link to="/login" className="navbar__login">Login</Link>
      </div>
    </header>
  );
}