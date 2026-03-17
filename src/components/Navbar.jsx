import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

const Navbar = ({ title, subtitle }) => {
  const { user, handleLogout } = useUser();
  const navigate = useNavigate();

  const onLogout = () => {
    handleLogout();
    navigate('/');
  };

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="navbar">
      <div className="nav-left">
        <div>
          <h2 className="nav-title">{title || 'Dashboard'}</h2>
          <p className="nav-subtitle">{subtitle || dateStr}</p>
        </div>
      </div>

      <div className="nav-right">
        <div className="nav-time">
          <span className="time-badge">🕐 {timeStr}</span>
        </div>

        <button className="nav-signout-btn" onClick={onLogout} title="Sign Out">
          <span>⏻</span>
        </button>

        <div className="nav-user">
          <div className="nav-text">
            <p className="nav-user-name">{user?.name}</p>
            <p className="nav-user-role">
              {user?.role === 'superadmin' ? 'Super Admin' : 'Admin'}
            </p>
          </div>
          <div className="nav-avatar">{user?.initials}</div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;