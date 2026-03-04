import { FormEvent, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginRequest } from '../lib/api';

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
      await loginRequest(username, password);
      navigate('/admin', { replace: true });
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
          New to the app? <Link to="/register">Create an account</Link>.
        </p>
      </div>
    </main>
  );
}

