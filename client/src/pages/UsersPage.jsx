// client/src/pages/UsersPage.jsx
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import '../styles/UsersPage.css';

// ── Helpers ────────────────────────────────────────────────────
const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

function formatDate(d) {
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function formatCreatedAt(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return `${MONTHS[d.getMonth()].slice(0,3)} ${d.getDate()}, ${d.getFullYear()}`;
}

function padUserId(id) {
  if (!id) return '—';
  return String(id).padStart(3, '0');
}

const ROLE_OPTIONS = ['All', 'admin', 'staff', 'cashier'];
const ROLE_LIST    = ['admin', 'staff', 'cashier'];

// ── Icons ──────────────────────────────────────────────────────
const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const ChevronDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const AlertTriangle = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
    <path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
  </svg>
);
const EditIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const EmptyIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="32" cy="24" r="10" />
    <path d="M8 56c0-13.3 10.7-24 24-24s24 10.7 24 24" />
  </svg>
);

// ── Skeleton Row ───────────────────────────────────────────────
const SkeletonRow = () => (
  <tr className="um-skeleton-row">
    {Array.from({ length: 7 }).map((_, i) => (
      <td key={i}><div className="um-skeleton-cell" /></td>
    ))}
  </tr>
);

// ── Role Badge ─────────────────────────────────────────────────
function RoleBadge({ role }) {
  const r = (role || '').toLowerCase();
  return <span className={`um-role-badge um-role-badge--${r}`}>{r.charAt(0).toUpperCase() + r.slice(1)}</span>;
}

