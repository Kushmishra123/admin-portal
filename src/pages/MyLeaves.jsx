import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useLeaves } from '../context/LeavesContext';
import { useUser } from '../context/UserContext';
import '../styles/dashboard.css';
import LoaderButton from '../components/LoaderButton';

const MyLeaves = () => {
  const { user } = useUser();
  const { leaves, balance, loading, applyLeave } = useLeaves();

  const [showForm,  setShowForm]  = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg,  setToastMsg]  = useState('');
  const [toastType, setToastType] = useState('success'); // 'success' | 'error'
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ type: '', from: '', to: '', reason: '' });

  const toast = (msg, type = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (!form.type || !form.from || !form.to || !form.reason) return;
    const days = Math.max(1, Math.round((new Date(form.to) - new Date(form.from)) / 86400000) + 1);
    setSubmitting(true);
    try {
      await applyLeave({ leaveType: form.type, from: form.from, to: form.to, days, reason: form.reason });
      setForm({ type: '', from: '', to: '', reason: '' });
      setShowForm(false);
      toast('Leave request submitted! Awaiting superadmin approval.', 'success');
    } catch (err) {
      toast(err.message || 'Failed to submit leave request.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Leave balance cards — shape: balance.casual = { total, used }
  const balanceCards = [
    { type: 'Casual Leave',    total: balance.casual?.total    ?? 8,  used: balance.casual?.used    ?? 0 },
    { type: 'Sick Leave',      total: balance.sick?.total      ?? 10, used: balance.sick?.used      ?? 0 },
    { type: 'Annual Leave',    total: balance.annual?.total    ?? 15, used: balance.annual?.used    ?? 0 },
    { type: 'Emergency Leave', total: balance.emergency?.total ?? 3,  used: balance.emergency?.used ?? 0 },
  ];

  const statusClass = (s) =>
    s === 'Approved' ? 'leave-approved' : s === 'Pending' ? 'leave-pending' : 'leave-rejected';

  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="main-wrapper">
        <Navbar title="My Leaves" subtitle="Track and manage your leave requests" />

        <div className="content-container">
          <div className="page-header">
            <div>
              <h1 className="page-title">My Leaves</h1>
              <p className="page-subtitle">View your leave history and apply for new leaves</p>
            </div>
            <LoaderButton className="btn-primary" onClick={() => setShowForm(s => !s)}>
              {showForm ? '✕ Cancel' : '➕ Apply for Leave'}
            </LoaderButton>
          </div>

          {/* ── Live Leave Balance ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
             <h2 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>Leave Balance</h2>
             <LoaderButton onClick={() => window.location.reload()} style={{ background: 'transparent', border: 'none', color: '#76c733', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>🔄 Refresh Balance</LoaderButton>
          </div>

          <div className="leave-balance-grid" style={{ marginBottom: 32 }}>
            {balanceCards.map(({ type, used, total }) => {
              const remaining = total - used;
              const usedPct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
              
              return (
                <div className="leave-balance-card" key={type} style={{ position: 'relative', overflow: 'hidden' }}>
                  {/* Background decoration */}
                  <div style={{ position: 'absolute', top: -10, right: -10, fontSize: 40, opacity: 0.05, transform: 'rotate(15deg)' }}>📅</div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div className="leave-balance-num" style={{ color: remaining <= 1 ? '#ef4444' : '#76c733', fontSize: 32, marginBottom: 4 }}>
                        {remaining}
                      </div>
                      <div className="leave-balance-type" style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.5px' }}>{type.toUpperCase()}</div>
                    </div>
                  </div>

                  <div style={{ marginTop: 20 }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6b7b6b', marginBottom: 8, fontWeight: 600 }}>
                        <span>USED: {used}</span>
                        <span>TOTAL: {total}</span>
                     </div>
                     {/* Progress bar */}
                     <div style={{ background: '#1a2a1a', borderRadius: 10, height: 6, width: '100%' }}>
                        <div style={{
                          width: `${usedPct}%`, height: '100%', borderRadius: 10,
                          background: usedPct > 80 ? '#ef4444' : '#76c733',
                          boxShadow: usedPct > 0 ? `0 0 10px ${usedPct > 80 ? 'rgba(239,68,68,0.3)' : 'rgba(118,199,51,0.3)'}` : 'none',
                          transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                        }} />
                     </div>
                     <p style={{ marginTop: 12, fontSize: 11, color: '#4a5a4a', fontStyle: 'italic' }}>
                        {remaining} days remaining for your {type.toLowerCase()}
                     </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Apply Form ── */}
          {showForm && (
            <div className="form-card" style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 20 }}>📝 Apply for Leave</h3>
              <form >
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Leave Type</label>
                    <select className="form-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} required>
                      <option value="">Select Type</option>
                      <option>Casual Leave</option>
                      <option>Sick Leave</option>
                      <option>Annual Leave</option>
                      <option>Emergency Leave</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">From Date</label>
                    <input className="form-input" type="date" value={form.from} onChange={e => setForm(f => ({ ...f, from: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">To Date</label>
                    <input className="form-input" type="date" value={form.to} onChange={e => setForm(f => ({ ...f, to: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Reason</label>
                    <input className="form-input" type="text" placeholder="Brief reason for leave" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} required />
                  </div>
                </div>
                <div className="form-actions" style={{ marginTop: 0 }}>
                  <LoaderButton onClick={handleApply} type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? '⏳ Submitting…' : 'Submit Request'}
                  </LoaderButton>
                </div>
              </form>
            </div>
          )}

          {/* ── Leave History Table ── */}
          <div className="table-card">
            <div className="table-top">
              <span className="table-title">
                Leave History <span className="table-count">({leaves.length} records)</span>
              </span>
              {loading && <span style={{ color: '#6b7b6b', fontSize: 13 }}>Loading…</span>}
            </div>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Applied On</th>
                </tr>
              </thead>
              <tbody>
                {leaves.length === 0 && !loading && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', color: '#6b7b6b', padding: 24 }}>No leave requests yet.</td></tr>
                )}
                {leaves.map(l => (
                  <tr key={l._id}>
                    <td style={{ color: '#e0f0e0', fontWeight: 500 }}>{l.leaveType}</td>
                    <td style={{ color: '#6b7b6b' }}>{l.from}</td>
                    <td style={{ color: '#6b7b6b' }}>{l.to}</td>
                    <td><span style={{ fontWeight: 700, color: '#76c733' }}>{l.days}d</span></td>
                    <td style={{ color: '#a0b0a0', maxWidth: 200, fontSize: 13 }}>{l.reason}</td>
                    <td><span className={statusClass(l.status)}>{l.status}</span></td>
                    <td style={{ color: '#6b7b6b', fontSize: 13 }}>
                      {l.createdAt ? new Date(l.createdAt).toLocaleDateString('en-IN') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showToast && (
        <div className="toast" style={toastType === 'error' ? { background: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.3)' } : {}}>
          <span className="toast-icon">{toastType === 'error' ? '⚠️' : '📅'}</span>
          <span className="toast-msg" style={toastType === 'error' ? { color: '#f87171' } : {}}>{toastMsg}</span>
        </div>
      )}
    </div>
  );
};

export default MyLeaves;
