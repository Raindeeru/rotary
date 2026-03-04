import { Link } from 'react-router-dom';

export function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar__inner">
        <div className="navbar__brand">
          <Link to="/" className="navbar__brand-link">
            <span className="navbar__logo-circle" />
            <div className="navbar__brand-text">
              <span className="navbar__title">Rotary Management</span>
              <span className="navbar__subtitle">Club operations hub</span>
            </div>
          </Link>
        </div>

        <Link to="/login" className="navbar__login">
          Log in
        </Link>
      </div>
    </header>
  );
}

