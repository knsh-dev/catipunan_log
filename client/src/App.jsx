// client/src/App.jsx
import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

import LoginPage     from './pages/LoginPage';
import SignUpPage    from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import PaymentPage   from './pages/PaymentPage';
import BookingsPage  from './pages/BookingsPage';
import UsersPage     from './pages/UsersPage';
import ProductsPage  from './pages/ProductsPage';
import InventoryPage from './pages/InventoryPage';
import CafePOSPage   from './pages/CafePOSPage';
import AppLayout     from './components/AppLayout';

// ── Role config ───────────────────────────────────────────────
const ROLE_DEFAULT = { admin: '/dashboard', cashier: '/pos', staff: '/bookings' };

const ROLE_PAGES = {
  admin:   ['/dashboard', '/bookings', '/payment', '/pos', '/products', '/inventory', '/users'],
  cashier: ['/pos'],
  staff:   ['/bookings', '/inventory'],
};

// ── Helpers ───────────────────────────────────────────────────
function canAccess(user, path) {
  if (!user) return false;
  return (ROLE_PAGES[user.role] || []).includes(path);
}

// ── Guards ────────────────────────────────────────────────────
function PrivateRoute({ user, path, children }) {
  if (!user) return <Navigate to="/login" replace />;
  if (!canAccess(user, path)) return <Unauthorized />;
  return children;
}

function PublicRoute({ user, children }) {
  if (user) return <Navigate to={ROLE_DEFAULT[user.role] || '/dashboard'} replace />;
  return children;
}

function Unauthorized() {
  return (
    <div style={{ padding: '40px 28px', fontFamily: 'DM Sans, sans-serif', textAlign: 'center' }}>
      <h2 style={{ fontSize: 22, color: '#B91C1C', marginBottom: 8 }}>Access Denied</h2>
      <p style={{ color: '#888', fontSize: 14 }}>You do not have permission to view this page.</p>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────
export default function App() {
  const [user,        setUser]        = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [refreshKey,  setRefreshKey]  = useState(0);
  const navigate  = useNavigate();
  const location  = useLocation();

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setAuthChecked(true); return; }
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => { if (!res.ok) throw new Error('invalid'); return res.json(); })
      .then(({ user: u }) => { setUser(u); })
      .catch(() => { localStorage.removeItem('token'); localStorage.removeItem('user'); })
      .finally(() => setAuthChecked(true));
  }, []);

  const handleLoginSuccess = (u) => {
    setUser(u);
    navigate(ROLE_DEFAULT[u.role] || '/dashboard', { replace: true });
  };

  const handleSignUpSuccess = () => {
    navigate('/login', { replace: true, state: { registered: true } });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login', { replace: true });
  };

  const handleNavigate = (path) => {
    // Accept both 'dashboard' style keys and '/dashboard' paths
    const full = path.startsWith('/') ? path : `/${path}`;
    if (!canAccess(user, full)) return;
    navigate(full);
  };

  const handleRefresh = () => setRefreshKey(k => k + 1);

  // Derive active page key from URL for sidebar highlight
  const activePage = location.pathname.replace('/', '') || 'dashboard';

  if (!authChecked) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#FAF6EE', fontFamily: 'DM Sans,sans-serif', color: '#AAA', fontSize: 14 }}>
      Restoring session…
    </div>
  );

  return (
    <Routes>
      {/* ── Public Routes ── */}
      <Route path="/login" element={
        <PublicRoute user={user}>
          <LoginPage
            onLoginSuccess={handleLoginSuccess}
            onNavigateToSignup={() => navigate('/register')}
            showSuccessBanner={location.state?.registered === true}
          />
        </PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute user={user}>
          <SignUpPage onSignUpSuccess={handleSignUpSuccess} onNavigateToLogin={() => navigate('/login')} />
        </PublicRoute>
      } />

      {/* ── Private Routes (inside AppLayout) ── */}
      <Route element={
        user
          ? <AppLayout user={user} activePage={activePage} onNavigate={handleNavigate} onLogout={handleLogout} onRefresh={handleRefresh} />
          : <Navigate to="/login" replace />
      }>
        <Route path="/dashboard" element={
          <PrivateRoute user={user} path="/dashboard">
            <DashboardPage key={refreshKey} user={user} onNavigate={handleNavigate} />
          </PrivateRoute>
        } />
        <Route path="/bookings" element={
          <PrivateRoute user={user} path="/bookings">
            <BookingsPage key={refreshKey} user={user} />
          </PrivateRoute>
        } />
        <Route path="/payment" element={
          <PrivateRoute user={user} path="/payment">
            <PaymentPage key={refreshKey} user={user} />
          </PrivateRoute>
        } />
        <Route path="/pos" element={
          <PrivateRoute user={user} path="/pos">
            <CafePOSPage key={refreshKey} user={user} />
          </PrivateRoute>
        } />
        <Route path="/products" element={
          <PrivateRoute user={user} path="/products">
            <ProductsPage key={refreshKey} user={user} />
          </PrivateRoute>
        } />
        <Route path="/inventory" element={
          <PrivateRoute user={user} path="/inventory">
            <InventoryPage key={refreshKey} user={user} />
          </PrivateRoute>
        } />
        <Route path="/users" element={
          <PrivateRoute user={user} path="/users">
            <UsersPage key={refreshKey} user={user} />
          </PrivateRoute>
        } />
      </Route>

      {/* ── Catch-all redirect ── */}
      <Route path="*" element={
        user
          ? <Navigate to={ROLE_DEFAULT[user.role] || '/dashboard'} replace />
          : <Navigate to="/login" replace />
      } />
    </Routes>
  );
}