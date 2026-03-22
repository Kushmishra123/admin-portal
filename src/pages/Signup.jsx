import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_URL } from '../config';
import logo from '../assets/qb.png';
import '../styles/login.css';
import '../styles/signup.css';
import LoaderButton from '../components/LoaderButton';

const Signup = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    employeeId: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    const payload = {
      employeeId: form.employeeId,
      name: form.name,
      email: form.email,
      password: form.password,
    };

    // ✅ LOG: What we are sending to the API
    console.log('📤 [SIGNUP PAGE] Sending to API:', {
      ...payload,
      password: '***hidden***',
    });

    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      // ✅ LOG: Full server response
      console.log('📬 [SIGNUP PAGE] Server response:', data);

      if (!response.ok) {
        setError(data.message || 'Signup failed. Please try again.');
      } else {
        setSuccess('✅ Account created successfully! Redirecting to login...');
        setTimeout(() => navigate('/'), 1800);
      }
    } catch (err) {
      console.error('❌ [SIGNUP PAGE] Network error:', err);
      setError('Network error. Make sure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* ── LEFT PANEL ── */}
      <div className="login-left">
        <div className="logo-wrapper">
          <img src={logo} alt="Quisitive Logo" className="qb-logo" />
          <span className="brand-name">Quisitive Businesses</span>
        </div>

        <h1>
          Join the<br />
          <span>Admin Portal</span>
        </h1>

        <p className="login-subtitle">
          Create your account to access your workspace,<br />
          manage your team, and stay in sync.
        </p>

        <div className="signup-steps">
          <div className="signup-step">
            <div className="step-icon">1</div>
            <div>
              <strong>Fill in your details</strong>
              <p>Use your official employee ID</p>
            </div>
          </div>
          <div className="signup-step">
            <div className="step-icon">2</div>
            <div>
              <strong>Set a password</strong>
              <p>Choose a secure password</p>
            </div>
          </div>
          <div className="signup-step">
            <div className="step-icon">3</div>
            <div>
              <strong>Start using the portal</strong>
              <p>Log in and manage your work</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="login-right">
        <div className="form-box">
          <div className="form-box-tag">🚀 CREATE ACCOUNT</div>
          <h2>Sign Up</h2>
          <p>Fill in the details below to get started</p>

          <form onSubmit={handleSubmit}>
            <div className="input-row">
              <div className="input-group">
                <label>Employee Code</label>
                <input
                  type="text"
                  name="employeeId"
                  placeholder="e.g. QBL-E0019"
                  value={form.employeeId}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g. John Doe"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label>Email Address <span style={{ color: '#666', fontWeight: 400 }}>(optional)</span></label>
              <input
                type="email"
                name="email"
                placeholder="e.g. john@quisitive.com"
                value={form.email}
                onChange={handleChange}
              />
            </div>

            <div className="input-row">
              <div className="input-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  placeholder="Choose a password"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Re-enter password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="error-msg">
                <span>⚠️</span> {error}
              </div>
            )}

            {success && (
              <div className="success-msg">
                {success}
              </div>
            )}

            <LoaderButton type="submit" className="sign-in-btn" disabled={loading}>
              {loading ? '⏳ Creating Account…' : 'Create Account →'}
            </LoaderButton>
          </form>

          <div className="signup-login-link">
            Already have an account?{' '}
            <Link to="/">Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
