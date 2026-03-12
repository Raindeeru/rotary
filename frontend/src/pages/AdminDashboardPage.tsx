import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { AdminNavbar } from '../components/AdminNavbar';
import type { AdminTab } from '../components/AdminNavbar';
import { ProfileTab } from '../components/ProfileTab';
import { AdminProjectsPage } from './AdminProjectsPage';
import { AdminEventsPage } from './AdminEventsPage';
import { AboutPage } from './AboutPage';
import { API_BASE } from '../lib/api';

type Tab = AdminTab;

type Stats = { members: number; projects: number; events: number };
type Project = { id: number; title: string; status: string; total_expenses: number; remaining_balance: number };
type Event = { id: number; title: string; date: string; event_type: string };
type Member = { id: number; username: string; name: string; email: string; role: string; status: string; vocation: string };

function getToken() { return localStorage.getItem('rotary_access_token') ?? ''; }
function authHeaders() { return { Authorization: `Bearer ${getToken()}` }; }

/* ── Stat card ────────────────────────────────────────── */
function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="dash-stat">
      <span className="dash-stat__value">{value}</span>
      <span className="dash-stat__label">{label}</span>
      {sub && <span className="dash-stat__sub">{sub}</span>}
    </div>
  );
}

/* ── Home tab ─────────────────────────────────────────── */
function HomeTab() {
  const [stats, setStats] = useState<Stats>({ members: 0, projects: 0, events: 0 });
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [membersRes, projectsRes, eventsRes] = await Promise.all([
          fetch(`${API_BASE}/members/`, { headers: authHeaders() }),
          fetch(`${API_BASE}/projects/`),
          fetch(`${API_BASE}/events/`, { headers: authHeaders() }),
        ]);
        const members = membersRes.ok ? await membersRes.json() : [];
        const projects: Project[] = projectsRes.ok ? await projectsRes.json() : [];
        const events: Event[] = eventsRes.ok ? await eventsRes.json() : [];
        setStats({ members: members.length, projects: projects.length, events: events.length });
        setRecentProjects(projects.slice(0, 3));
        setUpcomingEvents(events.slice(0, 3));
      } catch { /* silently fail */ }
      finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) return <div className="dash-loading">Loading…</div>;

  return (
    <div className="dash-home">
      <div className="dash-stats-row">
        <StatCard label="Members" value={stats.members} sub="Active members" />
        <StatCard label="Projects" value={stats.projects} sub="All projects" />
        <StatCard label="Events" value={stats.events} sub="Scheduled events" />
      </div>
      <div className="dash-overview">
        <div className="dash-panel">
          <h3 className="dash-panel__title">Recent Projects</h3>
          {recentProjects.length === 0 ? (
            <p className="dash-panel__empty">No projects yet.</p>
          ) : (
            <table className="dash-table">
              <thead><tr><th>Title</th><th>Status</th><th>Remaining</th></tr></thead>
              <tbody>
                {recentProjects.map((p) => (
                  <tr key={p.id}>
                    <td>{p.title}</td>
                    <td><span className={`dash-badge dash-badge--${p.status.toLowerCase()}`}>{p.status}</span></td>
                    <td>₱{p.remaining_balance.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="dash-panel">
          <h3 className="dash-panel__title">Upcoming Events</h3>
          {upcomingEvents.length === 0 ? (
            <p className="dash-panel__empty">No events scheduled.</p>
          ) : (
            <ul className="dash-event-list">
              {upcomingEvents.map((e) => (
                <li key={e.id} className="dash-event-item">
                  <div className="dash-event-item__date">
                    {new Date(e.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="dash-event-item__info">
                    <span className="dash-event-item__title">{e.title}</span>
                    <span className="dash-event-item__type">{e.event_type}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Members tab ──────────────────────────────────────── */
function MembersTab() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite form state
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Member');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);

  // Edit modal state
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editFormData, setEditFormData] = useState({ name: '', email: '', role: '', status: '', vocation: '' });
  const [editError, setEditError] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function loadMembers() {
    try {
      const res = await fetch(`${API_BASE}/members/`, { headers: authHeaders() });
      if (res.ok) setMembers(await res.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  useEffect(() => { loadMembers(); }, []);

  async function handleInvite(e: FormEvent) {
    e.preventDefault();
    setInviteError(null);
    setInviteSuccess(null);

    if (!username.trim() || !email.trim()) {
      setInviteError('Username and email are required.');
      return;
    }

    setInviteLoading(true);
    try {
      const query = new URLSearchParams({ username: username.trim(), email: email.trim(), role });
      const res = await fetch(`${API_BASE}/members/invite?${query}`, {
        method: 'POST',
        headers: authHeaders(),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body?.detail ?? `Error ${res.status}`);
      }

      const data = await res.json();
      setInviteSuccess(
        `✓ Invited ${username}. Temporary password: "${data.temporary_password}" — share this with the new member.`
      );
      setUsername('');
      setEmail('');
      setRole('Member');
      loadMembers(); // refresh the list
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Failed to invite member.');
    } finally {
      setInviteLoading(false);
    }
  }

  function openEditModal(member: Member) {
    setEditingMember(member);
    setEditFormData({
      name: member.name || '',
      email: member.email,
      role: member.role,
      status: member.status,
      vocation: member.vocation || '',
    });
    setEditError(null);
  }

  function closeEditModal() {
    setEditingMember(null);
    setEditFormData({ name: '', email: '', role: '', status: '', vocation: '' });
    setEditError(null);
  }

  async function handleEditSave(e: FormEvent) {
    e.preventDefault();
    if (!editingMember) return;

    setEditError(null);
    setEditLoading(true);

    try {
      const res = await fetch(`${API_BASE}/members/${editingMember.id}`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body?.detail ?? `Error ${res.status}`);
      }

      await loadMembers();
      closeEditModal();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update member.');
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDelete(memberId: number) {
    setDeleteLoading(true);
    try {
      const res = await fetch(`${API_BASE}/members/${memberId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body?.detail ?? `Error ${res.status}`);
      }

      await loadMembers();
      setDeleteConfirmId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete member.');
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="dash-members">
      {/* Invite form */}
      <div className="dash-panel" style={{ marginBottom: '1.5rem' }}>
        <h3 className="dash-panel__title">Invite New Member</h3>
        <form onSubmit={handleInvite} className="dash-invite-form">
          <div className="dash-invite-form__row">
            <div className="dash-invite-form__field">
              <label className="dash-invite-form__label">Username</label>
              <input
                className="dash-invite-form__input"
                type="text"
                placeholder="e.g. jdelacruz"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="dash-invite-form__field">
              <label className="dash-invite-form__label">Email</label>
              <input
                className="dash-invite-form__input"
                type="email"
                placeholder="member@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="dash-invite-form__field dash-invite-form__field--sm">
              <label className="dash-invite-form__label">Role</label>
              <select
                className="dash-invite-form__input"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="Member">Member</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <button
              type="submit"
              className="dash-invite-form__btn"
              disabled={inviteLoading}
            >
              {inviteLoading ? 'Inviting…' : 'Send Invite'}
            </button>
          </div>
          {inviteError && <p className="dash-invite-form__error">{inviteError}</p>}
          {inviteSuccess && <p className="dash-invite-form__success">{inviteSuccess}</p>}
        </form>
      </div>

      {/* Members table */}
      <div className="dash-panel">
        <h3 className="dash-panel__title">All Members</h3>
        {loading ? (
          <p className="dash-panel__empty">Loading…</p>
        ) : members.length === 0 ? (
          <p className="dash-panel__empty">No members found.</p>
        ) : (
          <table className="dash-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Vocation</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td>{m.name || '—'}</td>
                  <td style={{ color: '#6b7280' }}>{m.username}</td>
                  <td>{m.email}</td>
                  <td>
                    <span className={`dash-badge ${m.role === 'Admin' ? 'dash-badge--admin' : 'dash-badge--member'}`}>
                      {m.role}
                    </span>
                  </td>
                  <td>
                    <span className={`dash-badge ${m.status === 'Active' ? 'dash-badge--completed' : 'dash-badge--inactive'}`}>
                      {m.status}
                    </span>
                  </td>
                  <td style={{ color: '#6b7280' }}>{m.vocation || '—'}</td>
                  <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                    <button
                      onClick={() => openEditModal(m)}
                      className="dash-member-btn dash-member-btn--edit"
                      title="Edit member"
                      style={{ marginRight: '0.5rem' }}
                    >
                      Edit
                    </button>
                    {deleteConfirmId === m.id ? (
                      <>
                        <button
                          onClick={() => handleDelete(m.id)}
                          disabled={deleteLoading}
                          className="dash-member-btn dash-member-btn--confirm"
                          style={{ marginRight: '0.5rem' }}
                        >
                          {deleteLoading ? '…' : 'Confirm'}
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="dash-member-btn dash-member-btn--cancel"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(m.id)}
                        className="dash-member-btn dash-member-btn--delete"
                        title="Delete member"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Modal */}
      {editingMember && (
        <div className="dash-modal-overlay" onClick={closeEditModal}>
          <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="dash-modal__title">Edit Member</h2>
            <form onSubmit={handleEditSave} className="dash-modal__form">
              <div className="dash-modal__field">
                <label className="dash-modal__label">Full name</label>
                <input
                  type="text"
                  className="dash-modal__input"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  placeholder="Full Name"
                />
              </div>
              <div className="dash-modal__field">
                <label className="dash-modal__label">Email Address</label>
                <input
                  type="email"
                  className="dash-modal__input"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  placeholder="Email"
                />
              </div>
              <div className="dash-modal__field">
                <label className="dash-modal__label">Role</label>
                <select
                  className="dash-modal__input"
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                >
                  <option value="Member">Member</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div className="dash-modal__field">
                <label className="dash-modal__label">Status</label>
                <select
                  className="dash-modal__input"
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="dash-modal__field">
                <label className="dash-modal__label">Vocation</label>
                <input
                  type="text"
                  className="dash-modal__input"
                  value={editFormData.vocation}
                  onChange={(e) => setEditFormData({ ...editFormData, vocation: e.target.value })}
                  placeholder="e.g. Engineer, Teacher, Doctor"
                />
              </div>
              {editError && <p className="dash-modal__error">{editError}</p>}
              <div className="dash-modal__actions">
                <button type="submit" className="dash-modal__save" disabled={editLoading}>
                  {editLoading ? 'Saving…' : 'Save'}
                </button>
                <button type="button" className="dash-modal__cancel" onClick={closeEditModal}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Placeholder tab ──────────────────────────────────── */
// function PlaceholderTab({ name }: { name: string }) {
//   return (
//     <div className="dash-placeholder">
//       <span className="dash-placeholder__icon">🚧</span>
//       <h2 className="dash-placeholder__title">{name}</h2>
//       <p className="dash-placeholder__sub">This section is coming soon.</p>
//     </div>
//   );
// }

/* ── Main dashboard ───────────────────────────────────── */
export function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('home');

  return (
    <div className="dash-layout">
      <AdminNavbar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="dash-content">
        <div className="dashboard">
          {activeTab === 'home' && (
            <>
              <h1 className="dashboard__title">Dashboard</h1>
              <p className="dashboard__subtitle">Welcome back, Admin. Here's what's happening.</p>
              <HomeTab />
            </>
          )}
          {activeTab === 'members' && (
            <>
              <h1 className="dashboard__title">Members</h1>
              <p className="dashboard__subtitle">Manage club members and send invitations.</p>
              <MembersTab />
            </>
          )}
          {activeTab === 'projects' && (
            <AdminProjectsPage />
          )}
          {activeTab === 'events' && (
            <AdminEventsPage />
          )}
          {activeTab === 'about' && (
            <AboutPage />
          )}
          {activeTab === 'profile'  && (
            <>
              <h1 className="dashboard__title">Profile</h1>
              <p className="dashboard__subtitle">Manage your personal information and password.</p>
              <ProfileTab />
            </>
          )}
        </div>
      </main>
    </div>
  );
}