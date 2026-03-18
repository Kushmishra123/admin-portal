import React, { useState } from 'react';
import { API_URL } from '../config';

const LoginForm = ({ onLogin }) => {
  const [isResetMode, setIsResetMode] = useState(false);
  const [employeeCode, setEmployeeCode]     = useState('');
  const [password, setPassword]             = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]       = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Password strength helper
  const getStrength = (pwd) => {
    if (!pwd) return null;
    if (pwd.length < 6) return { label: 'Too short', color: '#f87171', pct: 20 };
    if (pwd.length < 8) return { label: 'Weak', color: '#fb923c', pct: 40 };
    if (!/[A-Z]/.test(pwd) || !/[0-9]/.test(pwd)) return { label: 'Fair', color: '#fbbf24', pct: 65 };
    if (!/[^A-Za-z0-9]/.test(pwd)) return { label: 'Good', color: '#a3e635', pct: 80 };
    return { label: 'Strong', color: '#4ade80', pct: 100 };
  };
  const strength = getStrength(newPassword);

  // Switch modes
  const toggleMode = () => {
    setIsResetMode(!isResetMode);
    setError('');
    setSuccess('');
    setPassword('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ employeeId: employeeCode, password })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Login failed. Please try again.');
      } else {
        onLogin({
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
          initials: data.user.initials,
          id: data.user.employeeId
        });
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Network error. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Client-side validation
    if (!currentPassword) {
      setError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and Confirm password do not match.');
      return;
    }
    if (currentPassword === newPassword) {
      setError('New password must be different from the current password.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          employeeId: employeeCode,
          currentPassword,
          newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Reset failed.');
      } else {
        setSuccess(data.message);
        // After 3 seconds, switch back to login mode
        setTimeout(() => {
          setIsResetMode(false);
          setSuccess('');
          setError('');
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        }, 3000);
      }
    } catch (err) {
      console.error('Reset error:', err);
      setError('Network error. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-box">
      <div className="form-box-tag">{isResetMode ? '🔒 RESET PASSWORD' : '🔐 SECURE LOGIN'}</div>

      {isResetMode ? (
        <>
          <h2>Reset Password</h2>
          <p>Enter your current password and choose a new one</p>

          <form onSubmit={handleResetSubmit}>
            <div className="input-group">
              <label>Employee Code</label>
              <input
                type="text"
                placeholder="e.g. QBL-E0018"
                value={employeeCode}
                onChange={e => setEmployeeCode(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label>Current Password</label>
              <input
                type="password"
                placeholder="Enter your current password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label>New Password</label>
              <input
                type="password"
                placeholder="Min. 6 characters"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
              {newPassword && strength && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ height: 4, borderRadius: 4, background: '#222', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${strength.pct}%`, background: strength.color, transition: 'width 0.3s, background 0.3s', borderRadius: 4 }} />
                  </div>
                  <span style={{ fontSize: 11, color: strength.color }}>{strength.label}</span>
                </div>
              )}
            </div>

            <div className="input-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
              {confirmPassword && newPassword && (
                <span style={{ fontSize: 11, color: confirmPassword === newPassword ? '#4ade80' : '#f87171', marginTop: 4, display: 'block' }}>
                  {confirmPassword === newPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                </span>
              )}
            </div>

            {error   && <div className="error-msg"><span>⚠️</span> {error}</div>}
            {success && (
              <div style={{ color: '#76c733', background: 'rgba(118,199,51,0.1)', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                <span>✅</span> {success}
              </div>
            )}

            <button type="submit" className="sign-in-btn" disabled={loading}>
              {loading ? '⏳ Resetting…' : '🔒 Reset Password'}
            </button>

            <button type="button" onClick={toggleMode} style={{ background: 'transparent', border: 'none', color: '#6b7b6b', cursor: 'pointer', marginTop: '16px', fontSize: '14px', width: '100%' }}>
              ← Back to Login
            </button>
          </form>
        </>
      ) : (
        <>
          <h2>Welcome back</h2>
          <p>Sign in to your Quisitive Business account</p>

          <form onSubmit={handleLoginSubmit}>
            <div className="input-group">
              <label>Employee Code</label>
              <input
                type="text"
                placeholder="e.g. QBL-E0018"
                value={employeeCode}
                onChange={e => setEmployeeCode(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                Password
                <span onClick={toggleMode} style={{ color: '#76c733', cursor: 'pointer', fontSize: '12px' }}>Reset Password?</span>
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <div className="error-msg"><span>⚠️</span> {error}</div>}

            <button type="submit" className="sign-in-btn" disabled={loading}>
              {loading ? '⏳ Signing in…' : 'Sign In →'}
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default LoginForm;