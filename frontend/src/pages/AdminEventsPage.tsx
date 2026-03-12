import { useEffect, useState } from 'react';
import { API_BASE } from '../lib/api';

function getToken() { return localStorage.getItem('rotary_access_token') ?? ''; }
function authHeaders() { return { Authorization: `Bearer ${getToken()}` }; }

const EVENT_TYPES = ['Meeting', 'Project Schedule', 'Induction Ceremony', 'Rescheduling Notice'];

type FullEvent = {
  id: number;
  title: string;
  description: string;
  date: string;
  event_type: string;
  admin_id: number | null;
  image_path?: string;
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

type EventFinancial = {
  event_id: number;
  total_spent: number;
  expenses: Expense[];
};

function getImageUrl(path?: string | null) {
  if (!path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_BASE}${path}`;
}

function TypePill({ type }: { type: string }) {
  const map: Record<string, string> = {
    'Meeting': 'event-type--meeting',
    'Project Schedule': 'event-type--project',
    'Induction Ceremony': 'event-type--induction',
    'Rescheduling Notice': 'event-type--reschedule',
  };
  return <span className={`event-type-pill ${map[type] ?? ''}`}>{type}</span>;
}

export function AdminEventsPage() {
  const [events, setEvents] = useState<FullEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Detail view
  const [selected, setSelected] = useState<FullEvent | null>(null);
  const [detailTab, setDetailTab] = useState<'details' | 'finances'>('details');
  const [financial, setFinancial] = useState<EventFinancial | null>(null);
  const [finLoading, setFinLoading] = useState(false);

  // Add modal
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ title: '', description: '', date: '', event_type: 'Meeting' });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Edit modal
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '', date: '', event_type: 'Meeting' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Edit finances modal
  const [showEditFin, setShowEditFin] = useState(false);
  const [newExpense, setNewExpense] = useState({ description: '', category: '', quantity: '1', price: '', location: '', date_purchased: '' });
  const [expenseError, setExpenseError] = useState<string | null>(null);
  const [expenseLoading, setExpenseLoading] = useState(false);

  const [coverImg, setCoverImg] = useState<string | null>(() => {
    return localStorage.getItem('events_cover_img') ?? null;
  });

  function getEventImg(id: number): string | null {
    return localStorage.getItem(`event_img_${id}`) ?? null;
  }

  async function handleEventImgUpload(id: number, e: React.ChangeEvent<HTMLInputElement>) {
      const file = e.target.files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);

      try {
          const res = await fetch(`${API_BASE}/events/${id}/image`, {
              method: 'PUT',
              headers: authHeaders(), // Browser sets Content-Type for FormData
                  body: formData,
          });

          if (!res.ok) {
              const errorData = await res.json();
              throw new Error(errorData.detail || 'Upload failed');
          }

          const data = await res.json();
          // Support both raw string or object responses
          const finalPath = typeof data === 'string' ? data : data.image_path;

          // Update local state
          setEvents(prev => prev.map(ev => ev.id === id ? { ...ev, image_path: finalPath } : ev));
          if (selected?.id === id) {
              setSelected(prev => prev ? { ...prev, image_path: finalPath } : null);
          }

          alert("Event image updated!");
      } catch (err) {
          alert(err instanceof Error ? err.message : 'Error uploading image');
      }
  }
  async function loadEvents() {
    try {
      const res = await fetch(`${API_BASE}/events/`, { headers: authHeaders() });
      if (res.ok) setEvents(await res.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  useEffect(() => { loadEvents(); }, []);

  async function loadFinancial(id: number) {
    setFinLoading(true);
    setFinancial(null);
    try {
      const res = await fetch(`${API_BASE}/events/${id}/financials`, { headers: authHeaders() });
      if (res.ok) setFinancial(await res.json());
    } catch { /* ignore */ }
    finally { setFinLoading(false); }
  }

  function openEvent(ev: FullEvent) {
    setSelected(ev);
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
    if (!addForm.date) { setAddError('Date is required.'); return; }
    setAddLoading(true);
    try {
      const res = await fetch(`${API_BASE}/events/`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: addForm.title,
          description: addForm.description,
          date: new Date(addForm.date).toISOString(),
          event_type: addForm.event_type,
        }),
      });
      if (!res.ok) { const b = await res.json(); throw new Error(b?.detail ?? 'Failed'); }
      setShowAdd(false);
      setAddForm({ title: '', description: '', date: '', event_type: 'Meeting' });
      loadEvents();
    } catch (err) { setAddError(err instanceof Error ? err.message : 'Error'); }
    finally { setAddLoading(false); }
  }

  function openEdit() {
    if (!selected) return;
    setEditForm({
      title: selected.title,
      description: selected.description,
      date: selected.date ? selected.date.slice(0, 16) : '',
      event_type: selected.event_type,
    });
    setEditError(null);
    setShowEdit(true);
  }

  async function handleEdit() {
    if (!selected) return;
    setEditError(null);
    setEditLoading(true);
    try {
      const res = await fetch(`${API_BASE}/events/${selected.id}`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description,
          date: editForm.date ? new Date(editForm.date).toISOString() : undefined,
          event_type: editForm.event_type,
        }),
      });
      if (!res.ok) { const b = await res.json(); throw new Error(b?.detail ?? 'Failed'); }
      setShowEdit(false);
      setSelected({ ...selected, ...editForm });
      loadEvents();
    } catch (err) { setEditError(err instanceof Error ? err.message : 'Error'); }
    finally { setEditLoading(false); }
  }

  async function handleDelete() {
    if (!selected) return;
    if (!confirm(`Delete "${selected.title}"?`)) return;
    try {
      await fetch(`${API_BASE}/events/${selected.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      setSelected(null);
      loadEvents();
    } catch { /* ignore */ }
  }

  function openEditFinances() {
    setNewExpense({ description: '', category: '', quantity: '1', price: '', location: '', date_purchased: '' });
    setExpenseError(null);
    setShowEditFin(true);
  }

  async function handleAddExpense() {
    if (!selected) return;
    setExpenseError(null);
    if (!newExpense.description.trim() || !newExpense.price) { setExpenseError('Description and price are required.'); return; }
    setExpenseLoading(true);
    try {
      const res = await fetch(`${API_BASE}/events/${selected.id}/financials`, {
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
      await fetch(`${API_BASE}/events/${selected.id}/financials/${expenseId}`, {
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
        <div
          className="proj-detail__banner"
          style={selected.image_path ? { backgroundImage: `url(${getImageUrl(selected.image_path)})` } : undefined}
        >
          <div className="proj-detail__banner-inner">
            <button className="proj-detail__back" onClick={() => setSelected(null)}>← Back</button>
            <div className="proj-detail__banner-info">
              <h1 className="proj-detail__banner-title">{selected.title}</h1>
            </div>
            <div className="proj-detail__banner-actions">
              <button className="proj-detail__edit-btn" onClick={openEdit}>Edit Event</button>
            </div>
          </div>
        </div>

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

        <div className="proj-detail__body">
          {detailTab === 'details' && (
            <div className="proj-detail__desc">
              <p>{selected.description || 'No description provided.'}</p>
              <div className="proj-detail__meta">
                <span><strong>Date:</strong> {new Date(selected.date).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                <span><strong>Type:</strong> <TypePill type={selected.event_type} /></span>
              </div>
              <button
                className="proj-fin__delete-btn"
                style={{ marginTop: '1.5rem', color: '#b91c1c', fontSize: '0.82rem', border: '1px solid #fca5a5', borderRadius: '0.4rem', padding: '0.4rem 0.9rem' }}
                onClick={handleDelete}
              >
                Delete Event
              </button>
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
              <h2 className="proj-modal__title">Edit Event</h2>
              <label className="proj-modal__label">Event Photo
                <div className="proj-modal__photo-upload">
                  {selected.image_path && (
                      <img src={getImageUrl(selected.image_path)} className="proj-modal__photo-preview" alt="Event" />
                  )}
                  <label className="proj-modal__photo-btn">
                    {getEventImg(selected.id) ? 'Change Photo' : 'Upload Photo'}
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleEventImgUpload(selected.id, e)} />
                  </label>
                </div>
              </label>
              <label className="proj-modal__label">Event Title
                <input className="proj-modal__input" value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} />
              </label>
              <label className="proj-modal__label">Date & Time
                <input className="proj-modal__input" type="datetime-local" value={editForm.date} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} />
              </label>
              <label className="proj-modal__label">Event Type
                <select className="proj-modal__input" value={editForm.event_type} onChange={e => setEditForm(f => ({ ...f, event_type: e.target.value }))}>
                  {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
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
                <h3 className="proj-modal__section-title">Add Expense</h3>
                <div className="proj-modal__grid">
                  <label className="proj-modal__label">Description
                    <input className="proj-modal__input" placeholder="e.g. Venue rental" value={newExpense.description} onChange={e => setNewExpense(f => ({ ...f, description: e.target.value }))} />
                  </label>
                  <label className="proj-modal__label">Category
                    <input className="proj-modal__input" placeholder="e.g. Logistics" value={newExpense.category} onChange={e => setNewExpense(f => ({ ...f, category: e.target.value }))} />
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
              <div className="proj-modal__actions" style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="proj-modal__close"
                  onClick={() => setShowEditFin(false)}
                  style={{ background: '#f3f4f6', borderColor: '#e5e7eb', color: '#374151' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="proj-modal__close"
                  onClick={() => setShowEditFin(false)}
                >
                  Done
                </button>
              </div>
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
      localStorage.setItem('events_cover_img', result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="proj-grid-view">
      <div
        className="proj-cover"
        style={coverImg ? { backgroundImage: `url(${coverImg})` } : undefined}
      >
        {!coverImg && <div className="proj-cover__placeholder" />}
        <div className="proj-cover__content">
          <h1 className="proj-cover__title">EVENTS</h1>
        </div>
        <label className="proj-cover__upload-btn" title="Upload cover photo">
          Change Cover
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCoverUpload} />
        </label>
      </div>

      <div className="proj-grid" style={{ marginTop: '1.5rem' }}>
        <button className="proj-card proj-card--add" onClick={() => setShowAdd(true)}>
          <span className="proj-card__add-icon">+</span>
          <span className="proj-card__add-label">Add an Event</span>
        </button>

        {loading ? (
          <div className="dash-loading">Loading…</div>
        ) : events.map((ev) => (
          <div key={ev.id} className="proj-card" onClick={() => openEvent(ev)}>
            {ev.image_path && (
                <div className="proj-card__img" style={{ backgroundImage: `url(${getImageUrl(ev.image_path)})` }} />
            )}
            <div className="proj-card__title">{ev.title}</div>
            <div className="proj-card__desc">
              {new Date(ev.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
            <TypePill type={ev.event_type} />
          </div>
        ))}
      </div>

      {/* Add modal */}
      {showAdd && (
        <div className="proj-modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="proj-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="proj-modal__title">Add an Event</h2>
            <label className="proj-modal__label">Event Title
              <input className="proj-modal__input" placeholder="e.g. March General Assembly" value={addForm.title} onChange={e => setAddForm(f => ({ ...f, title: e.target.value }))} />
            </label>
            <label className="proj-modal__label">Date & Time
              <input className="proj-modal__input" type="datetime-local" value={addForm.date} onChange={e => setAddForm(f => ({ ...f, date: e.target.value }))} />
            </label>
            <label className="proj-modal__label">Event Type
              <select className="proj-modal__input" value={addForm.event_type} onChange={e => setAddForm(f => ({ ...f, event_type: e.target.value }))}>
                {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </label>
            <label className="proj-modal__label">Description
              <textarea className="proj-modal__textarea" placeholder="Brief description…" value={addForm.description} onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))} />
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
