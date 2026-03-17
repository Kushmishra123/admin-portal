import React, { useState } from 'react';
import { API_URL } from '../config';

const SignupForm = ({ onSignupSuccess }) => {
  const [employeeCode, setEmployeeCode] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: employeeCode,
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Signup failed.');
      } else {
        // Automatically login or trigger login view
        onSignupSuccess();
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError('Network error. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-box">
      <div className="form-box-tag">🚀 JOIN US</div>
      <h2>Create an Account</h2>
      <p>Sign up for your new Quisitive Business account</p>

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>Employee Code</label>
          <input
            type="text"
            placeholder="e.g. QBL-E0018"
            value={employeeCode}
            onChange={(e) => setEmployeeCode(e.target.value)}
            required
          />
        </div>
        
        <div className="input-group">
          <label>Full Name</label>
          <input
            type="text"
            placeholder="e.g. John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <label>Email (Optional)</label>
          <input
            type="email"
            placeholder="e.g. john@quisitive.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label>Password</label>
          <input
            type="password"
            placeholder="Choose a strong password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <div className="error-msg">
            <span>⚠️</span> {error}
          </div>
        )}

        <button type="submit" className="sign-in-btn" disabled={loading}>
          {loading ? '⏳ Creating Account…' : 'Sign Up →'}
        </button>
      </form>
    </div>
  );
};

export default SignupForm;
