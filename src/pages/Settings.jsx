import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useUser } from '../context/UserContext';
import '../styles/dashboard.css';

const Toggle = ({ on, onToggle }) => (
  <button className={`toggle-switch ${on ? 'on' : ''}`} onClick={onToggle} type="button">
    <div className="toggle-thumb" />
  </button>
);

const Settings = () => {
  const { user, setUser } = useUser();
  const [showToast, setShowToast] = useState(false);

  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: '',
  });

  const [notifs, setNotifs] = useState({
    emailAlerts: true, pushNotifs: false,
    leaveUpdates: true,  birthdayReminders: true,
  });

  const handleSave = (e) => {
    e.preventDefault();
    
    // Update the global user context
    if (setUser && user) {
      // Calculate new initials
      const nameParts = profile.name.trim().split(' ');
      let newInitials = user.initials;
      
      if (nameParts.length > 0 && nameParts[0].length > 0) {
        newInitials = nameParts[0][0].toUpperCase();
        if (nameParts.length > 1 && nameParts[nameParts.length - 1].length > 0) {
          newInitials += nameParts[nameParts.length - 1][0].toUpperCase();
        }
      }

      setUser({
        ...user,
        name: profile.name,
        email: profile.email,
        bio: profile.bio,
        initials: newInitials
      });
    }

    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  const toggleNotif  = key => setNotifs(n  => ({ ...n,  [key]: !n[key]  }));

  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="main-wrapper">
        <Navbar title="Settings" subtitle="Manage your account preferences" />

        <div className="content-container">
          <div className="page-header">
            <div>
              <h1 className="page-title">Settings</h1>
              <p className="page-subtitle">Customise your profile and app preferences</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Profile */}
            <div className="form-card" style={{ gridColumn: '1 / -1' }}>
              <div className="settings-section-title">👤 Profile Information</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
                <div style={{
                  width: 72, height: 72,
                  background: 'linear-gradient(135deg, #76c733, #5fa828)',
                  borderRadius: 20, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 24, fontWeight: 800, color: '#000'
                }}>{user?.initials}</div>
                <div>
                  <p style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>{user?.name}</p>
                  <p style={{ color: '#76c733', fontSize: 13 }}>
                    {user?.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                  </p>
                  <button className="btn-secondary" style={{ marginTop: 8, padding: '6px 16px', fontSize: 12 }}>
                    Change Avatar
                  </button>
                </div>
              </div>
              <form onSubmit={handleSave}>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input className="form-input" value={profile.name}
                      onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" type="email" value={profile.email}
                      onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bio</label>
                    <input className="form-input" placeholder="A short bio…"
                      value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} />
                  </div>
                </div>
                <button type="submit" className="btn-primary">💾 Save Changes</button>
              </form>
            </div>

            {/* Notifications */}
            <div className="form-card">
              <div className="settings-section-title">🔔 Notifications</div>
              {[
                { key: 'emailAlerts',       label: 'Email Alerts',         sub: 'Receive alerts via email'         },
                { key: 'pushNotifs',        label: 'Push Notifications',   sub: 'Browser push notifications'       },
                { key: 'leaveUpdates',      label: 'Leave Status Updates',  sub: 'When leave is approved/rejected' },
                { key: 'birthdayReminders', label: 'Birthday Reminders',   sub: 'Colleague birthday notifications' },
              ].map(({ key, label, sub }) => (
                <div className="toggle-row" key={key}>
                  <div>
                    <div className="toggle-label">{label}</div>
                    <div className="toggle-sub">{sub}</div>
                  </div>
                  <Toggle on={notifs[key]} onToggle={() => toggleNotif(key)} />
                </div>
              ))}
            </div>

            {/* Account Actions */}
            <div className="form-card">
              <div className="settings-section-title">⚠️ Account Settings</div>
              <div style={{ padding: '16px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 12 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#fca5a5', marginBottom: 8 }}>Danger Zone</p>
                <p style={{ fontSize: 12, color: '#6b7b6b', marginBottom: 12 }}>These actions are irreversible</p>
                <button className="btn-secondary" style={{ fontSize: 13, borderColor: 'rgba(239,68,68,0.3)', color: '#f87171' }}>
                  🗑 Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showToast && (
        <div className="toast">
          <span className="toast-icon">✅</span>
          <span className="toast-msg">Settings saved successfully!</span>
        </div>
      )}
    </div>
  );
};

export default Settings;
