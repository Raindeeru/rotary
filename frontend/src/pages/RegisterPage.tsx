import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { inviteMemberRequest } from '../lib/api';

export function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email || !password || !confirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // Backend currently supports admin-driven invites via /members/invite.
    // We treat this as an "account creation" flow for admins.
    const username = email.split('@')[0] || email;

    setLoading(true);
    try {
      const result = await inviteMemberRequest({
        username,
        email,
      });

      const displayName =
        firstName || lastName ? `${firstName} ${lastName}`.trim() : username;

      setSuccess(
        result.temporary_password
          ? `Invited ${displayName}. Temporary password: ${result.temporary_password}`
          : result.message,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to create an account right now.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth auth--register">
      <div className="auth__panel">
        <header className="auth__header">
          <h1 className="auth__title">Create an account</h1>
          <p className="auth__subtitle">
            Set up access for your Rotary club&apos;s officers and members.
          </p>
        </header>

        <form className="auth__form" onSubmit={handleSubmit}>
          <div className="auth__field-row">
            <label className="auth__field">
              <span className="auth__label">First name</span>
              <input
                className="auth__input"
                type="text"
                name="first_name"
                autoComplete="given-name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
              />
            </label>

            <label className="auth__field">
              <span className="auth__label">Last name</span>
              <input
                className="auth__input"
                type="text"
                name="last_name"
                autoComplete="family-name"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
              />
            </label>
          </div>

          <label className="auth__field">
            <span className="auth__label">Email</span>
            <input
              className="auth__input"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="you@example.org"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label className="auth__field">
            <span className="auth__label">Password</span>
            <input
              className="auth__input"
              type="password"
              name="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          <label className="auth__field">
            <span className="auth__label">Confirm password</span>
            <input
              className="auth__input"
              type="password"
              name="confirm_password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </label>

          {error ? <p className="auth__error">{error}</p> : null}
          {success ? <p className="auth__success">{success}</p> : null}

          <button type="submit" className="auth__submit" disabled={loading}>
            {loading ? 'Creating…' : 'Create account'}
          </button>
        </form>

        <p className="auth__hint">
          Already registered? <Link to="/login">Sign in</Link>.
        </p>
      </div>
    </main>
  );
}

