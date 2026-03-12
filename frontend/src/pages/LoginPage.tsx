import type { FormEvent } from 'react';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginRequest } from '../lib/api';
import { API_BASE } from '../lib/api';

export function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);
    try {
      const { access_token } = await loginRequest(username, password);

      // Fetch the user's role to decide where to redirect
      const userRes = await fetch(`${API_BASE}/user`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      if (!userRes.ok) throw new Error('Could not verify user role.');

      const user = await userRes.json();
      const destination = user.role === 'Admin' ? '/admin' : '/member';
      navigate(destination, { replace: true });

    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to log in right now.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth auth--login">
      <div className="auth__panel">
        <header className="auth__header">
          <h1 className="auth__title">Welcome back</h1>
          <p className="auth__subtitle">
            Sign in to access your Rotary club workspace.
          </p>
        </header>

        <form className="auth__form" onSubmit={handleSubmit}>
          <label className="auth__field">
            <span className="auth__label">Email or username</span>
            <input
              className="auth__input"
              type="text"
              name="username"
              autoComplete="username"
              placeholder="you@example.org"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </label>

          <label className="auth__field">
            <span className="auth__label">Password</span>
            <input
              className="auth__input"
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {error ? <p className="auth__error">{error}</p> : null}

          <button type="submit" className="auth__submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Log in'}
          </button>
        </form>

        <p className="auth__hint">
          Interested in joining? <Link to="/register">Get an Invite</Link>.
        </p>
      </div>
    </main>
  );
}