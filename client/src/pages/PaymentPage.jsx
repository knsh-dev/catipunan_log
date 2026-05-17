// client/src/pages/PaymentPage.jsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import '../styles/PaymentPage.css';

// ── Helpers ───────────────────────────────────────────────────
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

function formatDate(d) {
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function formatPeso(val) {
  const n = parseFloat(val) || 0;
  return '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  let h = d.getHours(), m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${mo}/${day} ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
}

function padId(prefix, id) {
  if (!id) return 'N/A';
  return `${prefix}-${String(id).padStart(3, '0')}`;
}

// ── Icons ─────────────────────────────────────────────────────
const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const AlertTriangle = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const ChevronDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const EmptyIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="8" y="16" width="48" height="36" rx="4" />
    <line x1="8" y1="26" x2="56" y2="26" />
    <line x1="20" y1="36" x2="32" y2="36" />
    <line x1="20" y1="43" x2="28" y2="43" />
  </svg>
);

// ── Skeleton Row ──────────────────────────────────────────────
const SkeletonRow = () => (
  <tr className="payment-skeleton-row">
    {Array.from({ length: 11 }).map((_, i) => (
      <td key={i}><div className="skeleton-cell" /></td>
    ))}
  </tr>
);

// ── Method Badge ──────────────────────────────────────────────
function MethodBadge({ method }) {
  const m = (method || '').toLowerCase();
  return (
    <span className={`method-badge method-badge--${m === 'gcash' ? 'gcash' : 'cash'}`}>
      {m === 'gcash' ? 'GCash' : 'Cash'}
    </span>
  );
}

// ── Status Badge ──────────────────────────────────────────────
function StatusBadge({ status }) {
  const s = (status || '').toLowerCase();
  return (
    <span className={`status-badge status-badge--${s}`}>
      {status ? status.charAt(0).toUpperCase() + status.slice(1) : '—'}
    </span>
  );
}

// ── Method Filter Dropdown ────────────────────────────────────
const METHOD_OPTIONS = ['All', 'Cash', 'GCash'];

function MethodFilter({ value, onChange }) {
  const [open, setOpen] = useState(false);

  const handleSelect = (opt) => {
    onChange(opt);
    setOpen(false);
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = () => setOpen(false);
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="method-filter" onMouseDown={e => e.stopPropagation()}>
      <button
        className="method-filter-btn"
        onClick={() => setOpen(v => !v)}
        type="button"
      >
        <span>{value}</span>
        <ChevronDown />
      </button>
      {open && (
        <div className="method-filter-dropdown">
          {METHOD_OPTIONS.map(opt => (
            <button
              key={opt}
              className={`method-filter-option${value === opt ? ' method-filter-option--active' : ''}`}
              onClick={() => handleSelect(opt)}
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

// ── Main Component ────────────────────────────────────────────
export default function PaymentPage({ user }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [method, setMethod] = useState('All');
  const today = new Date();

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/payments', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch payment transactions.');
      const json = await res.json();
      setPayments(json.payments || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  // ── Client-side filter: method + search ───────────────────
  const filtered = useMemo(() => {
    let rows = payments;

    // Method filter
    if (method !== 'All') {
      rows = rows.filter(p =>
        (p.method || '').toLowerCase() === method.toLowerCase()
      );
    }

    // Search filter
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(p => {
        const fields = [
          padId('PAY', p.payment_id),
          padId('ORD', p.order_id),
          padId('BOOK', p.booking_id),
          p.method || '',
          p.status || '',
          p.reference_no || '',
          p.cashier_name || '',
        ];
        return fields.some(f => f.toLowerCase().includes(q));
      });
    }

    return rows;
  }, [payments, method, search]);

  return (
    <div className="payment-page">

      {/* ── Greeting Bar ── */}
      <div className="payment-greeting">
        <span className="payment-greeting-text">
          Good Day! <strong>{user?.full_name?.split(' ')[0] || '...'}</strong>
        </span>
        <span className="payment-greeting-date">{formatDate(today)}</span>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="payment-error">
          <AlertTriangle />
          {error}
          <button className="payment-error-retry" onClick={fetchPayments}>Retry</button>
        </div>
      )}

      {/* ── Table Card ── */}
      <div className="payment-card">

        {/* ── Card Header ── */}
        <div className="payment-card-header">
          <span className="payment-card-title">Today's Payment Transactions</span>

          <div className="payment-card-controls">
            <span className="payment-status-label">Status:</span>
            <MethodFilter value={method} onChange={setMethod} />
          </div>
        </div>

        {/* ── Search Bar ── */}
        <div className="payment-search-wrap">
          <SearchIcon />
          <input
            type="text"
            className="payment-search-input"
            placeholder="Search by ID, cashier, method, ref. no…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="payment-search-clear" onClick={() => setSearch('')} type="button">
              ×
            </button>
          )}
        </div>

        {/* ── Table ── */}
        <div className="payment-table-wrap">
          <table className="payment-table">
            <thead>
              <tr>
                <th>PAY ID</th>
                <th>ORDER ID</th>
                <th>BOOKING ID</th>
                <th>ORDER TOTAL</th>
                <th>BOOKING FEE</th>
                <th>GRAND TOTAL</th>
                <th>METHOD</th>
                <th>STATUS</th>
                <th>REF. NO.</th>
                <th>PAID AT</th>
                <th>CASHIER</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={11}>
                    <div className="payment-empty">
                      <EmptyIcon />
                      <span>
                        {search || method !== 'All'
                          ? 'No transactions match your filter.'
                          : 'No payment transactions recorded today.'}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((p, i) => (
                  <tr key={p.payment_id} className={i % 2 === 0 ? 'row-even' : 'row-odd'}>
                    <td className="cell-id">{padId('PAY', p.payment_id)}</td>
                    <td className="cell-muted">{padId('ORD', p.order_id)}</td>
                    <td className="cell-muted">{padId('BOOK', p.booking_id)}</td>
                    <td>{p.order_id ? formatPeso(p.order_total) : <span className="cell-na">N/A</span>}</td>
                    <td>{p.booking_id ? formatPeso(p.booking_fee) : <span className="cell-na">N/A</span>}</td>
                    <td className="cell-grand">{formatPeso(p.grand_total)}</td>
                    <td><MethodBadge method={p.method} /></td>
                    <td><StatusBadge status={p.status} /></td>
                    <td className="cell-muted">
                      {p.reference_no || <span className="cell-na">N/A</span>}
                    </td>
                    <td className="cell-time">{formatTime(p.paid_at)}</td>
                    <td>{p.cashier_name || <span className="cell-na">N/A</span>}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Footer count ── */}
        {!loading && !error && (
          <div className="payment-card-footer">
            Showing <strong>{filtered.length}</strong> of <strong>{payments.length}</strong> transaction{payments.length !== 1 ? 's' : ''} today
          </div>
        )}
      </div>
    </div>
  );
}