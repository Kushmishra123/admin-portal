import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import logo from '../assets/qb.png';
import LoaderButton from './LoaderButton';
import { Users, TrendingUp, BarChart2, Calendar, User, Settings, Building2, ClipboardList, Power } from 'lucide-react';

const Sidebar = () => {
  const { user, handleLogout, isSidebarCollapsed, setIsSidebarCollapsed } = useUser();
  const navigate = useNavigate();

  const onLogout = () => {
    handleLogout();
    navigate('/');
  };

  // ── Role-based nav link sets ─────────────────────────────────────────────────
  const superadminLinks = [
    { to: '/employees',    icon: <Users size={18} />, label: 'Employee Directory' },
    { to: '/entitlements', icon: <Calendar size={18} />, label: 'Entitlements (Yearly)' },
    { to: '/analytics',   icon: <TrendingUp size={18} />, label: 'Analytics' },
    { to: '/dashboard',   icon: <BarChart2 size={18} />, label: 'Dashboard' },
    { to: '/manage-leaves', icon: <Calendar size={18} />, label: 'Manage Leaves' },
    { to: '/apply-leave', icon: <ClipboardList size={18} />, label: 'Apply on Behalf' },
    { to: '/my-leaves',   icon: <User size={18} />, label: 'My Leaves' },
    { to: '/settings',    icon: <Settings size={18} />, label: 'Settings' },
    { to: '/about',       icon: <Building2 size={18} />, label: 'About Company' },
  ];

  const managerLinks = [
    { to: '/employees',    icon: <Users size={18} />, label: 'My Team' },
    { to: '/dashboard',   icon: <BarChart2 size={18} />, label: 'Dashboard' },
    { to: '/manage-leaves', icon: <Calendar size={18} />, label: 'Team Leaves' },
    { to: '/my-leaves',   icon: <User size={18} />, label: 'My Leaves' },
    { to: '/settings',    icon: <Settings size={18} />, label: 'Settings' },
    { to: '/about',       icon: <Building2 size={18} />, label: 'About Company' },
  ];

  const hrLinks = [
    { to: '/employees',    icon: <Users size={18} />, label: 'Employee Directory' },
    { to: '/entitlements', icon: <Calendar size={18} />, label: 'Entitlements (Yearly)' },
    { to: '/dashboard',   icon: <BarChart2 size={18} />, label: 'Dashboard' },
    { to: '/manage-leaves', icon: <Calendar size={18} />, label: 'All Leaves' },
    { to: '/apply-leave', icon: <ClipboardList size={18} />, label: 'Apply on Behalf' },
    { to: '/my-leaves',   icon: <User size={18} />, label: 'My Leaves' },
    { to: '/settings',    icon: <Settings size={18} />, label: 'Settings' },
    { to: '/about',       icon: <Building2 size={18} />, label: 'About Company' },
  ];

  const employeeLinks = [
    { to: '/dashboard', icon: <BarChart2 size={18} />, label: 'Dashboard' },
    { to: '/my-leaves', icon: <Calendar size={18} />, label: 'My Leaves' },
    { to: '/policy',    icon: <ClipboardList size={18} />, label: 'Policy' },
    { to: '/about',     icon: <Building2 size={18} />, label: 'About Company' },
    { to: '/settings',  icon: <Settings size={18} />, label: 'Settings' },
  ];

  const role = user?.role;
  const links =
    role === 'superadmin' ? superadminLinks :
    role === 'manager'    ? managerLinks    :
    role === 'hr'         ? hrLinks         :
    employeeLinks; // employee / admin (legacy)

  const sectionLabel =
    role === 'superadmin' ? 'ADMIN PANEL' :
    role === 'manager'    ? 'MANAGER PANEL' :
    role === 'hr'         ? 'HR PANEL' :
    'USER MENU';

  const roleDisplay =
    role === 'superadmin' ? 'Super Admin' :
    role === 'manager'    ? 'Manager'     :
    role === 'hr'         ? 'HR'          :
    'Employee';

  return (
    <div className={`left-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
      {/* Toggle Button */}
      <LoaderButton
        className="sidebar-toggle-btn"
        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {isSidebarCollapsed ? '»' : '«'}
      </LoaderButton>

      {/* Brand */}
      <div className="sidebar-brand" style={{ justifyContent: 'center' }}>
        <img src={logo} alt="QB Logo" style={{ width: '100%', maxWidth: '180px', height: 'auto' }} />
      </div>

      {/* Section label */}
      <p className="sidebar-section-label">{sectionLabel}</p>

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
            <p className="sidebar-user-role">{roleDisplay}</p>
          </div>
        </div>
        <LoaderButton className="signout-btn" onClick={onLogout}>
          <span className="signout-icon"><Power size={18}/></span>
          <span className="signout-text">Sign Out</span>
        </LoaderButton>
      </div>
    </div>
  );
};

export default Sidebar;