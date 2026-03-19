import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import logo from '../assets/qb.png';

const Sidebar = () => {
  const { user, handleLogout, isSidebarCollapsed, setIsSidebarCollapsed } = useUser();
  const navigate = useNavigate();

  const onLogout = () => {
    handleLogout();
    navigate('/');
  };

  const adminLinks = [
    { to: '/employees', icon: '👥', label: 'Employee Directory' },
    { to: '/analytics', icon: '📈', label: 'Analytics' },
    { to: '/dashboard', icon: '📊', label: 'Dashboard' },
    { to: '/manage-leaves', icon: '📅', label: 'Manage Leaves' },
    { to: '/settings', icon: '⚙️', label: 'Settings' },
    { to: '/about', icon: '🏢', label: 'About Company' },
  ];

  const employeeLinks = [
    { to: '/dashboard', icon: '📊', label: 'Dashboard' },
    { to: '/my-leaves', icon: '📅', label: 'My Leaves' },
    { to: '/about', icon: '🏢', label: 'About Company' },
    { to: '/settings', icon: '⚙️', label: 'Settings' },
  ];

  const links = user?.role === 'superadmin' ? adminLinks : employeeLinks;

  return (
    <div className={`left-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
      {/* Toggle Button */}
      <button
        className="sidebar-toggle-btn"
        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {isSidebarCollapsed ? '»' : '«'}
      </button>

      {/* Brand */}
      <div className="sidebar-brand">
        <img src={logo} alt="QB Logo" style={{ width: 42, height: 'auto', borderRadius: 10 }} />
        <div className="brand-text">
          <h2 className="brand-name">Quisitive Business</h2>
          <p className="brand-sub">Employee Portal</p>
        </div>
      </div>

      {/* Section label */}
      <p className="sidebar-section-label">
        {user?.role === 'superadmin' ? 'ADMIN PANEL' : 'USER MENU'}
      </p>

      {/* Nav Links */}
      <nav className="sidebar-menu">
        {links.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Profile + Sign Out */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{user?.initials}</div>
          <div className="sidebar-user-info">
            <p className="sidebar-user-name">{user?.name}</p>
            <p className="sidebar-user-role">
              {user?.role === 'superadmin' ? 'Super Admin' : 'Admin'}
            </p>
          </div>
        </div>
        <button className="signout-btn" onClick={onLogout}>
          <span className="signout-icon">⏻</span>
          <span className="signout-text">Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;