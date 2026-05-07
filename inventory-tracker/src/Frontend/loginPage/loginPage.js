import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../api';
import RecoveryCodeModal from './RecoveryCodeModal';
import ResetPasswordModal from './ResetPasswordModal';
import logo from '../images/inventory_logo.png';
import './loginPage.css';

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Recovery code shown right after signup (or after login for legacy users).
  // The user must explicitly acknowledge it before being routed to the dashboard.
  const [recoveryCode, setRecoveryCode] = useState(null);
  const [recoveryHeading, setRecoveryHeading] = useState('Save your recovery code');
  const [pendingDestination, setPendingDestination] = useState('/home');

  // Forgot-password modal state
  const [showResetModal, setShowResetModal] = useState(false);

  const handleLogin = useCallback(async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Please enter a username.');
      return;
    }

    if (isCreatingAccount && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isCreatingAccount) {
        const data = await authAPI.register({
          username: username.trim(),
          password,
        });
        setRecoveryHeading('Save your recovery code');
        setRecoveryCode(data.recovery_code);
        setPendingDestination('/home');
      } else {
        const data = await authAPI.login({
          username: username.trim(),
          password,
        });
        if (data.recovery_code) {
          // Existing pre-recovery-code user: show the freshly-issued code once.
          setRecoveryHeading('Your recovery code');
          setRecoveryCode(data.recovery_code);
          setPendingDestination('/home');
        } else {
          navigate('/home');
        }
      }
    } catch (err) {
      if (isCreatingAccount) {
        setError(err.message || 'Unable to create account. Try a different username.');
      } else {
        setError(err.status === 401
          ? 'Invalid username or password.'
          : (err.message || 'Sign-in failed. Please try again.'));
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [username, password, confirmPassword, isCreatingAccount, navigate]);

  const handleForgotLogin = useCallback((e) => {
    e.preventDefault();
    setError('');
    setShowResetModal(true);
  }, []);

  const handleResetSuccess = useCallback((newCode) => {
    setShowResetModal(false);
    setRecoveryHeading('Password reset — save your new recovery code');
    setRecoveryCode(newCode);
    setPendingDestination('/home');
  }, []);

  const handleAcknowledgeRecoveryCode = useCallback(() => {
    setRecoveryCode(null);
    if (isCreatingAccount) {
      // Reset the form, drop into "sign in" mode for clarity, then navigate.
      setIsCreatingAccount(false);
      setConfirmPassword('');
    }
    navigate(pendingDestination);
  }, [isCreatingAccount, navigate, pendingDestination]);

  const toggleAuthMode = useCallback(() => {
    setIsCreatingAccount((prev) => !prev);
    setConfirmPassword('');
    setError('');
  }, []);

  return (
    <div className="login-container">

      {/* --- Left branding panel --- */}
      <div className="login-brand">
        <img src={logo} className="login-logo" alt="logo" />
        <h1>Inventory Tracker</h1>
        <p>Manage your stock, sales, and recipes all in one place.</p>
      </div>

      {/* --- Right form panel --- */}
      <div className="login-form-panel">
        <div className="login-box">
          <h2>{isCreatingAccount ? 'Create account' : 'Welcome back'}</h2>
          <p className="login-subtitle">
            {isCreatingAccount
              ? 'Create a new user account for this inventory system.'
              : 'Sign in to your account to continue.'}
          </p>

          <form className="login-form" onSubmit={handleLogin}>
            <div className="input-group">
              <label>Username</label>
              <input
                type="text"
                placeholder="Enter your username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                placeholder={isCreatingAccount ? 'Create a password' : 'Enter your password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {isCreatingAccount && (
              <div className="input-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  placeholder="Re-enter your password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            )}

            {error && <div className="login-error" role="alert">{error}</div>}

            <button type="submit" className="login-button" disabled={isSubmitting}>
              {isSubmitting
                ? (isCreatingAccount ? 'Creating Account...' : 'Signing In...')
                : (isCreatingAccount ? 'Create Account' : 'Sign In')}
            </button>

            <button type="button" className="switch-auth-button" onClick={toggleAuthMode} disabled={isSubmitting}>
              {isCreatingAccount ? 'Back to Sign In' : 'Sign Up'}
            </button>

            {!isCreatingAccount && (
              <div className="forgot-login-container">
                <a href="#reset" onClick={handleForgotLogin}>
                  Forgot your password?
                </a>
              </div>
            )}
          </form>
        </div>
      </div>

      {recoveryCode && (
        <RecoveryCodeModal
          heading={recoveryHeading}
          code={recoveryCode}
          onAcknowledge={handleAcknowledgeRecoveryCode}
        />
      )}

      {showResetModal && (
        <ResetPasswordModal
          onClose={() => setShowResetModal(false)}
          onSuccess={handleResetSuccess}
          initialUsername={username}
        />
      )}

    </div>
  );
}

export default LoginPage;
