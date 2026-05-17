// client/src/pages/SignUpPage.jsx
import { useState } from 'react';
import '../styles/SignupPage.css';

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
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

// ─── SignUpPage Component ─────────────────────────────────
// Props:
//   onSignUpSuccess     — called (no args) after successful registration; parent should
//                         navigate to login and set showSuccessBanner=true
//   onNavigateToLogin   — called when user clicks "Log In" link
export default function SignUpPage({ onSignUpSuccess, onNavigateToLogin }) {
  const [role,            setRole]            = useState('');
  const [fullName,        setFullName]        = useState('');
  const [email,           setEmail]           = useState('');
  const [username,        setUsername]        = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms,   setAgreedToTerms]   = useState(false);
  const [showPass,        setShowPass]        = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [globalError,     setGlobalError]     = useState('');
  const [errors, setErrors] = useState({
    role: '', fullName: '', email: '', username: '',
    password: '', confirmPassword: '', terms: '',
  });

  const ROLES = ['Cashier', 'Staff'];

  // ── Validation ───────────────────────────────────────────
  const validate = () => {
    const e = { role: '', fullName: '', email: '', username: '', password: '', confirmPassword: '', terms: '' };
    let valid = true;

    if (!role) {
      e.role = 'Please select a role.';
      valid = false;
    }

    const nameTrimmed = fullName.trim();
    if (!nameTrimmed) {
      e.fullName = 'Full name is required.';
      valid = false;
    } else if (!/^[a-zA-Z\s'-]+$/.test(nameTrimmed)) {
      e.fullName = 'Full name must contain letters only.';
      valid = false;
    } else if (nameTrimmed.split(/\s+/).filter(Boolean).length < 2) {
      e.fullName = 'Please enter your first and last name.';
      valid = false;
    }

    if (!email.trim()) {
      e.email = 'Email is required.';
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      e.email = 'Please enter a valid email address.';
      valid = false;
    }

    if (!username.trim()) {
      e.username = 'Username is required.';
      valid = false;
    } else if (username.trim().length < 4) {
      e.username = 'Username must be at least 4 characters.';
      valid = false;
    } else if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      e.username = 'Username can only contain letters, numbers, and underscores.';
      valid = false;
    }

    if (!password) {
      e.password = 'Password is required.';
      valid = false;
    } else if (password.length < 8) {
      e.password = 'Password must be at least 8 characters.';
      valid = false;
    }

    if (!confirmPassword) {
      e.confirmPassword = 'Please confirm your password.';
      valid = false;
    } else if (password !== confirmPassword) {
      e.confirmPassword = 'Passwords do not match.';
      valid = false;
    }

    if (!agreedToTerms) {
      e.terms = 'You must agree to the terms of service.';
      valid = false;
    }

    setErrors(e);
    return valid;
  };

  // ── Submit ───────────────────────────────────────────────
  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setGlobalError('');

    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email:     email.trim(),
          username:  username.trim(),
          password,
          role:      role.toLowerCase(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle specific duplicate errors
        if (data.message?.toLowerCase().includes('username')) {
          setErrors(prev => ({ ...prev, username: data.message }));
        } else if (data.message?.toLowerCase().includes('email')) {
          setErrors(prev => ({ ...prev, email: data.message }));
        } else {
          setGlobalError(data.message || 'Registration failed. Please try again.');
        }
        return;
      }

      // Success — parent navigates to login and shows success banner
      if (onSignUpSuccess) onSignUpSuccess();

    } catch {
      setGlobalError('Unable to connect to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Field change helpers ─────────────────────────────────
  const clearError = (field) =>
    setErrors(prev => ({ ...prev, [field]: '' }));

  return (
    <div className="signup-page">

      {/* ── LEFT PANEL (Form) ── */}
      <main className="signup-left">
        <div className="signup-form-container">
          <h2 className="signup-heading">Join us!</h2>
          <p className="signup-sub">Enter your credentials below</p>

          {/* Global Error */}
          {globalError && (
            <div className="signup-error-banner">
              <AlertIcon />
              {globalError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>

            {/* ── Role Selector ── */}
            <div className="signup-group">
              <label className="signup-label">Creating As</label>
              <div className="role-selector">
                {ROLES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={`role-btn${role === r ? ' role-btn--active' : ''}`}
                    onClick={() => { setRole(r); clearError('role'); }}
                  >
                    {r}
                  </button>
                ))}
              </div>
              {errors.role && (
                <p className="field-error"><AlertIcon />{errors.role}</p>
              )}
            </div>

            {/* ── Full Name ── */}
            <div className="signup-group">
              <label htmlFor="fullName" className="signup-label">Full Name</label>
              <input
                id="fullName"
                type="text"
                className={`signup-input${errors.fullName ? ' signup-input--error' : ''}`}
                placeholder="Enter your name"
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); clearError('fullName'); }}
                autoComplete="name"
                disabled={loading}
              />
              {errors.fullName && (
                <p className="field-error"><AlertIcon />{errors.fullName}</p>
              )}
            </div>

            {/* ── Email ── */}
            <div className="signup-group">
              <label htmlFor="email" className="signup-label">Email</label>
              <input
                id="email"
                type="email"
                className={`signup-input${errors.email ? ' signup-input--error' : ''}`}
                placeholder="example@email.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearError('email'); }}
                autoComplete="email"
                disabled={loading}
              />
              {errors.email && (
                <p className="field-error"><AlertIcon />{errors.email}</p>
              )}
            </div>

            {/* ── Username ── */}
            <div className="signup-group">
              <label htmlFor="username" className="signup-label">Username</label>
              <input
                id="username"
                type="text"
                className={`signup-input${errors.username ? ' signup-input--error' : ''}`}
                placeholder="Enter your username"
                value={username}
                onChange={(e) => { setUsername(e.target.value); clearError('username'); }}
                autoComplete="username"
                disabled={loading}
              />
              {errors.username && (
                <p className="field-error"><AlertIcon />{errors.username}</p>
              )}
            </div>

            {/* ── Password ── */}
            <div className="signup-group">
              <label htmlFor="password" className="signup-label">Password</label>
              <div className="input-wrap">
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  className={`signup-input signup-input--password${errors.password ? ' signup-input--error' : ''}`}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearError('password'); }}
                  autoComplete="new-password"
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
                <p className="field-error"><AlertIcon />{errors.password}</p>
              )}
            </div>

            {/* ── Confirm Password ── */}
            <div className="signup-group">
              <label htmlFor="confirmPassword" className="signup-label">Confirm Password</label>
              <div className="input-wrap">
                <input
                  id="confirmPassword"
                  type={showConfirmPass ? 'text' : 'password'}
                  className={`signup-input signup-input--password${errors.confirmPassword ? ' signup-input--error' : ''}`}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); clearError('confirmPassword'); }}
                  autoComplete="new-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPass(v => !v)}
                  aria-label={showConfirmPass ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showConfirmPass ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="field-error"><AlertIcon />{errors.confirmPassword}</p>
              )}
            </div>

            {/* ── Terms Checkbox ── */}
            <div className="signup-group signup-group--terms">
              <label className="terms-label">
                <span
                  className={`custom-checkbox${agreedToTerms ? ' custom-checkbox--checked' : ''}${errors.terms ? ' custom-checkbox--error' : ''}`}
                  onClick={() => { setAgreedToTerms(v => !v); clearError('terms'); }}
                  role="checkbox"
                  aria-checked={agreedToTerms}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === ' ' && setAgreedToTerms(v => !v)}
                >
                  {agreedToTerms && <CheckIcon />}
                </span>
                <span className="terms-text">I agree to terms of service</span>
              </label>
              {errors.terms && (
                <p className="field-error"><AlertIcon />{errors.terms}</p>
              )}
            </div>

            {/* ── Submit ── */}
            <button
              type="submit"
              className="signup-btn"
              disabled={loading}
            >
              {loading ? (
                <><span className="spinner" />Creating account…</>
              ) : (
                'Start my Journey'
              )}
            </button>

          </form>

          {/* ── Login redirect ── */}
          <p className="signup-login-link">
            Already have account?{' '}
            <button
              type="button"
              className="link-btn"
              onClick={onNavigateToLogin}
            >
              Log In.
            </button>
          </p>
        </div>
      </main>

      {/* ── RIGHT PANEL (Branding) ── */}
      <aside className="signup-right">
        <div className="signup-right-content">
          <div className="signup-logo-wrap">
            <img
              src="/icon.png"
              alt="Catipunan Pet Cafe Logo"
              className="signup-logo"
            />
          </div>
          <h1 className="signup-tagline">Ready to Serve? Sign Up.</h1>
          <p className="signup-subtitle">
            Create an account to start serving customers and manage everything in one place.
          </p>
        </div>
        <p className="signup-footer">© 2026 CATIPUNAN LOG</p>
      </aside>

    </div>
  );
}