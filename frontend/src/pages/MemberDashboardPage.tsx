import { useEffect, useState } from 'react';
import { MemberNavbar, MemberTab } from '../components/MemberNavbar';
import { ProfileTab } from '../components/ProfileTab';

const API_BASE = 'http://localhost:8000';

function getToken() { return localStorage.getItem('rotary_access_token') ?? ''; }
function authHeaders() { return { Authorization: `Bearer ${getToken()}` }; }

type Project = {
  id: number;
  title: string;
  description: string;
  location: string;
  status: string;
  start_date: string;
  end_date: string;
};

type Event = {
  id: number;
  title: string;
  description: string;
  date: string;
  event_type: string;
};

type Member = {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  status: string;
  vocation: string;
};

/* ── Status badge ─────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const cls = {
    planned:   'dash-badge--planned',
    ongoing:   'dash-badge--ongoing',
    completed: 'dash-badge--completed',
    meeting:   'dash-badge--member',
    'project schedule': 'dash-badge--ongoing',
    'induction ceremony': 'dash-badge--admin',
    'rescheduling notice': 'dash-badge--inactive',
  }[status.toLowerCase()] ?? '';
  return <span className={`dash-badge ${cls}`}>{status}</span>;
}

/* ── Home tab ─────────────────────────────────────────── */
function HomeTab() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [projectsRes, eventsRes] = await Promise.all([
          fetch(`${API_BASE}/projects/`),
          fetch(`${API_BASE}/events/`, { headers: authHeaders() }),
        ]);
        if (projectsRes.ok) setProjects(await projectsRes.json());
        if (eventsRes.ok) setEvents(await eventsRes.json());
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) return <div className="dash-loading">Loading…</div>;

  return (
    <div className="dash-home">
      <div className="dash-overview">
        {/* Recent projects — no budget info */}
        <div className="dash-panel">
          <h3 className="dash-panel__title">Recent Projects</h3>
          {projects.length === 0 ? (
            <p className="dash-panel__empty">No projects yet.</p>
          ) : (
            <table className="dash-table">
              <thead><tr><th>Title</th><th>Location</th><th>Status</th></tr></thead>
              <tbody>
                {projects.slice(0, 5).map((p) => (
                  <tr key={p.id}>
                    <td>{p.title}</td>
                    <td style={{ color: '#6b7280' }}>{p.location}</td>
                    <td><StatusBadge status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Upcoming events */}
        <div className="dash-panel">
          <h3 className="dash-panel__title">Upcoming Events</h3>
          {events.length === 0 ? (
            <p className="dash-panel__empty">No events scheduled.</p>
          ) : (
            <ul className="dash-event-list">
              {events.slice(0, 5).map((e) => (
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

/* ── Projects tab ─────────────────────────────────────── */
function ProjectsTab() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/projects/`)
      .then((r) => r.json()).then(setProjects)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="dash-panel">
      <h3 className="dash-panel__title">All Projects</h3>
      {loading ? (
        <p className="dash-panel__empty">Loading…</p>
      ) : projects.length === 0 ? (
        <p className="dash-panel__empty">No projects found.</p>
      ) : (
        <table className="dash-table">
          <thead>
            <tr><th>Title</th><th>Description</th><th>Location</th><th>Start</th><th>End</th><th>Status</th></tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id}>
                <td style={{ fontWeight: 500 }}>{p.title}</td>
                <td style={{ color: '#6b7280', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description}</td>
                <td style={{ color: '#6b7280' }}>{p.location}</td>
                <td style={{ color: '#6b7280' }}>{new Date(p.start_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                <td style={{ color: '#6b7280' }}>{new Date(p.end_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                <td><StatusBadge status={p.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

/* ── Events tab ───────────────────────────────────────── */
function EventsTab() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/events/`, { headers: authHeaders() })
      .then((r) => r.json()).then(setEvents)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="dash-panel">
      <h3 className="dash-panel__title">All Events</h3>
      {loading ? (
        <p className="dash-panel__empty">Loading…</p>
      ) : events.length === 0 ? (
        <p className="dash-panel__empty">No events found.</p>
      ) : (
        <table className="dash-table">
          <thead>
            <tr><th>Title</th><th>Description</th><th>Date</th><th>Type</th></tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id}>
                <td style={{ fontWeight: 500 }}>{e.title}</td>
                <td style={{ color: '#6b7280' }}>{e.description}</td>
                <td style={{ color: '#6b7280', whiteSpace: 'nowrap' }}>
                  {new Date(e.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
                <td><StatusBadge status={e.event_type} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

/* ── Members tab - FR-20: Full directory with vocation search ── */
function MembersTab() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadMembers();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadMembers();
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  async function loadMembers() {
    try {
      const url = searchTerm
        ? `${API_BASE}/members/?vocation=${encodeURIComponent(searchTerm)}`
        : `${API_BASE}/members/`;
      const res = await fetch(url, { headers: authHeaders() });
      if (res.ok) setMembers(await res.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  return (
    <div className="dash-members">
      {/* Search */}
      <div className="dash-panel" style={{ marginBottom: '1.5rem' }}>
        <h3 className="dash-panel__title">Search Members</h3>
        <div style={{ maxWidth: '400px' }}>
          <input
            type="text"
            placeholder="Search by vocation (e.g. Engineer, Teacher)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.55rem 0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              fontSize: '0.88rem',
              color: '#111',
              fontFamily: 'inherit',
              outline: 'none',
              transition: 'border-color 0.14s, box-shadow 0.14s',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#111';
              e.target.style.boxShadow = '0 0 0 2px rgba(17,17,17,0.08)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#d1d5db';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>
      </div>

      {/* Members table */}
      <div className="dash-panel">
        <h3 className="dash-panel__title">Member Directory</h3>
        {loading ? (
          <p className="dash-panel__empty">Loading…</p>
        ) : members.length === 0 ? (
          <p className="dash-panel__empty">
            {searchTerm ? 'No members found matching your search.' : 'No members found.'}
          </p>
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ── Placeholder tab ──────────────────────────────────── */
function PlaceholderTab({ name }: { name: string }) {
  return (
    <div className="dash-placeholder">
      <span className="dash-placeholder__icon">🚧</span>
      <h2 className="dash-placeholder__title">{name}</h2>
      <p className="dash-placeholder__sub">This section is coming soon.</p>
    </div>
  );
}

/* ── Main member dashboard ────────────────────────────── */
export function MemberDashboardPage() {
  const [activeTab, setActiveTab] = useState<MemberTab>('home');

  return (
    <div className="dash-layout">
      <MemberNavbar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="dash-content">
        <div className="dashboard">
          {activeTab === 'home' && (
            <>
              <h1 className="dashboard__title">Welcome</h1>
              <p className="dashboard__subtitle">Here's a summary of the club's latest activity.</p>
              <HomeTab />
            </>
          )}          {activeTab === 'members' && (
            <>
              <h1 className="dashboard__title">Members</h1>
              <p className="dashboard__subtitle">View the complete member directory and search by vocation.</p>
              <MembersTab />
            </>
          )}          {activeTab === 'projects' && (
            <>
              <h1 className="dashboard__title">Projects</h1>
              <p className="dashboard__subtitle">All ongoing and completed club projects.</p>
              <ProjectsTab />
            </>
          )}
          {activeTab === 'events' && (
            <>
              <h1 className="dashboard__title">Events</h1>
              <p className="dashboard__subtitle">Upcoming and past club events.</p>
              <EventsTab />
            </>
          )}
          {activeTab === 'profile' && (
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