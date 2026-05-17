// client/src/components/Sidebar.jsx
import { NavLink } from 'react-router-dom';
import '../styles/Sidebar.css';

// ── Icons ─────────────────────────────────────────────────────
const DashboardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
);
const BookingsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 2v3M16 2v3M3 8h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"/>
    <path d="M8 13h4M8 17h2"/>
  </svg>
);
const PaymentIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2"/>
    <line x1="2" y1="10" x2="22" y2="10"/>
  </svg>
);
const POSIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
    <path d="M7 8h2M11 8h2M15 8h2M7 12h2M11 12h2M15 12h2"/>
  </svg>
);
const ProductsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 01-8 0"/>
  </svg>
);
const InventoryIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
    <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/>
    <line x1="10" y1="14" x2="14" y2="14"/>
  </svg>
);
const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const LogOutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

// ── Nav item config per role ──────────────────────────────────
const NAV_CONFIG = [
  {
    section: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', Icon: DashboardIcon, roles: ['admin'] },
      { id: 'bookings',  label: 'Bookings',  Icon: BookingsIcon,  roles: ['admin', 'staff'] },
      { id: 'payment',   label: 'Payments',   Icon: PaymentIcon,   roles: ['admin'] },
    ],
  },
  {
    section: 'Operations',
    items: [
      { id: 'pos', label: 'CAFE POS', Icon: POSIcon, roles: ['admin', 'cashier'] },
    ],
  },
  {
    section: 'Store',
    items: [
      { id: 'products',  label: 'Products',  Icon: ProductsIcon,  roles: ['admin'] },
      { id: 'inventory', label: 'Inventory', Icon: InventoryIcon, roles: ['admin', 'staff'] },
    ],
  },
  {
    section: 'Users',
    items: [
      { id: 'users', label: 'Users', Icon: UsersIcon, roles: ['admin'] },
    ],
  },
];

export default function Sidebar({ user, activePage, onNavigate, onLogoutRequest }) {
  const role = user?.role || '';
  const initials = user?.full_name
    ? user.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <aside className="sidebar">
      {/* ── Logo ── */}
      <div className="sidebar-logo">
        <img src="/icon.png" alt="Catipunan Log" className="sidebar-logo-img" />
        <div className="sidebar-logo-text">
          <span className="sidebar-logo-name">CATIPUNAN</span>
          <span className="sidebar-logo-sub">LOG</span>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav className="sidebar-nav">
        {NAV_CONFIG.map(({ section, items }) => {
          const visible = items.filter(it => it.roles.includes(role));
          if (!visible.length) return null;

          return (
            <div key={section} className="sidebar-section">
              {section && <span className="sidebar-section-label">{section}</span>}
              {visible.map(({ id, label, Icon }) => (
                <NavLink
                  key={id}
                  to={`/${id}`}
                  className={({ isActive }) =>
                    `sidebar-nav-item${isActive ? ' sidebar-nav-item--active' : ''}`
                  }
                >
                  <span className="sidebar-nav-icon"><Icon /></span>
                  <span className="sidebar-nav-label">{label}</span>
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      {/* ── User Footer ── */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user?.full_name}</span>
            <span className="sidebar-user-role">{role.charAt(0).toUpperCase() + role.slice(1)}</span>
          </div>
        </div>
        <button className="sidebar-logout" onClick={onLogoutRequest || onLogout}>
          <LogOutIcon />
          Log out
        </button>
      </div>
    </aside>
  );
}