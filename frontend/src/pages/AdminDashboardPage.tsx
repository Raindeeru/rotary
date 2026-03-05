import { useEffect, useState, FormEvent } from 'react';
import { AdminNavbar, AdminTab } from '../components/AdminNavbar';
import { ProfileTab } from '../components/ProfileTab';

const API_BASE = 'http://localhost:8000';

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

/* ── Projects tab ─────────────────────────────────────── */
type FullProject = {
  id: number;
  title: string;
  description: string;
  location: string;
  start_date: string;
  end_date: string;
  status: string;
  total_expenses: number;
  remaining_balance: number;
};

type Expense = {
  id: number;
  description: string;
  category: string;
  quantity: number;
  price: number;
  location: string;
  date_purchased: string;
};

type Financial = {
  project_id: number;
  project_budget: number;
  total_spent: number;
  remaining_balance: number;
  expenses: Expense[];
};

function StatusPill({ status }: { status: string }) {
  const cls = `proj-status proj-status--${status.toLowerCase()}`;
  return <span className={cls}>{status}</span>;
}

function ProjectsTab() {
  const [projects, setProjects] = useState<FullProject[]>([]);
  const [loading, setLoading] = useState(true);

  // Detail view
  const [selected, setSelected] = useState<FullProject | null>(null);
  const [detailTab, setDetailTab] = useState<'details' | 'finances'>('details');
  const [financial, setFinancial] = useState<Financial | null>(null);
  const [finLoading, setFinLoading] = useState(false);

  // Add modal
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ title: '', start_date: '', end_date: '', description: '', location: '', status: 'Planned' });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Edit modal
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', start_date: '', end_date: '', description: '', location: '', status: 'Planned', tagline: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Edit finances modal
  const [showEditFin, setShowEditFin] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [newExpense, setNewExpense] = useState({ description: '', category: '', quantity: '1', price: '', location: '', date_purchased: '' });
  const [expenseError, setExpenseError] = useState<string | null>(null);
  const [expenseLoading, setExpenseLoading] = useState(false);
  const [coverImg, setCoverImg] = useState<string | null>(() => {
    return localStorage.getItem('proj_cover_img') ?? null;
  });

  function getProjectImg(id: number): string | null {
    return localStorage.getItem(`proj_img_${id}`) ?? null;
  }

  function handleProjectImgUpload(id: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      localStorage.setItem(`proj_img_${id}`, result);
      // Force re-render
      setProjects(prev => [...prev]);
      if (selected?.id === id) setSelected(prev => prev ? { ...prev } : null);
    };
    reader.readAsDataURL(file);
  }

  async function loadProjects() {
    try {
      const res = await fetch(`${API_BASE}/projects/`);
      if (res.ok) setProjects(await res.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  useEffect(() => { loadProjects(); }, []);

  async function loadFinancial(id: number) {
    setFinLoading(true);
    setFinancial(null);
    try {
      const res = await fetch(`${API_BASE}/projects/${id}/financials/`, { headers: authHeaders() });
      if (res.ok) setFinancial(await res.json());
    } catch { /* ignore */ }
    finally { setFinLoading(false); }
  }

  function openProject(p: FullProject) {
    setSelected(p);
    setDetailTab('details');
    setFinancial(null);
  }

  function switchDetailTab(tab: 'details' | 'finances') {
    setDetailTab(tab);
    if (tab === 'finances' && selected && !financial) loadFinancial(selected.id);
  }

  async function handleAdd() {
    setAddError(null);
    if (!addForm.title.trim()) { setAddError('Title is required.'); return; }
    setAddLoading(true);
    try {
      const res = await fetch(`${API_BASE}/projects/`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: addForm.title,
          description: addForm.description,
          location: addForm.location || 'TBD',
          start_date: addForm.start_date ? new Date(addForm.start_date).toISOString() : new Date().toISOString(),
          end_date: addForm.end_date ? new Date(addForm.end_date).toISOString() : new Date().toISOString(),
          status: addForm.status,
        }),
      });
      if (!res.ok) { const b = await res.json(); throw new Error(b?.detail ?? 'Failed'); }
      setShowAdd(false);
      setAddForm({ title: '', start_date: '', end_date: '', description: '', location: '', status: 'Planned' });
      loadProjects();
    } catch (err) { setAddError(err instanceof Error ? err.message : 'Error'); }
    finally { setAddLoading(false); }
  }

  function openEdit() {
    if (!selected) return;
    setEditForm({
      title: selected.title,
      start_date: selected.start_date ? selected.start_date.slice(0, 10) : '',
      end_date: selected.end_date ? selected.end_date.slice(0, 10) : '',
      description: selected.description,
      location: selected.location,
      status: selected.status,
      tagline: (selected as any).tagline || '',
    });
    setEditError(null);
    setShowEdit(true);
  }

  async function handleEdit() {
    if (!selected) return;
    setEditError(null);
    setEditLoading(true);
    try {
      const res = await fetch(`${API_BASE}/projects/${selected.id}`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description,
          location: editForm.location,
          start_date: editForm.start_date ? new Date(editForm.start_date).toISOString() : undefined,
          end_date: editForm.end_date ? new Date(editForm.end_date).toISOString() : undefined,
          status: editForm.status,
        }),
      });
      if (!res.ok) { const b = await res.json(); throw new Error(b?.detail ?? 'Failed'); }
      setShowEdit(false);
      const updated = { ...selected, ...editForm };
      setSelected(updated);
      loadProjects();
    } catch (err) { setEditError(err instanceof Error ? err.message : 'Error'); }
    finally { setEditLoading(false); }
  }

  function openEditFinances() {
    if (!financial) return;
    setBudgetInput(String(financial.project_budget));
    setNewExpense({ description: '', category: '', quantity: '1', price: '', location: '', date_purchased: '' });
    setExpenseError(null);
    setShowEditFin(true);
  }

  async function handleSaveBudget() {
    if (!selected) return;
    try {
      await fetch(`${API_BASE}/projects/${selected.id}`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ budget: parseFloat(budgetInput) || 0 }),
      });
      loadFinancial(selected.id);
    } catch { /* ignore */ }
  }

  async function handleAddExpense() {
    if (!selected) return;
    setExpenseError(null);
    if (!newExpense.description.trim() || !newExpense.price) { setExpenseError('Description and price are required.'); return; }
    setExpenseLoading(true);
    try {
      const res = await fetch(`${API_BASE}/projects/${selected.id}/financials/`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: newExpense.description,
          category: newExpense.category || 'General',
          quantity: parseInt(newExpense.quantity) || 1,
          price: parseFloat(newExpense.price) || 0,
          location: newExpense.location || 'N/A',
          date_purchased: newExpense.date_purchased ? new Date(newExpense.date_purchased).toISOString() : new Date().toISOString(),
        }),
      });
      if (!res.ok) { const b = await res.json(); throw new Error(b?.detail ?? 'Failed'); }
      setNewExpense({ description: '', category: '', quantity: '1', price: '', location: '', date_purchased: '' });
      loadFinancial(selected.id);
    } catch (err) { setExpenseError(err instanceof Error ? err.message : 'Error'); }
    finally { setExpenseLoading(false); }
  }

  async function handleDeleteExpense(expenseId: number) {
    if (!selected) return;
    try {
      await fetch(`${API_BASE}/projects/${selected.id}/financials/${expenseId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      loadFinancial(selected.id);
    } catch { /* ignore */ }
  }

  // ── Detail view ──
  if (selected) {
    return (
      <div className="proj-detail">
        {/* Header banner */}
        <div
          className="proj-detail__banner"
          style={getProjectImg(selected.id) ? { backgroundImage: `url(${getProjectImg(selected.id)})` } : undefined}
        >
          <div className="proj-detail__banner-inner">
            <button className="proj-detail__back" onClick={() => setSelected(null)}>← Back</button>
            <div className="proj-detail__banner-info">
              <h1 className="proj-detail__banner-title">{selected.title}</h1>
            </div>
            <div className="proj-detail__banner-actions">
              <button className="proj-detail__edit-btn" onClick={openEdit}>Edit Details</button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="proj-detail__tabs">
          <button
            className={`proj-detail__tab${detailTab === 'details' ? ' proj-detail__tab--active' : ''}`}
            onClick={() => switchDetailTab('details')}
          >DETAILS</button>
          <button
            className={`proj-detail__tab${detailTab === 'finances' ? ' proj-detail__tab--active' : ''}`}
            onClick={() => switchDetailTab('finances')}
          >FINANCES</button>
        </div>

        {/* Content */}
        <div className="proj-detail__body">
          {detailTab === 'details' && (
            <div className="proj-detail__desc">
              <p>{selected.description || 'No description provided.'}</p>
              <div className="proj-detail__meta">
                <span><strong>Location:</strong> {selected.location}</span>
                <span><strong>Start:</strong> {selected.start_date ? new Date(selected.start_date).toLocaleDateString() : '—'}</span>
                <span><strong>End:</strong> {selected.end_date ? new Date(selected.end_date).toLocaleDateString() : '—'}</span>
                <span><strong>Status:</strong> <StatusPill status={selected.status} /></span>
              </div>
            </div>
          )}
          {detailTab === 'finances' && (
            finLoading ? <p className="dash-panel__empty">Loading financials…</p> :
            !financial ? <p className="dash-panel__empty">No financial data available.</p> : (
              <div className="proj-fin">
                <div className="proj-fin__header">
                  <button className="proj-fin__edit-btn" onClick={openEditFinances}>Edit Finances</button>
                </div>
                <div className="proj-fin__section">
                  <h3 className="proj-fin__section-title">BUDGET</h3>
                  <table className="dash-table">
                    <thead><tr><th>Source</th><th>Allocated Budget</th><th>Spent</th></tr></thead>
                    <tbody>
                      <tr>
                        <td>Total</td>
                        <td>₱{financial.project_budget.toLocaleString()}</td>
                        <td>₱{financial.total_spent.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="proj-fin__total">TOTAL <strong>₱{financial.project_budget.toLocaleString()}</strong></div>
                </div>
                <div className="proj-fin__section">
                  <h3 className="proj-fin__section-title">EXPENSES</h3>
                  {financial.expenses.length === 0 ? (
                    <p className="dash-panel__empty">No expenses recorded.</p>
                  ) : (
                    <table className="dash-table">
                      <thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Qty</th><th>Price</th><th>Location</th><th></th></tr></thead>
                      <tbody>
                        {financial.expenses.map((e) => (
                          <tr key={e.id}>
                            <td>{new Date(e.date_purchased).toLocaleDateString()}</td>
                            <td>{e.description}</td>
                            <td>{e.category}</td>
                            <td>{e.quantity}</td>
                            <td>₱{(e.price * e.quantity).toLocaleString()}</td>
                            <td>{e.location}</td>
                            <td>
                              <button className="proj-fin__delete-btn" onClick={() => handleDeleteExpense(e.id)} title="Delete">✕</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  <div className="proj-fin__total">TOTAL <strong>₱{financial.total_spent.toLocaleString()}</strong></div>
                </div>
              </div>
            )
          )}
        </div>

        {/* Edit Details modal */}
        {showEdit && (
          <div className="proj-modal-overlay" onClick={() => setShowEdit(false)}>
            <div className="proj-modal" onClick={(e) => e.stopPropagation()}>
              <h2 className="proj-modal__title">Edit Project</h2>
              <label className="proj-modal__label">Project Photo
                <div className="proj-modal__photo-upload">
                  {getProjectImg(selected.id) && (
                    <img src={getProjectImg(selected.id)!} className="proj-modal__photo-preview" alt="Project" />
                  )}
                  <label className="proj-modal__photo-btn">
                    {getProjectImg(selected.id) ? 'Change Photo' : 'Upload Photo'}
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleProjectImgUpload(selected.id, e)} />
                  </label>
                </div>
              </label>
              <label className="proj-modal__label">Project Title
                <input className="proj-modal__input" value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} />
              </label>
              <label className="proj-modal__label">Start Date
                <input className="proj-modal__input" type="date" value={editForm.start_date} onChange={e => setEditForm(f => ({ ...f, start_date: e.target.value }))} />
              </label>
              <label className="proj-modal__label">End Date
                <input className="proj-modal__input" type="date" value={editForm.end_date} onChange={e => setEditForm(f => ({ ...f, end_date: e.target.value }))} />
              </label>
              <label className="proj-modal__label">Status
                <select className="proj-modal__input" value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}>
                  <option>Planned</option><option>Ongoing</option><option>Completed</option>
                </select>
              </label>
              <label className="proj-modal__label">Description
                <textarea className="proj-modal__textarea" value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
              </label>
              {editError && <p className="proj-modal__error">{editError}</p>}
              <button className="proj-modal__save" onClick={handleEdit} disabled={editLoading}>
                {editLoading ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        )}

        {/* Edit Finances modal */}
        {showEditFin && (
          <div className="proj-modal-overlay" onClick={() => setShowEditFin(false)}>
            <div className="proj-modal proj-modal--wide" onClick={(e) => e.stopPropagation()}>
              <h2 className="proj-modal__title">Edit Finances</h2>

              <div className="proj-modal__section">
                <h3 className="proj-modal__section-title">Budget</h3>
                <div className="proj-modal__inline">
                  <label className="proj-modal__label" style={{ flex: 1 }}>Allocated Budget (₱)
                    <input className="proj-modal__input" type="number" value={budgetInput} onChange={e => setBudgetInput(e.target.value)} />
                  </label>
                  <button className="proj-modal__save" style={{ alignSelf: 'flex-end' }} onClick={handleSaveBudget}>Save Budget</button>
                </div>
              </div>

              <div className="proj-modal__section">
                <h3 className="proj-modal__section-title">Add Expense</h3>
                <div className="proj-modal__grid">
                  <label className="proj-modal__label">Description
                    <input className="proj-modal__input" placeholder="e.g. Tree seedlings" value={newExpense.description} onChange={e => setNewExpense(f => ({ ...f, description: e.target.value }))} />
                  </label>
                  <label className="proj-modal__label">Category
                    <input className="proj-modal__input" placeholder="e.g. Materials" value={newExpense.category} onChange={e => setNewExpense(f => ({ ...f, category: e.target.value }))} />
                  </label>
                  <label className="proj-modal__label">Qty
                    <input className="proj-modal__input" type="number" value={newExpense.quantity} onChange={e => setNewExpense(f => ({ ...f, quantity: e.target.value }))} />
                  </label>
                  <label className="proj-modal__label">Price per unit (₱)
                    <input className="proj-modal__input" type="number" value={newExpense.price} onChange={e => setNewExpense(f => ({ ...f, price: e.target.value }))} />
                  </label>
                  <label className="proj-modal__label">Location
                    <input className="proj-modal__input" placeholder="Where purchased" value={newExpense.location} onChange={e => setNewExpense(f => ({ ...f, location: e.target.value }))} />
                  </label>
                  <label className="proj-modal__label">Date
                    <input className="proj-modal__input" type="date" value={newExpense.date_purchased} onChange={e => setNewExpense(f => ({ ...f, date_purchased: e.target.value }))} />
                  </label>
                </div>
                {expenseError && <p className="proj-modal__error">{expenseError}</p>}
                <button className="proj-modal__save" onClick={handleAddExpense} disabled={expenseLoading}>
                  {expenseLoading ? 'Adding…' : '+ Add Expense'}
                </button>
              </div>

              <button className="proj-modal__close" onClick={() => setShowEditFin(false)}>Done</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Grid view ──
  function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setCoverImg(result);
      localStorage.setItem('proj_cover_img', result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="proj-grid-view">
      {/* Cover / Hero banner */}
      <div
        className="proj-cover"
        style={coverImg ? { backgroundImage: `url(${coverImg})` } : undefined}
      >
        {!coverImg && <div className="proj-cover__placeholder" />}
        <div className="proj-cover__content">
          <h1 className="proj-cover__title">PROJECTS</h1>
          <p className="proj-cover__sub">SHORT STATEMENT</p>
        </div>
        <label className="proj-cover__upload-btn" title="Upload cover photo">
          Change Cover
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCoverUpload} />
        </label>
      </div>

      {/* Grid */}
      <div className="proj-grid" style={{ marginTop: '1.5rem' }}>
        {/* Add card */}
        <button className="proj-card proj-card--add" onClick={() => setShowAdd(true)}>
          <span className="proj-card__add-icon">+</span>
          <span className="proj-card__add-label">Add a Project</span>
        </button>

        {loading ? (
          <div className="dash-loading">Loading…</div>
        ) : projects.map((p) => (
          <div key={p.id} className="proj-card" onClick={() => openProject(p)}>
            {getProjectImg(p.id) && (
              <div className="proj-card__img" style={{ backgroundImage: `url(${getProjectImg(p.id)})` }} />
            )}
            <div className="proj-card__title">{p.title}</div>
            <div className="proj-card__desc">{p.description}</div>
            <StatusPill status={p.status} />
          </div>
        ))}
      </div>

      {/* Add modal */}
      {showAdd && (
        <div className="proj-modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="proj-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="proj-modal__title">Add a Project</h2>
            <label className="proj-modal__label">Project Title
              <input className="proj-modal__input" placeholder="e.g. Tree Planting Drive" value={addForm.title} onChange={e => setAddForm(f => ({ ...f, title: e.target.value }))} />
            </label>
            <label className="proj-modal__label">Start Date
              <input className="proj-modal__input" type="date" value={addForm.start_date} onChange={e => setAddForm(f => ({ ...f, start_date: e.target.value }))} />
            </label>
            <label className="proj-modal__label">End Date
              <input className="proj-modal__input" type="date" value={addForm.end_date} onChange={e => setAddForm(f => ({ ...f, end_date: e.target.value }))} />
            </label>
            <label className="proj-modal__label">Description
              <textarea className="proj-modal__textarea" placeholder="Short description…" value={addForm.description} onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))} />
            </label>
            {addError && <p className="proj-modal__error">{addError}</p>}
            <button className="proj-modal__save" onClick={handleAdd} disabled={addLoading}>
              {addLoading ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}
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
            <ProjectsTab />
          )}
          {activeTab === 'events'   && <PlaceholderTab name="Events" />}
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