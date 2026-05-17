// client/src/components/AppLayout.jsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar  from './TopBar';
import '../styles/AppLayout.css';

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  bookings:  'Cat Room Bookings',
  payment:   'Payment Transactions',
  pos:       'CAFE POS',
  products:  'Products',
  inventory: 'Inventory',
  users:     'User Management',
};

const LogOutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 32, height: 32 }}>
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

export default function AppLayout({ user, activePage, onNavigate, onLogout, onRefresh }) {
  const [showLogoutOverlay, setShowLogoutOverlay] = useState(false);

  const handleLogoutRequest = () => setShowLogoutOverlay(true);
  const handleLogoutCancel  = () => setShowLogoutOverlay(false);
  const handleLogoutConfirm = () => { setShowLogoutOverlay(false); onLogout(); };

  return (
    <div className="app-layout">
      <Sidebar
        user={user}
        activePage={activePage}
        onNavigate={onNavigate}
        onLogoutRequest={handleLogoutRequest}
      />
      <div className="app-main">
        <TopBar
          title={PAGE_TITLES[activePage] || 'Dashboard'}
          user={user}
          onRefresh={onRefresh}
        />
        <div className="app-content">
          <Outlet />
        </div>
      </div>

      {/* ── Logout Confirmation Overlay ── */}
      {showLogoutOverlay && (
        <div className="logout-overlay" onClick={handleLogoutCancel}>
          <div className="logout-modal" onClick={e => e.stopPropagation()}>
            <div className="logout-modal-icon">
              <LogOutIcon />
            </div>
            <h2 className="logout-modal-title">Log Out?</h2>
            <p className="logout-modal-desc">
              Are you sure you want to log out of your account?
            </p>
            <div className="logout-modal-actions">
              <button className="logout-btn-cancel" onClick={handleLogoutCancel}>
                Cancel
              </button>
              <button className="logout-btn-confirm" onClick={handleLogoutConfirm}>
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
