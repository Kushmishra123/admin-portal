import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import LoaderButton from './LoaderButton';
import { API_URL, API_BASE_URL } from '../config';
import { io } from 'socket.io-client';

const Navbar = ({ title, subtitle }) => {
  const { user, handleLogout } = useUser();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!user) return;
    const currentUserId = user.employeeId || user.id;

    // Initial fetch for ALL roles
    fetch(`${API_URL}/notifications/${currentUserId}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setNotifications(data);
      })
      .catch(err => console.error('Failed to fetch notifications:', err));

    // Socket setup for ALL roles
    const newSocket = io(API_BASE_URL, {
      query: { employeeId: currentUserId },
      withCredentials: true
    });
    setSocket(newSocket);

    newSocket.on('newNotification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
    });

    return () => newSocket.close();
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleRead = async (id) => {
    try {
      await fetch(`${API_URL}/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (n) => {
    // Mark as read
    if (!n.read) await handleRead(n._id);
    // Close dropdown
    setShowNotifications(false);
    // Navigate based on role + notification type
    if (n.type === 'leave') {
      const role = user?.role;
      if (role === 'superadmin' || role === 'hr' || role === 'manager') {
        navigate('/manage-leaves');
      } else {
        navigate('/my-leaves');
      }
    }
  };

  const markAllRead = async () => {
    try {
      const currentUserId = user.employeeId || user.id;
      await fetch(`${API_URL}/notifications/user/${currentUserId}/readAll`, { method: 'PATCH' });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

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
          <span className="time-badge"> {timeStr}</span>
        </div>

        {user && (
          <div style={{ position: 'relative' }}>
            <LoaderButton 
              className="nav-signout-btn" 
              onClick={() => setShowNotifications(!showNotifications)} 
              title="Notifications"
              style={{ background: 'rgba(74, 144, 217, 0.1)', color: '#4a90d9', borderColor: 'rgba(74, 144, 217, 0.2)' }}
            >
              <span>🔔</span>
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: -5, right: -5, background: '#ef4444', color: '#fff',
                  fontSize: 10, fontWeight: 700, minWidth: 18, height: 18, borderRadius: 9,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {unreadCount}
                </span>
              )}
            </LoaderButton>

            {showNotifications && (
              <div style={{
                position: 'absolute', top: 50, right: 0, width: 320, background: '#111',
                border: '1px solid #222', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                zIndex: 100, overflow: 'hidden'
              }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: 14, color: '#fff' }}>Notifications</h3>
                  {unreadCount > 0 && (
                    <LoaderButton onClick={markAllRead} style={{ background: 'none', border: 'none', color: '#76c733', fontSize: 12, cursor: 'pointer' }}>
                      Mark all read
                    </LoaderButton>
                  )}
                </div>
                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: 20, textAlign: 'center', color: '#666', fontSize: 13 }}>No notifications</div>
                  ) : notifications.map(n => (
                    <div key={n._id} onClick={() => handleNotificationClick(n)} style={{
                      padding: 14, borderBottom: '1px solid #1a1a1a', background: n.read ? 'transparent' : 'rgba(118,199,51,0.05)',
                      cursor: 'pointer', transition: 'background 0.2s'
                    }}>
                      <div style={{ fontSize: 13, fontWeight: n.read ? 500 : 700, color: n.read ? '#ccc' : '#fff', marginBottom: 4 }}>{n.title}</div>
                      <div style={{ fontSize: 12, color: '#999', lineHeight: 1.4 }}>{n.message}</div>
                      <div style={{ fontSize: 10, color: '#666', marginTop: 8 }}>{new Date(n.createdAt).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <LoaderButton className="nav-signout-btn" onClick={onLogout} title="Sign Out">
          <span>⏻</span>
        </LoaderButton>

        <div className="nav-user">
          <div className="nav-text">
            <p className="nav-user-name">{user?.name}</p>
            <p className="nav-user-role">
            {user?.role === 'superadmin' ? 'Super Admin' : user?.role === 'hr' ? 'HR' : user?.role === 'manager' ? 'Manager' : 'Employee'}
            </p>
          </div>
          {user?.profileImage ? (
            <img src={user.profileImage} alt="Profile" className="nav-avatar" style={{ objectFit: 'cover' }} />
          ) : (
            <div className="nav-avatar">{user?.initials}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;