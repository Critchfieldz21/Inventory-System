import React, { useState, useCallback } from 'react';
import { authAPI } from '../../api';

function ResetPasswordModal({ onClose, onSuccess, initialUsername = '' }) {
  const [username, setUsername] = useState(initialUsername);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !recoveryCode.trim() || !newPassword) {
      setError('Please fill in every field.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await authAPI.resetPassword({
        username: username.trim(),
        recovery_code: recoveryCode.trim(),
        new_password: newPassword,
      });
      onSuccess(data.recovery_code);
    } catch (err) {
      setError(err.message || 'Reset failed. Check your recovery code and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [username, recoveryCode, newPassword, confirmPassword, onSuccess]);

  return (
    <div className="recovery-overlay" role="dialog" aria-modal="true" aria-labelledby="reset-heading">
      <div className="recovery-modal">
        <h3 id="reset-heading">Reset password</h3>
        <p className="recovery-explainer">
          Enter the recovery code you saved when you signed up. We&apos;ll set a
          new password and issue a fresh recovery code.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div className="input-group">
            <label>Recovery code</label>
            <input
              type="text"
              placeholder="XXXX-XXXX-XXXX-XXXX"
              value={recoveryCode}
              onChange={(e) => setRecoveryCode(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label>New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label>Confirm new password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="login-error" role="alert">{error}</div>}

          <button type="submit" className="login-button" disabled={isSubmitting}>
            {isSubmitting ? 'Resetting...' : 'Reset password'}
          </button>
          <button
            type="button"
            className="switch-auth-button"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPasswordModal;