// ── Role Filter Dropdown ───────────────────────────────────────
function RoleFilter({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const label = value === 'All' ? 'All' : value.charAt(0).toUpperCase() + value.slice(1);

  return (
    <div className="um-filter" ref={ref}>
      <button className="um-filter-btn" onClick={() => setOpen(v => !v)} type="button">
        <span>{label}</span>
        <ChevronDown />
      </button>
      {open && (
        <div className="um-filter-dropdown">
          {ROLE_OPTIONS.map(opt => (
            <button
              key={opt}
              className={`um-filter-option${value === opt ? ' um-filter-option--active' : ''}`}
              onClick={() => { onChange(opt); setOpen(false); }}
              type="button"
            >
              {opt === 'All' ? 'All' : opt.charAt(0).toUpperCase() + opt.slice(1)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Update User Modal ──────────────────────────────────────────
function UpdateModal({ target, onClose, onUpdated }) {
  const [form,    setForm]    = useState({
    full_name: target.full_name || '',
    username:  target.username  || '',
    email:     target.email     || '',
    role:      target.role      || 'staff',
    password:  '',
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`/api/users/${target.user_id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to update user.');
      onUpdated(json.user);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="um-modal-overlay" onClick={onClose}>
      <div className="um-modal" onClick={e => e.stopPropagation()}>
        <div className="um-modal-header">
          <h2 className="um-modal-title">Update User</h2>
          <button className="um-modal-close" onClick={onClose} type="button"><XIcon /></button>
        </div>

        <form className="um-modal-form" onSubmit={handleSubmit}>
          <label className="um-form-label">
            Full Name
            <input name="full_name" className="um-form-input" value={form.full_name} onChange={handleChange} required />
          </label>

          <label className="um-form-label">
            Username
            <input name="username" className="um-form-input" value={form.username} onChange={handleChange} required />
          </label>

          <label className="um-form-label">
            Email
            <input name="email" type="email" className="um-form-input" value={form.email} onChange={handleChange} required />
          </label>

          <label className="um-form-label">
            Role
            <select name="role" className="um-form-input um-form-select" value={form.role} onChange={handleChange} required>
              {ROLE_LIST.map(r => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>
          </label>

          <label className="um-form-label">
            New Password <span className="um-form-hint">(leave blank to keep current)</span>
            <input
              name="password"
              type="password"
              className="um-form-input"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </label>

          {error && (
            <div className="um-form-error">
              <AlertTriangle /> {error}
            </div>
          )}

          <div className="um-modal-actions">
            <button type="button" className="um-btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="um-btn-save" disabled={loading}>
              {loading ? 'Updating…' : 'Update User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete Confirm Modal ───────────────────────────────────────
function DeleteModal({ target, currentUserId, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // Guard: prevent self-delete even at UI layer
  const isSelf = parseInt(target.user_id) === parseInt(currentUserId);

  const handleDelete = async () => {
    if (isSelf) { setError('You cannot delete your own account.'); return; }
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`/api/users/${target.user_id}`, {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to delete user.');
      onDeleted(target.user_id);
      onClose();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="um-modal-overlay" onClick={onClose}>
      <div className="um-modal um-modal--delete" onClick={e => e.stopPropagation()}>
        <div className="um-modal-header">
          <h2 className="um-modal-title">Delete User</h2>
          <button className="um-modal-close" onClick={onClose} type="button"><XIcon /></button>
        </div>

        <div className="um-delete-body">
          <div className="um-delete-icon-wrap">
            <TrashIcon />
          </div>
          <p className="um-delete-msg">
            Are you sure you want to delete <strong>{target.full_name}</strong>?
            This action cannot be undone.
          </p>
        </div>

        {error && (
          <div className="um-form-error">
            <AlertTriangle /> {error}
          </div>
        )}

        <div className="um-modal-actions">
          <button type="button" className="um-btn-cancel" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="um-btn-delete"
            onClick={handleDelete}
            disabled={loading || isSelf}
          >
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────
export default function UsersPage({ user }) {
  const [users,       setUsers]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [search,      setSearch]      = useState('');
  const [roleFilter,  setRoleFilter]  = useState('All');
  const [updateTarget, setUpdateTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const today = new Date();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch users.');
      const json = await res.json();
      setUsers(json.users || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ── Optimistic update after edit ──
  const handleUpdated = (updatedUser) => {
    setUsers(prev => prev.map(u => u.user_id === updatedUser.user_id ? updatedUser : u));
  };

  // ── Optimistic remove after delete ──
  const handleDeleted = (deletedId) => {
    setUsers(prev => prev.filter(u => u.user_id !== deletedId));
  };

  // ── Client-side filter ──
  const filtered = useMemo(() => {
    let rows = users;
    if (roleFilter !== 'All') {
      rows = rows.filter(u => u.role === roleFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(u =>
        [u.full_name, u.username, u.email, u.role]
          .some(f => (f || '').toLowerCase().includes(q))
      );
    }
    return rows;
  }, [users, roleFilter, search]);

  return (
    <div className="um-page">

      {/* ── Greeting Bar ── */}
      <div className="um-greeting">
        <span className="um-greeting-text">
          Good Day! <strong>{user?.full_name?.split(' ')[0] || '...'}</strong>
        </span>
        <span className="um-greeting-date">{formatDate(today)}</span>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="um-error">
          <AlertTriangle /> {error}
          <button className="um-error-retry" onClick={fetchUsers}>Retry</button>
        </div>
      )}

      {/* ── Table Card ── */}
      <div className="um-card">

        {/* Card Header */}
        <div className="um-card-header">
          <span className="um-card-title">All Users</span>
          <div className="um-card-controls">
            <span className="um-filter-label">Role:</span>
            <RoleFilter value={roleFilter} onChange={setRoleFilter} />
          </div>
        </div>

        {/* Search */}
        <div className="um-search-wrap">
          <SearchIcon />
          <input
            type="text"
            className="um-search-input"
            placeholder="Search by name, username, email, or role…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="um-search-clear" onClick={() => setSearch('')} type="button">×</button>
          )}
        </div>

        {/* Table */}
        <div className="um-table-wrap">
          <table className="um-table">
            <thead>
              <tr>
                <th>USER ID</th>
                <th>FULL NAME</th>
                <th>USERNAME</th>
                <th>EMAIL</th>
                <th>ROLE</th>
                <th>CREATED AT</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="um-empty">
                      <EmptyIcon />
                      <span>
                        {search || roleFilter !== 'All'
                          ? 'No users match your filter.'
                          : 'No users found.'}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(u => (
                  <tr key={u.user_id} className={u.user_id === user?.id ? 'um-row--self' : ''}>
                    <td className="um-cell-id">{padUserId(u.user_id)}</td>
                    <td className="um-cell-name">{u.full_name}</td>
                    <td className="um-cell-username">@{u.username}</td>
                    <td className="um-cell-email">{u.email}</td>
                    <td><RoleBadge role={u.role} /></td>
                    <td className="um-cell-date">{formatCreatedAt(u.created_at)}</td>
                    <td className="um-cell-action">
                      <button
                        className="um-btn-update"
                        onClick={() => setUpdateTarget(u)}
                        title="Update user"
                        type="button"
                      >
                        <EditIcon /> Update
                      </button>
                      <button
                        className={`um-btn-delete-row${u.user_id === user?.id ? ' um-btn-delete-row--disabled' : ''}`}
                        onClick={() => { if (u.user_id !== user?.id) setDeleteTarget(u); }}
                        title={u.user_id === user?.id ? 'Cannot delete your own account' : 'Delete user'}
                        type="button"
                        disabled={u.user_id === user?.id}
                      >
                        <TrashIcon /> Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {!loading && !error && (
          <div className="um-card-footer">
            Showing <strong>{filtered.length}</strong> of <strong>{users.length}</strong> user{users.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* ── Update Modal ── */}
      {updateTarget && (
        <UpdateModal
          target={updateTarget}
          onClose={() => setUpdateTarget(null)}
          onUpdated={handleUpdated}
        />
      )}

      {/* ── Delete Modal ── */}
      {deleteTarget && (
        <DeleteModal
          target={deleteTarget}
          currentUserId={user?.id}
          onClose={() => setDeleteTarget(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
