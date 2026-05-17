// client/src/pages/BookingsPage.jsx
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import '../styles/BookingsPage.css';

// ── Helpers ────────────────────────────────────────────────────
const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

function formatDate(d) {
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function formatPeso(val) {
  const n = parseFloat(val) || 0;
  return '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const yr  = d.getFullYear();
  const mo  = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h   = d.getHours();
  const min = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12  = h % 12 || 12;
  return `${yr}-${mo}-${day} ${h12}:${min} ${ampm}`;
}

function padBookingId(id) {
  if (!id) return '—';
  return `B${String(id).padStart(3, '0')}`;
}

// active → completed only (confirmed→active is auto, done by backend)
const STATUS_FLOW = {
  confirmed: [],       // cannot manually change; auto-activated by backend
  active:    ['completed'],
  completed: [],
};

const STATUS_OPTIONS = ['All', 'confirmed', 'active', 'completed'];

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
const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
    <path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
  </svg>
);
const EmptyIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="8" y="16" width="48" height="36" rx="4" />
    <line x1="8"  y1="26" x2="56" y2="26" />
    <line x1="20" y1="36" x2="32" y2="36" />
    <line x1="20" y1="43" x2="28" y2="43" />
  </svg>
);

// ── Skeleton Row ───────────────────────────────────────────────
const SkeletonRow = ({ cols }) => (
  <tr className="bk-skeleton-row">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i}><div className="bk-skeleton-cell" /></td>
    ))}
  </tr>
);

// ── Duration Badge ─────────────────────────────────────────────
function DurationBadge({ duration }) {
  return <span className="bk-duration-badge">{duration || '—'}</span>;
}

// ── Status Badge (read-only) ───────────────────────────────────
function StatusBadge({ status }) {
  const s = (status || '').toLowerCase();
  return <span className={`bk-status-badge bk-status-badge--${s}`}>{s.charAt(0).toUpperCase() + s.slice(1)}</span>;
}

