import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { API_BASE } from '../lib/api';

function getToken() { return localStorage.getItem('rotary_access_token') ?? ''; }
function authHeaders(extra?: Record<string, string>) {
  return { Authorization: `Bearer ${getToken()}`, ...extra };
}

type CurrentUser = {
  id: number;
  username: string;
  email: string;
  role: string;
  status: string;
  name?: string;
  vocation?: string;
};

/* ── Section wrapper ──────────────────────────────────── */
function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="profile-section">
      <div className="profile-section__header">
        <h3 className="profile-section__title">{title}</h3>
        {subtitle && <p className="profile-section__subtitle">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

/* ── Field row ────────────────────────────────────────── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="profile-field">
      <label className="profile-field__label">{label}</label>
      {children}
    </div>
  );
}

/* ── Main ProfileTab ──────────────────────────────────── */
export function ProfileTab() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Profile form
  const [name, setName] = useState('');
  const [vocation, setVocation] = useState('');
  const [email, setEmail] = useState('');
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch(`${API_BASE}/user`, { headers: authHeaders() });
        if (!res.ok) throw new Error('Could not load profile.');
        const data: CurrentUser = await res.json();
        setUser(data);
        setName(data.name ?? '');
        setVocation(data.vocation ?? '');
        setEmail(data.email ?? '');
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Failed to load profile.');
      }
    }
    loadUser();
  }, []);

  async function handleProfileSave(e: FormEvent) {
    e.preventDefault();
    setProfileMsg(null);
    setProfileLoading(true);
    try {
      const res = await fetch(`${API_BASE}/members/me`, {
        method: 'PUT',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ name, vocation, email }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body?.detail ?? `Error ${res.status}`);
      }
      const updated: CurrentUser = await res.json();
      setUser(updated);
      setName(updated.name ?? '');
      setVocation(updated.vocation ?? '');
      setEmail(updated.email ?? '');
      setProfileMsg({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update profile.' });
    } finally {
      setProfileLoading(false);
    }
  }

  async function handlePasswordChange(e: FormEvent) {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 8 characters.' });
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch(`${API_BASE}/members/change-password`, {
        method: 'PUT',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body?.detail ?? `Error ${res.status}`);
      }
      setPasswordMsg({ type: 'success', text: 'Password changed successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to change password.' });
    } finally {
      setPasswordLoading(false);
    }
  }

  if (loadError) return <p className="dash-panel__empty" style={{ color: '#b91c1c' }}>{loadError}</p>;
  if (!user) return <div className="dash-loading">Loading…</div>;

  return (
    <div className="profile-layout">

      {/* Read-only identity card */}
      <Section title="Account Info" subtitle="These details are managed by your administrator.">
        <div className="profile-identity">
          <div className="profile-identity__avatar">
            {(user.name ?? user.username).charAt(0).toUpperCase()}
          </div>
          <div className="profile-identity__details">
            <span className="profile-identity__name">{user.name || user.username}</span>
            <span className="profile-identity__meta">@{user.username}</span>
            <div className="profile-identity__badges">
              <span className={`dash-badge ${user.role === 'Admin' ? 'dash-badge--admin' : 'dash-badge--member'}`}>
                {user.role}
              </span>
              <span className={`dash-badge ${user.status === 'Active' ? 'dash-badge--completed' : 'dash-badge--inactive'}`}>
                {user.status}
              </span>
            </div>
          </div>
        </div>
      </Section>

      {/* Editable profile info */}
      <Section title="Edit Profile" subtitle="Update your name, vocation, and email address.">
        <form onSubmit={handleProfileSave} className="profile-form">
          <div className="profile-form__grid">
            <Field label="Full Name">
              <input
                className="profile-form__input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Juan dela Cruz"
              />
            </Field>
            <Field label="Vocation">
              <input
                className="profile-form__input"
                type="text"
                value={vocation}
                onChange={(e) => setVocation(e.target.value)}
                placeholder="e.g. Engineer, Teacher"
              />
            </Field>
            <Field label="Email Address">
              <input
                className="profile-form__input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </Field>
          </div>
          {profileMsg && (
            <p className={profileMsg.type === 'success' ? 'dash-invite-form__success' : 'dash-invite-form__error'}>
              {profileMsg.text}
            </p>
          )}
          <button type="submit" className="profile-form__btn" disabled={profileLoading}>
            {profileLoading ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </Section>

      {/* Password change */}
      <Section title="Change Password" subtitle="Use a strong password of at least 8 characters.">
        <form onSubmit={handlePasswordChange} className="profile-form">
          <div className="profile-form__grid">
            <Field label="Current Password">
              <input
                className="profile-form__input"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                autoComplete="current-password"
              />
            </Field>
            <Field label="New Password">
              <input
                className="profile-form__input"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
            </Field>
            <Field label="Confirm New Password">
              <input
                className="profile-form__input"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                autoComplete="new-password"
              />
            </Field>
          </div>
          {passwordMsg && (
            <p className={passwordMsg.type === 'success' ? 'dash-invite-form__success' : 'dash-invite-form__error'}>
              {passwordMsg.text}
            </p>
          )}
          <button type="submit" className="profile-form__btn" disabled={passwordLoading}>
            {passwordLoading ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </Section>

    </div>
  );
}