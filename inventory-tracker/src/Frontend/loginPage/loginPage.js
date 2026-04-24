import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../api';
import logo from '../images/inventory_logo.png';
import './loginPage.css';

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = useCallback(async (e) => {
    e.preventDefault();

    if (!username.trim()) {
      alert('Please enter a username.');
      return;
    }

    if (isCreatingAccount && password !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isCreatingAccount) {
        await authAPI.register({
          username: username.trim(),
          password,
        });
        alert('Account created. Please sign in.');
        setIsCreatingAccount(false);
        setConfirmPassword('');
      } else {
        await authAPI.login({
          username: username.trim(),
          password,
        });
        navigate('/home');
      }
    } catch (error) {
      alert(isCreatingAccount ? 'Unable to create account. Try a different username or stronger password.' : 'Invalid username or password.');
    } finally {
      setIsSubmitting(false);
    }
  }, [username, password, confirmPassword, isCreatingAccount, navigate]);

  const handleForgotLogin = useCallback((e) => {
    e.preventDefault();
    alert('Please contact an administrator to reset your password.');
  }, []);

  const toggleAuthMode = useCallback(() => {
    setIsCreatingAccount((prev) => !prev);
    setConfirmPassword('');
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

            <button type="submit" className="login-button" disabled={isSubmitting}>
              {isSubmitting
                ? (isCreatingAccount ? 'Creating Account...' : 'Signing In...')
                : (isCreatingAccount ? 'Create Account' : 'Sign In')}
            </button>

            <button type="button" className="switch-auth-button" onClick={toggleAuthMode} disabled={isSubmitting}>
              {isCreatingAccount ? 'Back to Sign In' : 'Create Account'}
            </button>

            {!isCreatingAccount && (
              <div className="forgot-login-container">
                <a href="/forgot-password" onClick={handleForgotLogin}>
                  Forgot your login?
                </a>
              </div>
            )}
          </form>
        </div>
      </div>

    </div>
  );
}

export default LoginPage;
