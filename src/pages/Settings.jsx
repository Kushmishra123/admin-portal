import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useUser } from '../context/UserContext';
import '../styles/dashboard.css';
import { API_URL } from '../config';
import LoaderButton from '../components/LoaderButton';

const Toggle = ({ on, onToggle }) => (
  <LoaderButton className={`toggle-switch ${on ? 'on' : ''}`} onClick={onToggle} type="button">
    <div className="toggle-thumb" />
  </LoaderButton>
);

// Password strength helper
const getStrength = (pwd) => {
  if (!pwd) return null;
  if (pwd.length < 6) return { label: 'Too short', color: '#f87171', pct: 20 };
  if (pwd.length < 8) return { label: 'Weak', color: '#fb923c', pct: 40 };
  if (!/[A-Z]/.test(pwd) || !/[0-9]/.test(pwd)) return { label: 'Fair', color: '#fbbf24', pct: 65 };
  if (!/[^A-Za-z0-9]/.test(pwd)) return { label: 'Good', color: '#a3e635', pct: 80 };
  return { label: 'Strong', color: '#4ade80', pct: 100 };
};

const Settings = () => {
  const { user, setUser } = useUser();
  const isSuperAdmin = user?.role === 'superadmin';

  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success'); // 'success' | 'error'

  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: '',
  });

  const [notifs, setNotifs] = useState({
    emailAlerts: true, pushNotifs: false,
    leaveUpdates: true, birthdayReminders: true,
  });

  // ── Own Password Reset state ──
  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');



  const showNotification = (msg, type = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (profile.email && !/^\S+@\S+\.\S+$/.test(profile.email)) {
      showNotification("Invalid email format.", "error");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/auth/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          employeeId: user?.id || user?.employeeId,
          email: profile.email
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        showNotification(data.message || 'Settings update failed.', 'error');
        return;
      }

      if (setUser && user) {
        const nameParts = profile.name.trim().split(' ');
        let newInitials = user.initials;
        if (nameParts.length > 0 && nameParts[0].length > 0) {
          newInitials = nameParts[0][0].toUpperCase();
          if (nameParts.length > 1 && nameParts[nameParts.length - 1].length > 0) {
            newInitials += nameParts[nameParts.length - 1][0].toUpperCase();
          }
        }
        setUser({ ...user, name: profile.name, email: profile.email, bio: profile.bio, initials: newInitials });
      }
      showNotification('Settings saved successfully!');
    } catch (error) {
      showNotification('Network error. Failed to save.', 'error');
    }
  };

  const toggleNotif = key => setNotifs(n => ({ ...n, [key]: !n[key] }));

  // ── Own Password Reset handler ──
  const handleOwnPasswordReset = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    const { currentPassword, newPassword, confirmPassword } = pwForm;

    if (!currentPassword) { setPwError('Please enter your current password.'); return; }
    if (newPassword.length < 6) { setPwError('New password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPassword) { setPwError('New password and confirm password do not match.'); return; }
    if (currentPassword === newPassword) { setPwError('New password must be different from the current password.'); return; }

    setPwLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          employeeId: user?.employeeId || user?.id,
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPwError(data.message || 'Password reset failed.');
      } else {
        setPwSuccess(data.message);
        setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        showNotification('Password changed successfully!');
      }
    } catch (err) {
      setPwError('Network error. Please try again.');
    } finally {
      setPwLoading(false);
    }
  };



  const ownStrength = getStrength(pwForm.newPassword);

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

            {/* ── Profile ── */}
            <div className="form-card" style={{ gridColumn: '1 / -1' }}>
              <div className="settings-section-title"> Profile Information</div>
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
                    {isSuperAdmin ? 'Super Admin' : 'Admin'}
                  </p>
                  <LoaderButton className="btn-secondary" style={{ marginTop: 8, padding: '6px 16px', fontSize: 12 }}>
                    Change Avatar
                  </LoaderButton>
                </div>
              </div>
              <form >
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
                <LoaderButton onClick={handleSave} type="submit" className="btn-primary"> Save Changes</LoaderButton>
              </form>
            </div>

            {/* ── Own Password Reset ── */}
            <div className="form-card" style={{ gridColumn: '1 / -1' }}>
              <div className="settings-section-title"> Reset Password</div>
              <p style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>
                Update your account password. You must enter your current password to set a new one.
              </p>
              <form >
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Current Password</label>
                    <input
                      id="settings-current-password"
                      className="form-input"
                      type="password"
                      placeholder="Enter your current password"
                      value={pwForm.currentPassword}
                      onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div className="form-group">
                      <label className="form-label">New Password</label>
                      <input
                        id="settings-new-password"
                        className="form-input"
                        type="password"
                        placeholder="Min. 6 characters"
                        value={pwForm.newPassword}
                        onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                        required
                      />
                      {pwForm.newPassword && ownStrength && (
                        <div style={{ marginTop: 6 }}>
                          <div style={{ height: 4, borderRadius: 4, background: '#222', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${ownStrength.pct}%`, background: ownStrength.color, transition: 'width 0.3s, background 0.3s', borderRadius: 4 }} />
                          </div>
                          <span style={{ fontSize: 11, color: ownStrength.color }}>{ownStrength.label}</span>
                        </div>
                      )}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Confirm New Password</label>
                      <input
                        id="settings-confirm-password"
                        className="form-input"
                        type="password"
                        placeholder="Re-enter new password"
                        value={pwForm.confirmPassword}
                        onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
                        required
                      />
                      {pwForm.confirmPassword && pwForm.newPassword && (
                        <span style={{
                          fontSize: 11,
                          color: pwForm.confirmPassword === pwForm.newPassword ? '#4ade80' : '#f87171',
                          marginTop: 4,
                          display: 'block'
                        }}>
                          {pwForm.confirmPassword === pwForm.newPassword ? ' Passwords match' : ' Passwords do not match'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {pwError   && (
                  <div style={{ color: '#f87171', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>
                     {pwError}
                  </div>
                )}
                {pwSuccess && (
                  <div style={{ color: '#4ade80', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>
                     {pwSuccess}
                  </div>
                )}

                <LoaderButton onClick={handleOwnPasswordReset} type="submit" className="btn-primary" disabled={pwLoading}>
                  {pwLoading ? '⏳ Updating…' : ' Reset Password'}
                </LoaderButton>
              </form>
            </div>



            {/* ── Notifications ── */}
            <div className="form-card">
              <div className="settings-section-title"> Notifications</div>
              {[
                { key: 'emailAlerts',       label: 'Email Alerts',         sub: 'Receive alerts via email'         },
                { key: 'pushNotifs',        label: 'Push Notifications',   sub: 'Browser push notifications'       },
                { key: 'leaveUpdates',      label: 'Leave Status Updates', sub: 'When leave is approved/rejected'  },
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



          </div>
        </div>
      </div>

      {showToast && (
        <div className={`toast ${toastType === 'error' ? 'toast-error' : ''}`}>
          <span className="toast-icon">{toastType === 'error' ? '' : ''}</span>
          <span className="toast-msg">{toastMsg}</span>
        </div>
      )}
    </div>
  );
};

export default Settings;
