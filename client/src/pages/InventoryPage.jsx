// client/src/pages/InventoryPage.jsx
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import '../styles/InventoryPage.css';

// ── Helpers ────────────────────────────────────────────────────
const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

function formatDate(d) {
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function formatDateShort(val) {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d)) return '—';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDateTime(val) {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d)) return '—';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day} ${h}:${min}`;
}

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

const AlertTriangle = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const InventoryEmptyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
    <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
    <line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>
  </svg>
);

// ── Skeleton Row ───────────────────────────────────────────────
const SkeletonStockRow = () => (
  <tr>
    {[70, 120, 60, 90, 90, 70].map((w, i) => (
      <td key={i} style={{ padding: '13px 14px' }}>
        <div className="inv-skeleton-cell" style={{ width: w }} />
      </td>
    ))}
  </tr>
);

const SkeletonLogRow = () => (
  <tr>
    {[60, 70, 80, 70, 110, 90].map((w, i) => (
      <td key={i} style={{ padding: '13px 14px' }}>
        <div className="inv-skeleton-cell" style={{ width: w }} />
      </td>
    ))}
  </tr>
);

// ── Filter Dropdown ────────────────────────────────────────────
function FilterDropdown({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="inv-filter" ref={ref}>
      <button className="inv-filter-btn" onClick={() => setOpen(v => !v)} type="button">
        <span>{value}</span>
        <ChevronDown />
      </button>
      {open && (
        <div className="inv-filter-dropdown">
          {options.map(opt => (
            <button
              key={opt}
              className={`inv-filter-option${value === opt ? ' inv-filter-option--active' : ''}`}
              onClick={() => { onChange(opt); setOpen(false); }}
              type="button"
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Update Inventory Modal ─────────────────────────────────────
function UpdateInventoryModal({ record, user, onClose, onUpdated, onDeleted }) {
  const [form, setForm] = useState({
    quantity:            String(record.quantity ?? 0),
    low_stock_threshold: String(record.low_stock_threshold ?? 0),
  });
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [showDelete,   setShowDelete]   = useState(false);
  const [deleting,     setDeleting]     = useState(false);
  const [deleteError,  setDeleteError]  = useState('');

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const qty = parseInt(form.quantity, 10);
    const thr = parseInt(form.low_stock_threshold, 10);
    if (isNaN(qty) || qty < 0)  { setError('Quantity must be a valid non-negative integer.'); return; }
    if (isNaN(thr) || thr < 0)  { setError('Low stock threshold must be a valid non-negative integer.'); return; }

    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`/api/inventory/${record.inventory_id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ quantity: qty, low_stock_threshold: thr }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to update inventory.');
      onUpdated(json.inventory);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`/api/inventory/${record.inventory_id}`, {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to delete inventory record.');
      onDeleted(record.inventory_id);
      onClose();
    } catch (err) {
      setDeleteError(err.message);
      setDeleting(false);
    }
  };

  if (showDelete) {
    return (
      <div className="inv-modal-overlay" onClick={onClose}>
        <div className="inv-modal inv-modal--delete" onClick={e => e.stopPropagation()}>
          <div className="inv-modal-header">
            <h2 className="inv-modal-title">Delete Record</h2>
            <button className="inv-modal-close" onClick={onClose} type="button"><XIcon /></button>
          </div>

          <div className="inv-delete-body">
            <div className="inv-delete-icon-wrap"><TrashIcon /></div>
            <p className="inv-delete-msg">
              Are you sure you want to delete the inventory record for{' '}
              <strong>{record.product_name}</strong>?{' '}
              This action is permanent and irreversible. The linked product will not be deleted.
            </p>
          </div>

          {deleteError && (
            <div className="inv-form-error">
              <AlertTriangle /> {deleteError}
            </div>
          )}

          <div className="inv-modal-actions">
            <button type="button" className="inv-btn-cancel" onClick={() => setShowDelete(false)}>Cancel</button>
            <button type="button" className="inv-btn-delete" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="inv-modal-overlay" onClick={onClose}>
      <div className="inv-modal" onClick={e => e.stopPropagation()}>
        <div className="inv-modal-header">
          <h2 className="inv-modal-title">Update Inventory</h2>
          <button className="inv-modal-close" onClick={onClose} type="button"><XIcon /></button>
        </div>

        <form className="inv-modal-form" onSubmit={handleSubmit}>
          {/* Product (read-only) */}
          <label className="inv-form-label">
            Product
            <input
              className="inv-form-input inv-form-input--readonly"
              value={record.product_name || '—'}
              readOnly
              tabIndex={-1}
            />
          </label>

          <div className="inv-form-row">
            <label className="inv-form-label">
              Quantity <span className="inv-form-required">*</span>
              <input
                name="quantity"
                type="number"
                min="0"
                step="1"
                className="inv-form-input"
                value={form.quantity}
                onChange={handleChange}
                required
              />
            </label>

            <label className="inv-form-label">
              Low Stock Threshold <span className="inv-form-required">*</span>
              <input
                name="low_stock_threshold"
                type="number"
                min="0"
                step="1"
                className="inv-form-input"
                value={form.low_stock_threshold}
                onChange={handleChange}
                required
              />
            </label>
          </div>

          {error && (
            <div className="inv-form-error">
              <AlertTriangle /> {error}
            </div>
          )}

          <div className="inv-modal-actions inv-modal-actions--update">
            {user?.role === 'admin' ? (
              <button
                type="button"
                className="inv-btn-delete-outline"
                onClick={() => setShowDelete(true)}
              >
                <TrashIcon /> Delete
              </button>
            ) : <span />}
            <div className="inv-modal-actions-right">
              <button type="button" className="inv-btn-cancel" onClick={onClose}>Cancel</button>
              <button type="submit" className="inv-btn-primary" disabled={loading}>
                {loading ? 'Updating…' : 'Update Inventory'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Stocks Tab ─────────────────────────────────────────────────
function StocksTab({ user }) {
  const [inventory,    setInventory]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [updateTarget, setUpdateTarget] = useState(null);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch('/api/inventory', { headers: { Authorization: `Bearer ${token}` } });
      const json  = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to fetch inventory.');
      setInventory(json.inventory || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  const handleUpdated = (updated) => {
    setInventory(prev => prev.map(r => r.inventory_id === updated.inventory_id ? updated : r));
  };

  const handleDeleted = (id) => {
    setInventory(prev => prev.filter(r => r.inventory_id !== id));
  };

  const filtered = useMemo(() => {
    let rows = inventory;
    if (statusFilter === 'Low') {
      rows = rows.filter(r => r.is_low_stock);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(r => (r.product_name || '').toLowerCase().includes(q));
    }
    return rows;
  }, [inventory, statusFilter, search]);

  const isAdmin = user?.role === 'admin';
  const canUpdate = user?.role === 'admin' || user?.role === 'staff';

  return (
    <>
      <div className="inv-card">
        <div className="inv-card-header">
          <span className="inv-card-title">Inventory Stocks</span>
          <div className="inv-card-controls">
            <div className="inv-search-wrap">
              <SearchIcon />
              <input
                className="inv-search-input"
                placeholder="Search a Product"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <span className="inv-filter-label">Status:</span>
            <FilterDropdown
              value={statusFilter}
              options={['All', 'Low']}
              onChange={setStatusFilter}
            />
          </div>
        </div>

        {error && (
          <div className="inv-error" style={{ marginBottom: 12 }}>
            <AlertTriangle /> {error}
            <button className="inv-error-retry" onClick={fetchInventory}>Retry</button>
          </div>
        )}

        <div className="inv-table-wrap">
          <table className="inv-table">
            <thead>
              <tr>
                <th>INVENTORY ID</th>
                <th>PRODUCT</th>
                <th>QUANTITY</th>
                <th>LOW STOCK THRESHOLD</th>
                <th>LAST UPDATED</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonStockRow key={i} />)
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="inv-empty">
                      <InventoryEmptyIcon />
                      <span>
                        {search || statusFilter !== 'All'
                          ? 'No inventory records match your filter.'
                          : 'No inventory records found.'}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(row => (
                  <tr key={row.inventory_id}>
                    <td className="inv-cell-id">{row.inventory_id_display}</td>
                    <td className="inv-cell-product">{row.product_name || '—'}</td>
                    <td>
                      <div className="inv-cell-qty">
                        <span className={row.is_low_stock ? 'inv-cell-qty--low' : 'inv-cell-qty--normal'}>
                          {row.quantity ?? 0}
                        </span>
                        {row.is_low_stock && (
                          <span className="inv-low-badge">LOW</span>
                        )}
                      </div>
                    </td>
                    <td>{row.low_stock_threshold ?? 0}</td>
                    <td>{formatDateShort(row.last_updated)}</td>
                    <td>
                      {canUpdate ? (
                        <button
                          className="inv-btn-update"
                          onClick={() => setUpdateTarget(row)}
                          type="button"
                        >
                          UPDATE
                        </button>
                      ) : (
                        <span style={{ color: '#BBAEA0', fontSize: 12 }}>—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && !error && (
          <div className="inv-card-footer">
            Showing <strong>{filtered.length}</strong> of <strong>{inventory.length}</strong> record{inventory.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {updateTarget && (
        <UpdateInventoryModal
          record={updateTarget}
          user={user}
          onClose={() => setUpdateTarget(null)}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
        />
      )}
    </>
  );
}

// ── Logs Tab ───────────────────────────────────────────────────
function LogsTab() {
  const [logs,         setLogs]         = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [actionFilter, setActionFilter] = useState('All');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch('/api/inventory/logs', { headers: { Authorization: `Bearer ${token}` } });
      const json  = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to fetch logs.');
      setLogs(json.logs || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const filtered = useMemo(() => {
    if (actionFilter === 'All') return logs;
    if (actionFilter === 'Restock')  return logs.filter(l => l.action === 'restock');
    if (actionFilter === 'Consumed') return logs.filter(l => l.action === 'consumed');
    return logs;
  }, [logs, actionFilter]);

  return (
    <div className="inv-card">
      <div className="inv-card-header">
        <span className="inv-card-title">Today's Inventory Logs</span>
        <div className="inv-card-controls">
          <span className="inv-filter-label">Action:</span>
          <FilterDropdown
            value={actionFilter}
            options={['All', 'Restock', 'Consumed']}
            onChange={setActionFilter}
          />
        </div>
      </div>

      {error && (
        <div className="inv-error" style={{ marginBottom: 12 }}>
          <AlertTriangle /> {error}
          <button className="inv-error-retry" onClick={fetchLogs}>Retry</button>
        </div>
      )}

      <div className="inv-table-wrap">
        <table className="inv-table">
          <thead>
            <tr>
              <th>LOG ID</th>
              <th>INVENTORY ID</th>
              <th>DETAIL</th>
              <th>QUANTITY CHANGE</th>
              <th>CREATED AT</th>
              <th>USER</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonLogRow key={i} />)
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="inv-empty">
                    <InventoryEmptyIcon />
                    <span>
                      {actionFilter !== 'All'
                        ? 'No logs match your filter.'
                        : 'No inventory logs for today.'}
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map(log => {
                const isRestock = log.action === 'restock';
                const change    = log.quantity_change;
                return (
                  <tr key={log.log_id}>
                    <td className="inv-cell-id">{log.log_id_display}</td>
                    <td className="inv-cell-id">{log.inventory_id_display}</td>
                    <td>
                      <span className={`inv-badge ${isRestock ? 'inv-badge--restock' : 'inv-badge--consumed'}`}>
                        {isRestock ? 'RESTOCK' : 'CONSUMED'}
                      </span>
                    </td>
                    <td>
                      <span className={change >= 0 ? 'inv-qty-change--positive' : 'inv-qty-change--negative'}>
                        {change >= 0 ? `+${change}` : change}
                      </span>
                    </td>
                    <td style={{ color: '#555', fontSize: 12.5 }}>{formatDateTime(log.created_at)}</td>
                    <td style={{ color: '#555' }}>
                      {log.username ? `@${log.username}` : '—'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!loading && !error && (
        <div className="inv-card-footer">
          Showing <strong>{filtered.length}</strong> of <strong>{logs.length}</strong> log{logs.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────
export default function InventoryPage({ user }) {
  const [activeTab, setActiveTab] = useState('stocks');
  const today = new Date();

  return (
    <div className="inv-page">

      {/* ── Greeting Bar ── */}
      <div className="inv-greeting">
        <span className="inv-greeting-text">
          Good Day! <strong>{user?.full_name?.split(' ')[0] || '...'}</strong>
        </span>
        <span className="inv-greeting-date">{formatDate(today)}</span>
      </div>

      {/* ── Tabs ── */}
      <div className="inv-tabs">
        <button
          className={`inv-tab${activeTab === 'stocks' ? ' inv-tab--active' : ''}`}
          onClick={() => setActiveTab('stocks')}
          type="button"
        >
          Stocks
        </button>
        <button
          className={`inv-tab${activeTab === 'logs' ? ' inv-tab--active' : ''}`}
          onClick={() => setActiveTab('logs')}
          type="button"
        >
          Logs
        </button>
      </div>

      {/* ── Tab Content ── */}
      {activeTab === 'stocks' ? (
        <StocksTab user={user} />
      ) : (
        <LogsTab />
      )}
    </div>
  );
}