// ── Status Filter Dropdown ─────────────────────────────────────
function StatusFilter({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="bk-filter" ref={ref}>
      <button className="bk-filter-btn" onClick={() => setOpen(v => !v)} type="button">
        <span>{value === 'All' ? 'All' : value.charAt(0).toUpperCase() + value.slice(1)}</span>
        <ChevronDown />
      </button>
      {open && (
        <div className="bk-filter-dropdown">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt}
              className={`bk-filter-option${value === opt ? ' bk-filter-option--active' : ''}`}
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

// ── Status Changer (inline clickable badge) ────────────────────
function StatusChanger({ booking, onStatusChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const nextStatuses = STATUS_FLOW[booking.status] || [];

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Terminal status — just render badge, no dropdown
  if (nextStatuses.length === 0) {
    return <StatusBadge status={booking.status} />;
  }

  return (
    <div className="bk-status-changer" ref={ref}>
      <button
        className={`bk-status-badge bk-status-badge--${booking.status} bk-status-badge--clickable`}
        onClick={() => setOpen(v => !v)}
        title="Click to update status"
        type="button"
      >
        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
        <ChevronDown />
      </button>
      {open && (
        <div className="bk-status-dropdown">
          {nextStatuses.map(s => (
            <button
              key={s}
              className="bk-status-option"
              onClick={() => { onStatusChange(booking.booking_id, s); setOpen(false); }}
              type="button"
            >
              <span className={`bk-status-dot bk-status-dot--${s}`} />
              Mark as {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Anchor Badge (Anchoring Principle) ────────────────────────
function AnchorBadge({ current, reference, label }) {
  if (!reference) return <span className="bk-anchor-label">{label}: no prior data</span>;
  const pct = ((current - reference) / reference) * 100;
  const up  = pct >= 0;
  return (
    <div className="bk-anchor-row">
      <span className={`bk-anchor-badge ${up ? 'bk-anchor-badge--up' : 'bk-anchor-badge--down'}`}>
        {up ? '▲' : '▼'} {Math.abs(pct).toFixed(1)}%
      </span>
      <span className="bk-anchor-label">{label}</span>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────
export default function BookingsPage({ user }) {
  const [bookings, setBookings] = useState([]);
  const [summary,  setSummary]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [search,   setSearch]   = useState('');
  const [status,   setStatus]   = useState('All');
  const today = new Date();
  const isAdmin = user?.role === 'admin';

  // ── Fetch summary cards ──
  const fetchSummary = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/bookings/summary', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      setSummary(await res.json());
    } catch { /* silent */ }
  }, []);

  // ── Fetch today's bookings ──
  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/bookings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch bookings.');
      const json = await res.json();
      setBookings(json.bookings || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
    fetchBookings();
  }, [fetchSummary, fetchBookings]);

  // ── Auto-sync: poll every 30s — confirmed→active, active→completed ──
  useEffect(() => {
    const autoSync = async () => {
      try {
        const token = localStorage.getItem('token');
        await fetch('/api/bookings/auto-activate', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        // Refresh list and summary silently after sync
        fetchBookings();
        fetchSummary();
      } catch { /* silent */ }
    };
    autoSync(); // run immediately on mount
    const interval = setInterval(autoSync, 30000); // then every 30s
    return () => clearInterval(interval);
  }, [fetchBookings, fetchSummary]);

  // ── Inline status update ──
  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status.');
      // Optimistic update
      setBookings(prev =>
        prev.map(b => b.booking_id === bookingId ? { ...b, status: newStatus } : b)
      );
      fetchSummary();
    } catch (err) {
      alert(err.message);
    }
  };

  // ── Delete (admin only) ──
  const handleDelete = async (bookingId) => {
    if (!window.confirm(`Delete booking ${padBookingId(bookingId)}? This cannot be undone.`)) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete booking.');
      setBookings(prev => prev.filter(b => b.booking_id !== bookingId));
      fetchSummary();
    } catch (err) {
      alert(err.message);
    }
  };

  // ── Client-side filter ──
  const filtered = useMemo(() => {
    let rows = bookings;
    if (status !== 'All') {
      rows = rows.filter(b => b.status === status);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(b =>
        [padBookingId(b.booking_id), b.handled_by || '', b.status || '', String(b.party_size)]
          .some(f => f.toLowerCase().includes(q))
      );
    }
    return rows;
  }, [bookings, status, search]);

  const colSpan = isAdmin ? 9 : 8;

  return (
    <div className="bk-page">

      {/* ── Greeting Bar ── */}
      <div className="bk-greeting">
        <span className="bk-greeting-text">
          Good Day! <strong>{user?.full_name?.split(' ')[0] || '...'}</strong>
        </span>
        <span className="bk-greeting-date">{formatDate(today)}</span>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="bk-error">
          <AlertTriangle /> {error}
          <button className="bk-error-retry" onClick={() => { fetchSummary(); fetchBookings(); }}>Retry</button>
        </div>
      )}

      {/* ── Summary Cards ── */}
      <div className="bk-metrics">
        <div className="bk-metric-card">
          <span className="bk-metric-label">Monthly Booking Revenue</span>
          <span className="bk-metric-value">
            {summary === null ? <span className="bk-metric-skeleton" /> : formatPeso(summary.monthlyRevenue)}
          </span>
          {summary !== null && <AnchorBadge current={summary.monthlyRevenue} reference={summary.prevMonthlyRevenue} label="vs last month" />}
        </div>
        <div className="bk-metric-card">
          <span className="bk-metric-label">Bookings Today</span>
          <span className="bk-metric-value">
            {summary === null ? <span className="bk-metric-skeleton" /> : summary.bookingsToday}
          </span>
          {summary !== null && <AnchorBadge current={summary.bookingsToday} reference={summary.prevBookingsToday} label="vs yesterday" />}
        </div>
        <div className="bk-metric-card">
          <span className="bk-metric-label">Today's Revenue</span>
          <span className="bk-metric-value">
            {summary === null ? <span className="bk-metric-skeleton" /> : formatPeso(summary.todayRevenue)}
          </span>
          {summary !== null && <AnchorBadge current={summary.todayRevenue} reference={summary.prevTodayRevenue} label="vs yesterday" />}
        </div>
        <div className="bk-metric-card">
          <span className="bk-metric-label">Upcoming Bookings</span>
          <span className="bk-metric-value">
            {summary === null ? <span className="bk-metric-skeleton" /> : summary.upcomingCount}
          </span>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className="bk-card">

        {/* Card Header */}
        <div className="bk-card-header">
          <span className="bk-card-title">Today's Bookings</span>
          <div className="bk-card-controls">
            <span className="bk-filter-label">Status:</span>
            <StatusFilter value={status} onChange={setStatus} />
          </div>
        </div>

        {/* Search */}
        <div className="bk-search-wrap">
          <SearchIcon />
          <input
            type="text"
            className="bk-search-input"
            placeholder="Search by ID, handle, status…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="bk-search-clear" onClick={() => setSearch('')} type="button">×</button>
          )}
        </div>

        {/* Table */}
        <div className="bk-table-wrap">
          <table className="bk-table">
            <thead>
              <tr>
                <th>BOOKING ID</th>
                <th>CHECK IN</th>
                <th>CHECK OUT</th>
                <th>DURATION</th>
                <th>PARTY SIZE</th>
                <th>BOOKING FEE</th>
                <th>STATUS</th>
                <th>HANDLER</th>
                {isAdmin && <th></th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={colSpan} />)
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={colSpan}>
                    <div className="bk-empty">
                      <EmptyIcon />
                      <span>
                        {search || status !== 'All'
                          ? 'No bookings match your filter.'
                          : 'No bookings recorded today.'}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b.booking_id}>
                    <td className="bk-cell-id">{padBookingId(b.booking_id)}</td>
                    <td className="bk-cell-dt">{formatDateTime(b.check_in)}</td>
                    <td className="bk-cell-dt">{formatDateTime(b.check_out)}</td>
                    <td><DurationBadge duration={b.duration} /></td>
                    <td className="bk-cell-center">{b.party_size}</td>
                    <td className="bk-cell-fee">{formatPeso(b.booking_fee)}</td>
                    <td>
                      <StatusChanger booking={b} onStatusChange={handleStatusChange} />
                    </td>
                    <td className="bk-cell-handle">@{b.handled_by || '—'}</td>
                    {isAdmin && (
                      <td className="bk-cell-action">
                        <button
                          className="bk-btn-delete"
                          onClick={() => handleDelete(b.booking_id)}
                          title="Delete booking"
                          type="button"
                        >
                          <TrashIcon />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer count */}
        {!loading && !error && (
          <div className="bk-card-footer">
            Showing <strong>{filtered.length}</strong> of <strong>{bookings.length}</strong> booking{bookings.length !== 1 ? 's' : ''} today
          </div>
        )}
      </div>
    </div>
  );
}
