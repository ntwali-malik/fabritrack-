import React, { useState } from 'react';
import { login, signUp } from '../services/userService';
import { setAuthToken } from '../services/apiClient';
import './AuthModal.css';

const UserIcon = () => (
  <svg className="auth-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const LockIcon = () => (
  <svg className="auth-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const EnvelopeIcon = () => (
  <svg className="auth-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const EyeOpenIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeClosedIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

function getFriendlyLoginError(err) {
  const status = err.status || (err.response && err.response.status);
  const msg = (err.message || '').trim();
  if (status === 403 || /403/.test(msg)) {
    if (msg) return msg;
    const userStatus = (err.userStatus || err.code) ? String(err.userStatus || err.code).toUpperCase() : null;
    if (userStatus === 'PENDING_APPROVAL') return 'Your account is pending approval by an administrator. You will be able to sign in after approval.';
    if (userStatus === 'SUSPENDED') return 'Your account has been suspended. Please contact an administrator.';
    if (userStatus === 'INACTIVE') return 'Your account is inactive. Please contact an administrator.';
    return 'Your account cannot be used to sign in. Please contact an administrator.';
  }
  if (status === 401 || /401/.test(msg)) {
    return 'Invalid email or password. Please try again.';
  }
  if (status === 400 || /400/.test(msg)) {
    return 'Invalid request. Please check your email and password.';
  }
  if (status >= 500 || /5\d{2}/.test(msg) || /network|failed to fetch/i.test(msg)) {
    return "We're having trouble connecting. Please try again later.";
  }
  if (msg && !/\b(403|401|400|500|502|503|HTTP\s*\d+)\b/.test(msg)) {
    return msg;
  }
  return 'Sign in failed. Please check your credentials and try again.';
}

function isAccountAccessError(err) {
  return err.status === 403 || (err.response && err.response.status === 403);
}

const PENDING_APPROVAL_MSG = 'Your account is pending approval or has been deactivated. Please contact an administrator.';

function formatAccountStatus(status) {
  if (!status) return null;
  const s = String(status).toUpperCase().replace(/_/g, ' ');
  return s.charAt(0) + s.slice(1).toLowerCase();
}

function getFriendlySignupError(err) {
  const status = err.status || (err.response && err.response.status);
  const msg = (err.message || '').trim();
  if (status === 403 || /403/.test(msg)) {
    return 'Registration is not allowed at this time. Please contact an administrator.';
  }
  if (status === 400 || /400/.test(msg) || /already in use|duplicate|exists/i.test(msg)) {
    return 'This email may already be in use. Try signing in or use a different email.';
  }
  if (status >= 500 || /5\d{2}/.test(msg) || /network|failed to fetch/i.test(msg)) {
    return "We're having trouble connecting. Please try again later.";
  }
  if (msg && !/\b(403|401|400|500|502|503|HTTP\s*\d+)\b/.test(msg)) {
    return msg;
  }
  return 'Sign up failed. Please try again or contact support.';
}

function AuthModal({ onLoginSuccess, onClose }) {
  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showLoginErrorModal, setShowLoginErrorModal] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '', department: 'IT' });
  const [signupSuccessMessage, setSignupSuccessMessage] = useState('');
  const [showSignupSuccessModal, setShowSignupSuccessModal] = useState(false);
  const [showPendingApprovalModal, setShowPendingApprovalModal] = useState(false);
  const [pendingApprovalStatus, setPendingApprovalStatus] = useState(null);

  const DEPARTMENT_OPTIONS = [
    { value: 'HR', label: 'HR' },
    { value: 'IT', label: 'IT' },
    { value: 'FINANCE', label: 'Finance' },
    { value: 'OPERATIONS', label: 'Operations' },
    { value: 'MARKETING', label: 'Marketing' },
    { value: 'LEGAL', label: 'Legal' },
    { value: 'LOGISTICS', label: 'Logistics' },
    { value: 'MANAGEMENT', label: 'Management' },
    { value: 'SECURITY', label: 'Security' },
  ];
  const switchMode = (next) => {
    setShowPassword(false);
    setError('');
    setShowLoginErrorModal(false);
    setSignupSuccessMessage('');
    setShowSignupSuccessModal(false);
    setShowPendingApprovalModal(false);
    setPendingApprovalStatus(null);
    setMode(next);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setShowLoginErrorModal(false);
    if (!loginForm.email?.trim() || !loginForm.password) {
      setError('Please enter email and password.');
      setShowLoginErrorModal(true);
      return;
    }
    setLoading(true);
    try {
      const { token, user } = await login({
        email: loginForm.email.trim(),
        password: loginForm.password,
      });
      setAuthToken(token);
      onLoginSuccess?.({ token, user, rememberMe });
    } catch (err) {
      const friendlyMsg = getFriendlyLoginError(err);
      setError(friendlyMsg);
      if (isAccountAccessError(err)) {
        setShowPendingApprovalModal(true);
        setPendingApprovalStatus(err.userStatus ?? null);
      } else {
        setShowLoginErrorModal(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSignupSuccessMessage('');
    if (!signupForm.email?.trim() || !signupForm.password) {
      setError('Please enter email and password.');
      return;
    }
    setLoading(true);
    try {
      const namePart = (signupForm.name || '').trim().split(/\s+/).filter(Boolean);
      const firstName = namePart[0] ?? '';
      const lastName = namePart.slice(1).join(' ') || '.';
      const data = await signUp({
        email: signupForm.email.trim(),
        password: signupForm.password,
        firstName: firstName || signupForm.email.trim().split('@')[0],
        lastName: lastName,
        department: signupForm.department || 'IT',
      });
      setSignupSuccessMessage(data.message || 'Registration submitted. An administrator will review your account. You will be able to sign in after approval.');
      setSignupForm({ name: '', email: '', password: '', department: 'IT' });
      setShowSignupSuccessModal(true);
    } catch (err) {
      setError(getFriendlySignupError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`auth-page-wrapper${onClose ? ' auth-page-wrapper--overlay' : ''}`}>
      {onClose && (
        <div
          className="auth-page-backdrop"
          onClick={onClose}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Escape' && onClose()}
          aria-label="Close"
        />
      )}
      <div className="auth-page">
        {onClose && (
          <button
            type="button"
            className="auth-page-close"
            onClick={onClose}
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
        <div className="auth-modal">

        {/* ── Left: Brand panel ── */}
        <div className="auth-modal__welcome">
          <div className="auth-modal__circles">
            <span className="auth-circle auth-circle--1" />
            <span className="auth-circle auth-circle--2" />
            <span className="auth-circle auth-circle--3" />
          </div>
          <div className="auth-modal__welcome-content">
            <div className="auth-modal__logo-wrap">
              <img
                src={`${process.env.PUBLIC_URL || ''}/logo-w.png`}
                alt="Fabritech"
                className="auth-modal__logo"
              />
            </div>
            <p className="auth-modal__welcome-title">Welcome to</p>
            <h2 className="auth-modal__welcome-headline">
              Fabri<span>track</span>
            </h2>
            <p className="auth-modal__welcome-desc">
              Precision-built solutions for the modern enterprise. Sign in to access your dashboard.
            </p>
          </div>
        </div>

        {/* ── Right: Form panel ── */}
        <div className="auth-modal__form-wrap">
          <div key={mode} className="auth-modal__form-block">

            {mode === 'login' ? (
              <>
                <h1 className="auth-modal__form-title">Sign In</h1>
                <p className="auth-modal__form-subtitle">Enter your credentials to continue.</p>

                {error && !showPendingApprovalModal && (
                  <div className="auth-error" role="alert">
                    {error}
                  </div>
                )}
                <form className="auth-modal__form" onSubmit={handleLoginSubmit}>
                  <div className="auth-input-wrap">
                    <EnvelopeIcon />
                    <span className="auth-input-divider" />
                    <input
                      type="email"
                      placeholder="Email address"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm((p) => ({ ...p, email: e.target.value }))}
                      className="auth-input"
                      autoComplete="email"
                    />
                  </div>

                  <div className="auth-input-wrap">
                    <LockIcon />
                    <span className="auth-input-divider" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))}
                      className="auth-input"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="auth-show-btn"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
                    </button>
                  </div>

                  <div className="auth-options">
                    <label className={`auth-remember ${rememberMe ? 'auth-remember--checked' : ''}`}>
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="auth-remember-input"
                      />
                      <span>Remember me</span>
                    </label>
                    <a href="#forgot" className="auth-link">Forgot password?</a>
                  </div>

                  <button type="submit" className="auth-btn auth-btn--primary" disabled={loading}>
                    {loading ? 'Signing in…' : 'Sign In'}
                  </button>
                </form>

                <p className="auth-modal__footer">
                  Don&apos;t have an account?{' '}
                  <button type="button" className="auth-footer-link" onClick={() => switchMode('signup')}>
                    Sign up
                  </button>
                </p>
              </>
            ) : (
              <>
                <h1 className="auth-modal__form-title">Sign Up</h1>
                <p className="auth-modal__form-subtitle">Create your Fabritech account.</p>

                {error && (
                  <div className="auth-error" role="alert">
                    {error}
                  </div>
                )}
                <form className="auth-modal__form" onSubmit={handleSignupSubmit}>
                  <div className="auth-input-wrap">
                    <UserIcon />
                    <span className="auth-input-divider" />
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={signupForm.name}
                      onChange={(e) => setSignupForm((p) => ({ ...p, name: e.target.value }))}
                      className="auth-input"
                      autoComplete="name"
                    />
                  </div>

                  <div className="auth-input-wrap">
                    <EnvelopeIcon />
                    <span className="auth-input-divider" />
                    <input
                      type="email"
                      placeholder="Email address"
                      value={signupForm.email}
                      onChange={(e) => setSignupForm((p) => ({ ...p, email: e.target.value }))}
                      className="auth-input"
                      autoComplete="email"
                    />
                  </div>

                  <div className="auth-input-wrap">
                    <LockIcon />
                    <span className="auth-input-divider" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      value={signupForm.password}
                      onChange={(e) => setSignupForm((p) => ({ ...p, password: e.target.value }))}
                      className="auth-input"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="auth-show-btn"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
                    </button>
                  </div>

                  <div className="auth-input-wrap auth-input-wrap--select">
                    <label htmlFor="signup-department" className="auth-select-label">Department</label>
                    <select
                      id="signup-department"
                      value={signupForm.department || 'IT'}
                      onChange={(e) => setSignupForm((p) => ({ ...p, department: e.target.value }))}
                      className="auth-select"
                      autoComplete="organization-unit"
                    >
                      {DEPARTMENT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <button type="submit" className="auth-btn auth-btn--primary" disabled={loading}>
                    {loading ? 'Creating account…' : 'Create Account'}
                  </button>
                </form>

                <div className="auth-divider">
                  <span className="auth-divider-line" />
                  <span className="auth-divider-text">or continue with</span>
                  <span className="auth-divider-line" />
                </div>

                <button type="button" className="auth-btn auth-btn--secondary">
                  Sign Up with SSO
                </button>

                <p className="auth-modal__footer">
                  Already have an account?{' '}
                  <button type="button" className="auth-footer-link" onClick={() => switchMode('login')}>
                    Sign in
                  </button>
                </p>
              </>
            )}
          </div>
        </div>

      </div>
      {/* Signup success modal */}
      {showSignupSuccessModal && signupSuccessMessage && (
        <div className="auth-success-modal-overlay" onClick={() => { setShowSignupSuccessModal(false); switchMode('login'); }}>
          <div className="auth-success-modal" onClick={(e) => e.stopPropagation()}>
            <div className="auth-success-modal__icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h3 className="auth-success-modal__title">Registration submitted</h3>
            <p className="auth-success-modal__message">{signupSuccessMessage}</p>
            <button type="button" className="auth-success-modal__btn" onClick={() => { setShowSignupSuccessModal(false); switchMode('login'); }}>
              Go to Sign in
            </button>
          </div>
        </div>
      )}
      {/* Pending approval / deactivated account modal */}
      {showPendingApprovalModal && (
        <div className="auth-success-modal-overlay auth-pending-modal-overlay" onClick={() => { setShowPendingApprovalModal(false); setError(''); setPendingApprovalStatus(null); }}>
          <div className="auth-success-modal auth-pending-modal" onClick={(e) => e.stopPropagation()}>
            <div className="auth-pending-modal__icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h3 className="auth-success-modal__title">Account access</h3>
            <p className="auth-success-modal__message">{error || PENDING_APPROVAL_MSG}</p>
            <button type="button" className="auth-success-modal__btn" onClick={() => { setShowPendingApprovalModal(false); setError(''); setPendingApprovalStatus(null); }}>
              OK
            </button>
          </div>
        </div>
      )}
      {/* Login error modal (e.g. invalid email/password) */}
      {showLoginErrorModal && !!error && !showPendingApprovalModal && (
        <div className="auth-success-modal-overlay auth-error-modal-overlay" onClick={() => { setShowLoginErrorModal(false); }}>
          <div className="auth-success-modal auth-error-modal" onClick={(e) => e.stopPropagation()}>
            <div className="auth-error-modal__icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="13" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h3 className="auth-success-modal__title">Sign in failed</h3>
            <p className="auth-success-modal__message">{error}</p>
            <button type="button" className="auth-success-modal__btn" onClick={() => { setShowLoginErrorModal(false); }}>
              OK
            </button>
          </div>
        </div>
      )}
      <footer className="auth-page__copyright">
        © {new Date().getFullYear()} Fabritrack. All rights reserved.
      </footer>
    </div>
    </div>
  );
}

export default AuthModal;