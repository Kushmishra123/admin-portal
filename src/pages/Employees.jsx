import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import EmployeeTable from '../components/EmployeeTable';
import { useEmployee } from '../context/EmployeeContext';
import { useUser } from '../context/UserContext';
import { API_URL } from '../config';
import '../styles/dashboard.css';
import LoaderButton from '../components/LoaderButton';

// ─────────────────────────────────────────────────────────────────────────────
// Password strength helper
// ─────────────────────────────────────────────────────────────────────────────
const getStrength = (pwd) => {
  if (!pwd) return null;
  if (pwd.length < 6) return { label: 'Too short', color: '#f87171', pct: 20 };
  if (pwd.length < 8) return { label: 'Weak', color: '#fb923c', pct: 40 };
  if (!/[A-Z]/.test(pwd) || !/[0-9]/.test(pwd)) return { label: 'Fair', color: '#fbbf24', pct: 65 };
  if (!/[^A-Za-z0-9]/.test(pwd)) return { label: 'Good', color: '#a3e635', pct: 80 };
  return { label: 'Strong', color: '#4ade80', pct: 100 };
};

// ─────────────────────────────────────────────────────────────────────────────
// Shared components for Reset Password Modal
// ─────────────────────────────────────────────────────────────────────────────
const Overlay = ({ children }) => (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 200, backdropFilter: 'blur(6px)', padding: 20
  }}>
    <div style={{
      background: '#0e1510',
      border: '1px solid rgba(251,191,36,0.25)',
      borderRadius: 16,
      width: '100%', maxWidth: 480,
      boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(251,191,36,0.1)',
      overflow: 'hidden',
      animation: 'modalPop 0.2s ease'
    }}>
      {children}
    </div>
  </div>
);

const ModalHeader = ({ title, subtitle, onClose }) => (
  <div style={{
    padding: '20px 24px 16px',
    borderBottom: '1px solid rgba(251,191,36,0.12)',
    background: 'rgba(251,191,36,0.04)',
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12
  }}>
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 18 }}></span>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#fbbf24' }}>{title}</h2>
      </div>
      <p style={{ margin: 0, fontSize: 12, color: '#6b7b6b' }}>{subtitle}</p>
    </div>
    <LoaderButton
      onClick={onClose}
      style={{ background: 'transparent', border: 'none', color: '#6b7b6b', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: '0 4px' }}
    >×</LoaderButton>
  </div>
);

const EmpBadge = ({ emp }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 12,
    background: 'rgba(255,255,255,0.03)', border: '1px solid #1a2a1a',
    borderRadius: 10, padding: '12px 16px', marginBottom: 20
  }}>
    <div style={{
      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
      background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 14, fontWeight: 800, color: '#000'
    }}>
      {(emp.initials || emp.name?.substring(0, 2) || '??').toUpperCase()}
    </div>
    <div>
      <p style={{ margin: 0, fontWeight: 700, color: '#e0f0e0', fontSize: 14 }}>{emp.name}</p>
      <p style={{ margin: 0, fontSize: 12, color: '#6b7b6b' }}>{emp.id} · {emp.department || 'N/A'}</p>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Reset Password Modal — 3 stages: form → confirm → done
