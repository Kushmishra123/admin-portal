import React, { useState } from 'react';
import { API_URL } from '../config';

const LoginForm = ({ onLogin }) => {
  const [isResetMode, setIsResetMode] = useState(false);
  const [employeeCode, setEmployeeCode] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // Only for reset mode
  const [confirmPassword, setConfirmPassword] = useState(''); // Only for reset mode
  
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [loading, setLoading]   = useState(false);

  // Switch modes
  const toggleMode = () => {
    setIsResetMode(!isResetMode);
    setError('');
    setSuccess('');
    setPassword('');
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

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: employeeCode, name, newPassword: password })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Reset failed.');
      } else {
        setSuccess(data.message);
        // After 2 seconds, switch back to login mode
        setTimeout(() => {
          setIsResetMode(false);
          setSuccess('');
          setError('');
          setPassword('');
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
      <div className="form-box-tag">{isResetMode ? '🔐 PASSWORD RESET' : '🔐 SECURE LOGIN'}</div>
      
      {isResetMode ? (
        <>
          <h2>Reset Password</h2>
          <p>Verify your identity to reset your account</p>

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
              <label>Full Name (as per record)</label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label>New Password</label>
              <input
                type="password"
                placeholder="Min. 6 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
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
            </div>

            {error && <div className="error-msg"><span>⚠️</span> {error}</div>}
            {success && <div className="success-msg" style={{ color: '#76c733', background: 'rgba(118,199,51,0.1)', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}><span>✅</span> {success}</div>}

            <button type="submit" className="sign-in-btn" disabled={loading}>
              {loading ? '⏳ Resetting…' : 'Reset Password'}
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
                <span onClick={toggleMode} style={{ color: '#76c733', cursor: 'pointer', fontSize: '12px' }}>Forgot?</span>
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