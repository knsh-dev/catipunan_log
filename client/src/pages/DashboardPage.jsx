// client/src/pages/DashboardPage.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import SalesBarChart from '../components/SalesBarChart';
import '../styles/DashboardPage.css';

const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

function formatDate(d) {
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}
function formatPeso(val) {
  const n = parseFloat(val) || 0;
  return '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}
function formatTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  let h = d.getHours(), m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')} ${ampm}`;
}

const MoneyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
  </svg>
);
const OrderIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 01-8 0"/>
  </svg>
);
const RevenueIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
  </svg>
);
const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const AlertTriangle = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const Skeleton = ({ w = '100%', h = '16px', r = '6px', mb = '0' }) => (
  <div className="skeleton" style={{ width: w, height: h, borderRadius: r, marginBottom: mb }} />
);

export default function DashboardPage({ user, onNavigate }) {
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [chartRange, setChartRange] = useState('months'); // 'months' | 'weeks'
  const [chartData,  setChartData]  = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const today = new Date();

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchChartData = useCallback(async (range) => {
    setChartLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`/api/dashboard/sales-chart?range=${range}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch chart data.');
      const json = await res.json();
      setChartData(json.chart || []);
    } catch {
      // Fall back to main data chart
    } finally {
      setChartLoading(false);
    }
  }, []);

  const handleRangeChange = (range) => {
    setChartRange(range);
    setDropdownOpen(false);
    fetchChartData(range);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch('/api/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch dashboard data.');
      const json = await res.json();
      setData(json);
      // Init chart with the default range from main data
      setChartData(json.salesChart || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const MetricCard = ({ label, value, Icon, large, page }) => (
    <div
      className={`metric-card${large ? ' metric-card--large' : ''}${page ? ' metric-card--clickable' : ''}`}
      onClick={page && onNavigate ? () => onNavigate(page) : undefined}
      style={page ? { cursor: 'pointer' } : {}}
    >
      <div className="metric-card-header">
        <span className="metric-label">{label}</span>
        {Icon && <span className="metric-icon"><Icon /></span>}
      </div>
      <div className={`metric-value${large ? ' metric-value--large' : ''}`}>
        {loading ? <Skeleton h="32px" w="120px" r="6px" /> : value}
      </div>
      {page && <span className="metric-card-arrow">→</span>}
    </div>
  );

  return (
    <div className="dashboard">
      <div className="greeting-bar">
        <span className="greeting-text">
          Good Day! <strong>{user?.full_name?.split(' ')[0] || '...'}</strong>
        </span>
        <span className="greeting-date">{formatDate(today)}</span>
      </div>

      {error && (
        <div className="dash-error">
          <AlertTriangle />
          {error}
          <button className="dash-error-retry" onClick={fetchData}>Retry</button>
        </div>
      )}

      <div className="metrics-row">
        <MetricCard label="Monthly Sales"          value={formatPeso(data?.monthlySales)} Icon={MoneyIcon} page="payment" />
        <MetricCard label="Orders Today"           value={data?.ordersToday ?? 0}         Icon={OrderIcon} page="pos" />
        <MetricCard label="Today's Total Revenue"  value={formatPeso(data?.orderRevenue)} Icon={RevenueIcon} page="payment" />
        <MetricCard label="Weekly Favorite Product" value={data?.weeklyFavorite || '—'}   Icon={StarIcon} large page="products" />
      </div>

      <div className="mid-row">
        <div className="panel chart-panel">
          <div className="panel-header">
            <span className="panel-title">Sales Performance</span>
            <div className="chart-range-dropdown" ref={dropdownRef}>
              <button
                className="chart-range-btn"
                onClick={() => setDropdownOpen(o => !o)}
              >
                {chartRange === 'months' ? 'Last 7 Months' : chartRange === 'weeks' ? 'Last 7 Weeks' : 'Last 7 Days'}
                <span className={`chart-range-arrow${dropdownOpen ? ' chart-range-arrow--open' : ''}`}>▾</span>
              </button>
              {dropdownOpen && (
                <div className="chart-range-menu">
                  <button
                    className={`chart-range-option${chartRange === 'months' ? ' chart-range-option--active' : ''}`}
                    onClick={() => handleRangeChange('months')}
                  >
                    Last 7 Months
                  </button>
                  <button
                    className={`chart-range-option${chartRange === 'weeks' ? ' chart-range-option--active' : ''}`}
                    onClick={() => handleRangeChange('weeks')}
                  >
                    Last 7 Weeks
                  </button>
                  <button
                    className={`chart-range-option${chartRange === 'days' ? ' chart-range-option--active' : ''}`}
                    onClick={() => handleRangeChange('days')}
                  >
                    Last 7 Days
                  </button>
                </div>
              )}
            </div>
          </div>
          {loading || chartLoading
            ? <Skeleton h="220px" r="8px" />
            : <SalesBarChart data={chartData} showTotal />
          }
        </div>

        <div className="panel top-products-panel">
          <div className="panel-header">
            <span className="panel-title">Top Products This Week</span>
            {onNavigate && (
              <button className="see-all-btn" onClick={() => onNavigate('products')}>See All</button>
            )}
          </div>
          <div className="top-products-list">
            {loading
              ? [1,2,3,4].map(i => <Skeleton key={i} h="42px" r="8px" mb="8px" />)
              : data?.topProducts?.length
                ? data.topProducts.map((p, i) => (
                    <div key={i} className="top-product-item">
                      <span className="top-product-name">{p.product_name}</span>
                      <span className="top-product-qty">{p.total_qty} sold</span>
                    </div>
                  ))
                : <p className="empty-state">No orders this week yet.</p>
            }
          </div>
        </div>
      </div>

      <div className="bottom-row">
        {/* Low Stock */}
        <div className="panel low-stock-panel">
          <div className="panel-header">
            <span className="panel-title">Low Stock Alert</span>
            {onNavigate && (
              <button className="see-all-btn" onClick={() => onNavigate('inventory')}>See All</button>
            )}
          </div>
          <div className="low-stock-list">
            {loading
              ? [1,2].map(i => <Skeleton key={i} h="52px" r="10px" mb="8px" />)
              : data?.lowStock?.length
                ? data.lowStock.map((item, i) => (
                    <div key={i} className="low-stock-item">
                      <span className="low-stock-name">{item.product_name}</span>
                      <div className="low-stock-bottom">
                        <span className="low-stock-qty">{item.quantity}</span>
                        <span className="low-badge">LOW</span>
                      </div>
                    </div>
                  ))
                : <p className="empty-state">All items sufficiently stocked.</p>
            }
          </div>
        </div>

        {/* Recent Payments */}
        <div className="panel payments-panel">
          <div className="panel-header">
            <span className="panel-title">Today's Recent Payments</span>
            {onNavigate && (
              <button className="see-all-btn" onClick={() => onNavigate('payment')}>See All</button>
            )}
          </div>
          <div className="payments-list">
            {loading
              ? [1,2,3].map(i => <Skeleton key={i} h="52px" r="8px" mb="8px" />)
              : data?.recentPayments?.length
                ? data.recentPayments.map((p, i) => (
                    <div key={i} className="payment-item">
                      <div className="payment-left">
                        <span className="payment-order">#PAY-{String(p.payment_id).padStart(3,'0')}</span>
                        <span className="payment-method">{p.method?.charAt(0).toUpperCase() + p.method?.slice(1)}</span>
                      </div>
                      <div className="payment-right">
                        <span className="payment-amount">{formatPeso(p.grand_total)}</span>
                        <span className="payment-time">{formatTime(p.paid_at)}</span>
                      </div>
                    </div>
                  ))
                : <p className="empty-state">No payments recorded today.</p>
            }
          </div>
        </div>

        {/* Upcoming Bookings */}
        <div className="panel bookings-panel">
          <div className="panel-header">
            <span className="panel-title">Upcoming Bookings</span>
            {onNavigate && (
              <button className="see-all-btn" onClick={() => onNavigate('bookings')}>See All</button>
            )}
          </div>
          <div className="bookings-list">
            {loading
              ? [1,2,3].map(i => <Skeleton key={i} h="52px" r="8px" mb="8px" />)
              : data?.upcomingBookings?.length
                ? data.upcomingBookings.map((b, i) => (
                    <div key={i} className="booking-item">
                      <div className="booking-left">
                        <span className="booking-time">{formatTime(b.check_in)}</span>
                        <span className="booking-user">@{b.username}</span>
                      </div>
                      <span className="booking-size">{b.party_size} people</span>
                    </div>
                  ))
                : <p className="empty-state">No upcoming bookings today.</p>
            }
          </div>
        </div>
      </div>
    </div>
  );
}