// ─────────────────────────────────────────────────────────────────────────────
const ResetPasswordModal = ({ emp, adminId, onClose }) => {
  const [stage, setStage] = useState('form');  // 'form' | 'confirm' | 'done'
  const [newPassword, setNewPassword] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [empCode, setEmpCode] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);

  const strength = getStrength(newPassword);

  const validate = () => {
    if (!empCode) return 'Please enter the employee code to verify.';
    if (empCode.toUpperCase() !== emp.id.toUpperCase()) return 'Entered employee code does not match.';
    if (!newPassword) return 'Please enter a new password.';
    if (newPassword.length < 6) return 'Password must be at least 6 characters.';
    if (!/[A-Z]/.test(newPassword)) return 'Password must contain at least one uppercase letter.';
    if (!/[0-9]/.test(newPassword)) return 'Password must contain at least one number.';
    if (newPassword !== confirmPwd) return 'Passwords do not match.';
    return null;
  };

  const handleProceed = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setStage('confirm');
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/admin/reset-password/${emp.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ adminEmployeeId: adminId, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Reset failed.');
        setStage('form');
      } else {
        setSuccessData(data);
        setStage('done');
      }
    } catch {
      setError('Network error. Is the server running?');
      setStage('form');
    } finally {
      setLoading(false);
    }
  };



  // ────────────────────────────── STAGE: FORM ──────────────────────────────
  if (stage === 'form') return (
    <Overlay>
      <ModalHeader
        title="Reset Employee Password"
        subtitle="Super Admin / HR action — no current password required"
        onClose={onClose}
      />
      <div style={{ padding: '20px 24px 24px' }}>
        <EmpBadge emp={emp} />

        {/* Verify Employee Code */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6b7b6b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>
            Verify Employee Code
          </label>
          <input
            type="text"
            value={empCode}
            onChange={e => { setEmpCode(e.target.value); setError(''); }}
            placeholder={`Enter code (e.g. ${emp.id})`}
            style={{
              width: '100%', padding: '10px 14px', boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.04)', border: '1px solid #1a2a1a',
              borderRadius: 8, color: '#fff', fontSize: 14, fontFamily: 'inherit',
              outline: 'none', transition: 'border-color 0.2s'
            }}
            onFocus={e => e.target.style.borderColor = 'rgba(251,191,36,0.5)'}
            onBlur={e => e.target.style.borderColor = '#1a2a1a'}
            autoFocus
          />
        </div>

        {/* New Password */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6b7b6b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>
            New Password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="rp-new-password"
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={e => { setNewPassword(e.target.value); setError(''); }}
              placeholder="Min. 6 chars, 1 uppercase, 1 number"
              style={{
                width: '100%', padding: '10px 44px 10px 14px', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.04)', border: '1px solid #1a2a1a',
                borderRadius: 8, color: '#fff', fontSize: 14, fontFamily: 'inherit',
                outline: 'none', transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(251,191,36,0.5)'}
              onBlur={e => e.target.style.borderColor = '#1a2a1a'}
            />
            <LoaderButton
              type="button"
              onClick={() => setShowNew(v => !v)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#6b7b6b', cursor: 'pointer', fontSize: 15 }}
            >{showNew ? '' : ''}</LoaderButton>
          </div>
          {/* Strength bar */}
          {newPassword && strength && (
            <div style={{ marginTop: 6 }}>
              <div style={{ height: 4, borderRadius: 4, background: '#1a2a1a', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${strength.pct}%`, background: strength.color, transition: 'width 0.3s, background 0.3s', borderRadius: 4 }} />
              </div>
              <span style={{ fontSize: 11, color: strength.color }}>{strength.label}</span>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6b7b6b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>
            Confirm New Password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="rp-confirm-password"
              type={showConfirm ? 'text' : 'password'}
              value={confirmPwd}
              onChange={e => { setConfirmPwd(e.target.value); setError(''); }}
              placeholder="Re-enter the new password"
              style={{
                width: '100%', padding: '10px 44px 10px 14px', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.04)', border: '1px solid #1a2a1a',
                borderRadius: 8, color: '#fff', fontSize: 14, fontFamily: 'inherit',
                outline: 'none', transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(251,191,36,0.5)'}
              onBlur={e => e.target.style.borderColor = '#1a2a1a'}
            />
            <LoaderButton
              type="button"
              onClick={() => setShowConfirm(v => !v)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#6b7b6b', cursor: 'pointer', fontSize: 15 }}
            >{showConfirm ? '' : ''}</LoaderButton>
          </div>
          {confirmPwd && newPassword && (
            <span style={{ fontSize: 11, color: confirmPwd === newPassword ? '#4ade80' : '#f87171', marginTop: 4, display: 'block' }}>
              {confirmPwd === newPassword ? ' Passwords match' : ' Passwords do not match'}
            </span>
          )}
        </div>

        {/* Validation rules hint */}
        <div style={{ padding: '10px 14px', background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.12)', borderRadius: 8, marginBottom: 20, fontSize: 11, color: '#6b7b6b', lineHeight: 1.6 }}>
          <p style={{ margin: '0 0 4px', color: '#fbbf24', fontWeight: 600 }}>Password Requirements</p>
          <span style={{ color: newPassword.length >= 6 ? '#4ade80' : '#6b7b6b' }}> Minimum 6 characters&nbsp;&nbsp;</span>
          <span style={{ color: /[A-Z]/.test(newPassword) ? '#4ade80' : '#6b7b6b' }}> One uppercase letter&nbsp;&nbsp;</span>
          <span style={{ color: /[0-9]/.test(newPassword) ? '#4ade80' : '#6b7b6b' }}> One number</span>
        </div>

        {/* Error */}
        {error && (
          <div style={{ color: '#f87171', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>
             {error}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <LoaderButton
            onClick={onClose}
            style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid #222', borderRadius: 8, color: '#aaa', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            Cancel
          </LoaderButton>
          <LoaderButton
            onClick={handleProceed}
            style={{ flex: 2, padding: '10px', background: '#fbbf24', border: 'none', borderRadius: 8, color: '#000', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
             Continue to Confirm
          </LoaderButton>
        </div>
      </div>
    </Overlay>
  );

  // ────────────────────────────── STAGE: CONFIRM ──────────────────────────────
  if (stage === 'confirm') return (
    <Overlay>
      <ModalHeader
        title="Confirm Password Reset"
        subtitle="Please review before proceeding"
        onClose={onClose}
      />
      <div style={{ padding: '24px 24px' }}>
        <EmpBadge emp={emp} />

        {/* Warning banner */}
        <div style={{
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: 10, padding: '14px 16px', marginBottom: 20
        }}>
          <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#fca5a5', fontSize: 14 }}> Are you sure?</p>
          <p style={{ margin: 0, fontSize: 12, color: '#6b7b6b', lineHeight: 1.5 }}>
            You are about to reset the password for <strong style={{ color: '#e0f0e0' }}>{emp.name}</strong> ({emp.id}).
            This action cannot be undone and the employee will need to use the new password to log in.
          </p>
        </div>

        {/* Summary */}
        <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid #1a2a1a', borderRadius: 8, marginBottom: 20, fontSize: 13 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ color: '#6b7b6b' }}>Target Employee</span>
            <span style={{ color: '#e0f0e0', fontWeight: 600 }}>{emp.name} ({emp.id})</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ color: '#6b7b6b' }}>New Password</span>
            <span style={{ color: '#e0f0e0', fontWeight: 600 }}>{'•'.repeat(Math.min(newPassword.length, 12))}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#6b7b6b' }}>Password Strength</span>
            <span style={{ color: strength?.color, fontWeight: 600 }}>{strength?.label}</span>
          </div>
        </div>

        {error && (
          <div style={{ color: '#f87171', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>
             {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <LoaderButton
            onClick={() => setStage('form')}
            style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid #222', borderRadius: 8, color: '#aaa', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            ← Go Back
          </LoaderButton>
          <LoaderButton
            onClick={handleConfirm}
            disabled={loading}
            style={{ flex: 2, padding: '10px', background: loading ? '#555' : '#ef4444', border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            {loading ? '⏳ Resetting…' : ' Yes, Reset Password'}
          </LoaderButton>
        </div>
      </div>
    </Overlay>
  );

  // ────────────────────────────── STAGE: DONE ──────────────────────────────
  return (
    <Overlay>
      <div style={{ padding: '40px 32px', textAlign: 'center' }}>
        {/* Animated success ring */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%', margin: '0 auto 20px',
          background: 'rgba(74,222,128,0.12)', border: '2px solid rgba(74,222,128,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32
        }}></div>
        <h2 style={{ margin: '0 0 8px', color: '#4ade80', fontSize: 20, fontWeight: 800 }}>Password Reset!</h2>
        <p style={{ margin: '0 0 24px', color: '#6b7b6b', fontSize: 13 }}>
          {successData?.message}
        </p>

        {/* Details card */}
        <div style={{
          background: 'rgba(255,255,255,0.02)', border: '1px solid #1a2a1a',
          borderRadius: 10, padding: '14px 18px', marginBottom: 24, textAlign: 'left', fontSize: 12
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ color: '#6b7b6b' }}>Employee</span>
            <span style={{ color: '#e0f0e0', fontWeight: 600 }}>
              {successData?.targetEmployee?.name} ({successData?.targetEmployee?.employeeId})
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ color: '#6b7b6b' }}>Reset By</span>
            <span style={{ color: '#e0f0e0', fontWeight: 600 }}>{successData?.resetBy}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ color: '#6b7b6b' }}>Reset At</span>
            <span style={{ color: '#e0f0e0', fontWeight: 600 }}>
              {successData?.resetAt ? new Date(successData.resetAt).toLocaleString() : '—'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTop: '1px dashed #2a3a2a' }}>
            <span style={{ color: '#fbbf24', fontWeight: 600 }}>New Password</span>
            <div style={{ background: 'rgba(74, 222, 128, 0.1)', padding: '4px 8px', borderRadius: 4 }}>
              <span style={{ color: '#4ade80', fontWeight: 700, fontFamily: 'monospace', fontSize: 14, letterSpacing: '1px' }}>
                {newPassword}
              </span>
            </div>
          </div>
        </div>

        <LoaderButton
          onClick={onClose}
          style={{ width: '100%', padding: '11px', background: '#4ade80', border: 'none', borderRadius: 8, color: '#000', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
        >
          Done
        </LoaderButton>
      </div>
    </Overlay>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Employee Detail Modal
// ─────────────────────────────────────────────────────────────────────────────
const EmployeeDetailModal = ({ emp, onClose }) => {
  if (!emp) return null;
  const currentYear = new Date().getFullYear();
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, backdropFilter: 'blur(4px)', padding: '20px'
    }}>
      <div style={{
        background: '#0e1510',
        borderRadius: 8, width: '100%', maxWidth: 1100, position: 'relative',
        boxShadow: '0 10px 25px rgba(0,0,0,0.5)', overflow: 'hidden',
        border: '1px solid #1a2a1a'
      }}>
        {/* Header */}
        <div style={{
          background: 'rgba(59, 130, 246, 0.1)',
          padding: '12px 16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '1px solid rgba(59, 130, 246, 0.2)'
        }}>
          <div style={{ color: '#60a5fa', fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
             {emp.id} - {emp.name} (Year {currentYear})
          </div>
          <LoaderButton onClick={onClose} style={{
            background: 'transparent', border: 'none', color: '#60a5fa',
            cursor: 'pointer', fontSize: 16, fontWeight: 'bold'
          }}></LoaderButton>
        </div>
        {/* Body */}
        <div style={{ padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '16px', background: '#0e1510' }}>
          <div style={{
            width: '100%', background: '#080c08', padding: '16px', borderRadius: '6px', border: '1px solid #1a2a1a',
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px'
          }}>
            {[
              ['Email', emp.email], ['Department', emp.department], ['Designation', emp.designation],
              ['Gender', emp.gender], ['Date of Birth', emp.dob ? new Date(emp.dob).toLocaleDateString('en-GB') : ''], ['Joining Date', emp.joinDate]
            ].map(([label, val]) => (
              <div key={label}>
                <div style={{ color: '#6b7b6b', fontSize: 12, marginBottom: 4 }}>{label}</div>
                <div style={{ color: '#e0f0e0', fontSize: 14 }}>{val || 'N/A'}</div>
              </div>
            ))}
          </div>
          <div style={{ flex: 1, background: '#080c08', padding: '20px', borderRadius: '6px', border: '1px solid #1a2a1a' }}>
            <h4 style={{ color: '#60a5fa', fontSize: 14, fontWeight: 600, margin: '0 0 12px 0' }}> KRA</h4>
            <p style={{ color: '#a0b0a0', fontSize: 14, margin: 0, fontStyle: 'italic' }}>{emp.kra || 'Not set'}</p>
          </div>
          <div style={{ flex: 1, background: '#080c08', padding: '20px', borderRadius: '6px', border: '1px solid #1a2a1a' }}>
            <h4 style={{ color: '#10b981', fontSize: 14, fontWeight: 600, margin: '0 0 12px 0' }}> KPA</h4>
            <p style={{ color: '#a0b0a0', fontSize: 14, margin: 0, fontStyle: 'italic' }}>{emp.kpa || 'Not set'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Edit Employee Modal
// ─────────────────────────────────────────────────────────────────────────────
const EditEmployeeModal = ({ emp, onClose, onSave }) => {
  if (!emp) return null;
  const [form, setForm] = useState({
    code: emp.id || '',
    name: emp.name || '',
    email: emp.email || '',
    designation: emp.designation || '',
    gender: emp.gender || 'Male',
    joinDate: emp.joinDate || '',
    dob: emp.dob ? String(emp.dob).substring(0, 10) : '',
    assets: emp.assets !== '-' ? emp.assets : '',
    docUrl: emp.docUrl || '',
    department: emp.department || '',
    shift: emp.shift || '',
    offs: emp.offs || '1',
    duration: emp.duration || '9h',
    start: emp.startTime || '',
    end: emp.endTime || '',
    kra: emp.kra || '',
    kpa: emp.kpa || ''
  });

  const handleChange = (f, val) => setForm({ ...form, [f]: val });

  const inputStyle = {
    width: '100%', padding: '8px 12px', border: '1px solid #1a2a1a',
    borderRadius: 6, outline: 'none', background: '#080c08', color: '#e0f0e0',
    boxSizing: 'border-box'
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, backdropFilter: 'blur(4px)', padding: '20px'
    }}>
      <div style={{
        background: '#0e1510', border: '1px solid #1a2a1a',
        borderRadius: 8, width: 800, maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 10px 25px rgba(0,0,0,0.5)', overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #1a2a1a', background: '#0e1510' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#e0f0e0', margin: 0 }}>Edit Employee — {emp.name}</h2>
          <LoaderButton onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#6b7b6b', cursor: 'pointer', fontSize: 24, lineHeight: 1 }}>×</LoaderButton>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, color: '#e0f0e0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div><label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#6b7b6b', fontWeight: 500 }}>Code</label>
              <input type="text" value={form.code} onChange={e => handleChange('code', e.target.value)} style={inputStyle} /></div>
            <div><label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#6b7b6b', fontWeight: 500 }}>Name</label>
              <input type="text" value={form.name} onChange={e => handleChange('name', e.target.value)} style={inputStyle} /></div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#6b7b6b', fontWeight: 500 }}>Gmail (Email Address)</label>
            <input type="email" value={form.email} onChange={e => handleChange('email', e.target.value)} style={inputStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div><label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#6b7b6b', fontWeight: 500 }}>Designation</label>
              <input type="text" value={form.designation} onChange={e => handleChange('designation', e.target.value)} style={inputStyle} /></div>
            <div><label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#6b7b6b', fontWeight: 500 }}>Gender</label>
              <select value={form.gender} onChange={e => handleChange('gender', e.target.value)} style={inputStyle}>
                <option>Male</option><option>Female</option><option>Other</option>
              </select></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div><label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#6b7b6b', fontWeight: 500 }}>Joining Date</label>
              <input type="date" value={form.joinDate} onChange={e => handleChange('joinDate', e.target.value)} style={{ ...inputStyle, colorScheme: 'dark' }} /></div>
            <div><label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#6b7b6b', fontWeight: 500 }}>Date of Birth</label>
              <input type="date" value={form.dob} onChange={e => handleChange('dob', e.target.value)} style={{ ...inputStyle, colorScheme: 'dark' }} /></div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#6b7b6b', fontWeight: 500 }}>Company Assets</label>
            <textarea rows={3} value={form.assets} onChange={e => handleChange('assets', e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#6b7b6b', fontWeight: 500 }}>Verification Document URL</label>
            <input type="text" value={form.docUrl} onChange={e => handleChange('docUrl', e.target.value)} style={inputStyle} />
            <span style={{ fontSize: 12, color: '#4a5b4a', marginTop: 4, display: 'block' }}>Paste Google Drive or OneDrive link</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div><label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#6b7b6b', fontWeight: 500 }}>Department</label>
              <select value={form.department} onChange={e => handleChange('department', e.target.value)} style={inputStyle}>
                <option>Directorship</option><option>CXO</option><option>Operations</option>
                <option>Marketing</option><option>SOC</option><option>HR</option>
              </select></div>
            <div><label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#6b7b6b', fontWeight: 500 }}>Shift</label>
              <select value={form.shift} onChange={e => handleChange('shift', e.target.value)} style={inputStyle}>
                <option>General - General Shift</option><option>Night Shift</option><option>FMS</option>
              </select></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div><label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#6b7b6b', fontWeight: 500 }}>Offs/Week</label>
              <select value={form.offs} onChange={e => handleChange('offs', e.target.value)} style={inputStyle}>
                <option>1</option><option>2</option><option>0</option>
              </select></div>
            <div><label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#6b7b6b', fontWeight: 500 }}>Duration</label>
              <select value={form.duration} onChange={e => handleChange('duration', e.target.value)} style={inputStyle}>
                <option>9h</option><option>8h</option><option>6h</option>
              </select></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div><label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#6b7b6b', fontWeight: 500 }}>Start</label>
              <input type="time" value={form.start} onChange={e => handleChange('start', e.target.value)} style={inputStyle} /></div>
            <div><label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#6b7b6b', fontWeight: 500 }}>End</label>
              <input type="time" value={form.end} onChange={e => handleChange('end', e.target.value)} style={inputStyle} /></div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: 14, color: '#6b7b6b', fontWeight: 500 }}> KRA</label>
            <textarea rows={2} value={form.kra} onChange={e => handleChange('kra', e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: 14, color: '#6b7b6b', fontWeight: 500 }}> KPA</label>
            <textarea rows={3} value={form.kpa} onChange={e => handleChange('kpa', e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 24px', borderTop: '1px solid #1a2a1a', background: '#0e1510' }}>
          <LoaderButton onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: 6, fontWeight: 500, cursor: 'pointer' }}>
            Close
          </LoaderButton>
          <LoaderButton onClick={() => { onSave(form); onClose(); }} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, fontWeight: 500, cursor: 'pointer' }}>
            Save Changes
          </LoaderButton>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Assign Team Modal
// ─────────────────────────────────────────────────────────────────────────────
const AssignTeamModal = ({ employees, onClose, onAssign, adminId }) => {
  const [selectedManager, setSelectedManager] = useState('');
  const [selectedEmps, setSelectedEmps] = useState([]);
  const [loading, setLoading] = useState(false);

  const managers = employees.filter(e => e.role === 'manager');

  // When manager changes, pre-select employees already in their team
  const handleManagerChange = (managerId) => {
    setSelectedManager(managerId);
    if (managerId) {
      const alreadyAssigned = employees
        .filter(e => e.managerEmployeeId === managerId)
        .map(e => e.id);
      setSelectedEmps(alreadyAssigned);
    } else {
      setSelectedEmps([]);
    }
  };

  const toggleEmp = (empId) => {
    if (selectedEmps.includes(empId)) {
      setSelectedEmps(selectedEmps.filter(id => id !== empId));
    } else {
      setSelectedEmps([...selectedEmps, empId]);
    }
  };

  // Show: unassigned employees + employees already on this manager's team
  // Hide: employees assigned to a DIFFERENT manager
  const availableEmployees = employees.filter(e =>
    e.id !== selectedManager &&
    e.status === 'Active' &&
    e.role !== 'manager' &&
    e.role !== 'superadmin' &&
    (
      !e.managerEmployeeId ||                          // unassigned
      e.managerEmployeeId === selectedManager           // already on this manager's team
    )
  );

  const handleSave = async () => {
    if (!selectedManager) return alert('Select a manager first');
    if (!selectedEmps.length) return alert('Select at least one employee');
    
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/managers/${selectedManager}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ employeeIds: selectedEmps, callerId: adminId })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to assign team');
      }
      onAssign();
      onClose();
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, backdropFilter: 'blur(4px)', padding: '20px'
    }}>
      <div style={{
        background: '#0e1510', border: '1px solid #1a2a1a',
        borderRadius: 8, width: 600, maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 10px 25px rgba(0,0,0,0.5)', overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #1a2a1a', background: '#0e1510' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#e0f0e0', margin: 0 }}>Assign Team</h2>
          <LoaderButton onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#6b7b6b', cursor: 'pointer', fontSize: 24, lineHeight: 1 }}>×</LoaderButton>
        </div>

        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, color: '#e0f0e0' }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#6b7b6b', fontWeight: 500 }}>Select Manager</label>
            <select value={selectedManager} onChange={(e) => handleManagerChange(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #1a2a1a', borderRadius: 6, outline: 'none', background: '#080c08', color: '#e0f0e0' }}>
              <option value="">-- Choose Manager --</option>
              {managers.map(m => <option key={m.id} value={m.id}>{m.name} ({m.id})</option>)}
            </select>
          </div>
          
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 14, color: '#6b7b6b', fontWeight: 500 }}>Select Employees to Assign</label>
              {selectedManager && (
                <span style={{ fontSize: 11, color: '#4a5b4a' }}>
                  {availableEmployees.length} available · {selectedEmps.length} selected
                </span>
              )}
            </div>
            {!selectedManager ? (
              <div style={{ background: '#080c08', border: '1px solid #1a2a1a', borderRadius: 6, padding: '24px', textAlign: 'center', color: '#4a5b4a', fontSize: 13 }}>
                 Select a manager first to see available employees
              </div>
            ) : availableEmployees.length === 0 ? (
              <div style={{ background: '#080c08', border: '1px solid #1a2a1a', borderRadius: 6, padding: '24px', textAlign: 'center', color: '#4a5b4a', fontSize: 13 }}>
                No unassigned employees available
              </div>
            ) : (
              <div style={{ background: '#080c08', border: '1px solid #1a2a1a', borderRadius: 6, padding: '10px', maxHeight: 300, overflowY: 'auto' }}>
                {availableEmployees.map(e => {
                  const isCurrentTeam = e.managerEmployeeId === selectedManager;
                  return (
                    <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px', borderBottom: '1px solid #1a2a1a' }}>
                      <input type="checkbox" checked={selectedEmps.includes(e.id)} onChange={() => toggleEmp(e.id)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                      <span style={{ fontSize: 14, flex: 1 }}>
                        {e.name}
                        <span style={{ color: '#6b7b6b', fontSize: 12 }}> ({e.id})</span>
                        {isCurrentTeam && (
                          <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, color: '#76c733', background: 'rgba(118,199,51,0.12)', border: '1px solid rgba(118,199,51,0.3)', borderRadius: 10, padding: '1px 6px' }}>
                            current team
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 24px', borderTop: '1px solid #1a2a1a', background: '#0e1510' }}>
          <LoaderButton onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: 6, fontWeight: 500, cursor: 'pointer' }}>Cancel</LoaderButton>
          <LoaderButton onClick={handleSave} loading={loading} style={{ background: '#76c733', color: '#0e1510', border: 'none', padding: '8px 16px', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}>Save Assignment</LoaderButton>
        </div>
      </div>
    </div>
  );
};


// ─────────────────────────────────────────────────────────────────────────────
// Employees Page
// ─────────────────────────────────────────────────────────────────────────────
const Employees = () => {
  const navigate = useNavigate();
  const { updateEmployee, employees, refreshEmployees } = useEmployee();
  const { user } = useUser();

  const [selectedEmp, setSelectedEmp] = useState(null);
  const [editingEmp, setEditingEmp] = useState(null);
  const [resetPwEmp, setResetPwEmp] = useState(null);
  const [showAssignTeam, setShowAssignTeam] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('Data has been saved in the database successfully.');

  const handleSaveEdit = async (form) => {
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
      alert("Please enter a valid structure for Gmail / Email address.");
      return;
    }

    const success = await updateEmployee(form.code, {
      name: form.name,
      email: form.email,
      designation: form.designation,
      gender: form.gender,
      department: form.department,
      joinDate: form.joinDate,
      dob: form.dob,
      assets: form.assets,
      docUrl: form.docUrl,
      shift: form.shift,
      offsPerWeek: form.offs,
      duration: form.duration,
      startTime: form.start,
      endTime: form.end,
      kra: form.kra,
      kpa: form.kpa
    });

    if (success) {
      setToastMsg('Data has been saved in the database successfully.');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleAssignSuccess = () => {
    setToastMsg('Team assigned and synced successfully!');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="main-wrapper">
        <Navbar title="Employee Directory" subtitle="Manage all organisation employees" />
        <div className="content-container">
          <div className="page-header">
            <div>
              <h1 className="page-title">Admin Control</h1>
              <p className="page-subtitle">Manage and track all organisation employees</p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              {(user?.role === 'manager' || user?.role === 'hr') && (
                <LoaderButton className="btn-primary" onClick={() => navigate('/add-employee')}>
                   Add Employee
                </LoaderButton>
              )}
              {user?.role === 'hr' && (
                <>
                  <LoaderButton style={{ background: '#76c733', color: '#000', border: 'none', borderRadius: 6, padding: '10px 16px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => navigate('/add-employee')}>
                     Add Manager
                  </LoaderButton>
                  <LoaderButton style={{ background: '#f59e0b', color: '#000', border: 'none', borderRadius: 6, padding: '10px 16px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => navigate('/add-employee')}>
                     Add Super Admin
                  </LoaderButton>
                  <LoaderButton style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: 6, padding: '10px 16px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => setShowAssignTeam(true)}>
                     Assign Team (Employees)
                  </LoaderButton>
                </>
              )}
            </div>
          </div>

          <EmployeeTable
            onEdit={setEditingEmp}
            onViewDetails={setSelectedEmp}
            onResetPassword={setResetPwEmp}
          />
        </div>
      </div>

      {/* Edit Modal */}
      {editingEmp && (
        <EditEmployeeModal
          emp={editingEmp}
          onClose={() => setEditingEmp(null)}
          onSave={handleSaveEdit}
        />
      )}

      {/* Employee Detail Modal */}
      {selectedEmp && !editingEmp && (
        <EmployeeDetailModal
          emp={selectedEmp}
          onClose={() => setSelectedEmp(null)}
        />
      )}

      {/* Reset Password Modal */}
      {resetPwEmp && (
        <ResetPasswordModal
          emp={resetPwEmp}
          adminId={user?.employeeId || user?.id}
          onClose={() => setResetPwEmp(null)}
        />
      )}

      {/* Assign Team Modal */}
      {showAssignTeam && (
        <AssignTeamModal
          employees={employees || []}
          adminId={user?.employeeId || user?.id}
          onClose={() => setShowAssignTeam(false)}
          onAssign={() => {
            handleAssignSuccess();
            if (refreshEmployees) refreshEmployees();
          }}
        />
      )}

      {/* Success Toast */}
      {showToast && (
        <div style={{
          position: 'fixed', bottom: 20, right: 20, zIndex: 9999,
          background: 'rgba(74, 222, 128, 0.9)', color: '#000', padding: '12px 20px',
          borderRadius: 8, fontWeight: 700, boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          animation: 'modalPop 0.3s ease'
        }}>
          {toastMsg}
        </div>
      )}
    </div>
  );
};

export default Employees;