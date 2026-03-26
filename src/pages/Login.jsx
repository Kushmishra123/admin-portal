import React from 'react';
import { Link } from 'react-router-dom';
import LoginForm from '../components/LoginForm';
import logo from '../assets/qb.png';
import '../styles/login.css';

const Login = ({ onLogin }) => {
  return (
    <div className="login-container">
      {/* Left Panel */}
      <div className="login-left">
        <div className="logo-wrapper">
          <img src={logo} alt="Quisitive Logo" className="qb-logo" />
          {/* <span className="brand-name">Quisitive Businesses</span> */}
        </div>

        <h1>
          Welcome to<br />
          <span>QB Employee Portal</span>
        </h1>

        <p className="login-subtitle">
          Your all-in-one workspace for managing teams,<br />
          tracking performance, and growing together.
        </p>

      </div>

      {/* Right Panel */}
      <div className="login-right">
        <LoginForm onLogin={onLogin} />
        {/* <div className="signup-login-link" style={{ textAlign: 'center', marginTop: '1.2rem' }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: '#5cb85c', fontWeight: 600, textDecoration: 'none' }}>
            Sign Up
          </Link>
        </div> */}
      </div>
    </div>
  );
};

export default Login;