// client/src/pages/LoginPage.jsx
import { useState } from 'react';
import '../styles/LoginPage.css';

// ─── SVG Icons ───────────────────────────────────────────
const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const AlertIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

// ─── LoginPage Component ──────────────────────────────────
// Props:
//   onLoginSuccess      — called with (user) after successful login
//   onNavigateToSignup  — called when user clicks "Create an account"
//   showSuccessBanner   — boolean; shows "Account created!" toast when coming from signup
export default function LoginPage({ onLoginSuccess, onNavigateToSignup, showSuccessBanner = false }) {
  const [role, setRole]               = useState('');
  const [username, setUsername]       = useState('');
  const [password, setPassword]       = useState('');
  const [showPass, setShowPass]       = useState(false);
  const [loading, setLoading]         = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [errors, setErrors]           = useState({
    role: '',
    username: '',
    password: '',
  });

  const ROLES = ['Admin', 'Cashier', 'Staff'];

  // ── Validation ──────────────────────────────────────────
  const validate = () => {
    const newErrors = { role: '', username: '', password: '' };
    let valid = true;

    if (!role) {
      newErrors.role = 'Please select a role before logging in.';
      valid = false;
    }
    if (!username.trim()) {
      newErrors.username = 'Username is required.';
      valid = false;
    }
    if (!password.trim()) {
      newErrors.password = 'Password is required.';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  // ── Submit ───────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError('');

    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password,
          role: role.toLowerCase(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setGlobalError(data.message || 'Invalid username or password.');
        return;
      }

      // Store token and user info
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect based on role
      if (onLoginSuccess) {
        onLoginSuccess(data.user);
      }
    } catch {
      setGlobalError('Unable to connect to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Clear field error on change ──────────────────────────
  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
    if (errors.username) setErrors(prev => ({ ...prev, username: '' }));
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
  };

  const handleRoleSelect = (r) => {
    setRole(r);
    if (errors.role) setErrors(prev => ({ ...prev, role: '' }));
  };

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="login-page">

      {/* ── LEFT PANEL ── */}
      <aside className="login-left">
        <div className="login-left-content">
          <div className="login-logo-wrap">
            <img
              src="/icon.png"
              alt="Catipunan Pet Cafe Logo"
              className="login-logo"
            />
          </div>
          <h1 className="login-tagline">Your Cafe Awaits.</h1>
          <p className="login-subtitle">
            Login to continue serving customers and manage everything in one place.
          </p>
        </div>
        <p className="login-footer">© 2026 CATIPUNAN LOG</p>
      </aside>

      {/* ── RIGHT PANEL ── */}
      <main className="login-right">
        <div className="login-form-container">
          <h2 className="login-welcome">Welcome back!</h2>
          <p className="login-welcome-sub">Enter your credentials below</p>

          {/* Success Banner (shown after signup redirect) */}
          {showSuccessBanner && (
            <div className="login-success-banner">
              <CheckIcon />
              Account created! You can now log in.
            </div>
          )}

          {/* Global Error Banner */}
          {globalError && (
            <div className="login-error-banner">
              <AlertIcon />
              {globalError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>

            {/* ── Role Selector ── */}
            <div className="login-group">
              <label className="login-label">Login As</label>
              <div className="role-selector">
                {ROLES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={`role-btn${role === r ? ' role-btn--active' : ''}`}
                    onClick={() => handleRoleSelect(r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
              {errors.role && (
                <p className="field-error">
                  <AlertIcon />
                  {errors.role}
                </p>
              )}
            </div>

            {/* ── Username ── */}
            <div className="login-group">
              <label htmlFor="username" className="login-label">Username</label>
              <div className="input-wrap">
                <input
                  id="username"
                  type="text"
                  className={`login-input${errors.username ? ' login-input--error' : ''}`}
                  placeholder="Enter your username"
                  value={username}
                  onChange={handleUsernameChange}
                  autoComplete="username"
                  disabled={loading}
                />
              </div>
              {errors.username && (
                <p className="field-error">
                  <AlertIcon />
                  {errors.username}
                </p>
              )}
            </div>

            {/* ── Password ── */}
            <div className="login-group">
              <label htmlFor="password" className="login-label">Password</label>
              <div className="input-wrap">
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  className={`login-input login-input--password${errors.password ? ' login-input--error' : ''}`}
                  placeholder="••••••••"
                  value={password}
                  onChange={handlePasswordChange}
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPass(v => !v)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPass ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {errors.password && (
                <p className="field-error">
                  <AlertIcon />
                  {errors.password}
                </p>
              )}
            </div>

            {/* ── Submit Button ── */}
            <button
              type="submit"
              className="login-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  Logging in…
                </>
              ) : (
                'Log In'
              )}
            </button>

          </form>

          {/* ── Create Account ── */}
          <p className="login-create-account">
            New here?{' '}
            <button
              type="button"
              className="link-btn"
              onClick={onNavigateToSignup}
            >
              Create an account.
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}