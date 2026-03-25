import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useLeaves } from '../context/LeavesContext';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';
import LoaderButton from '../components/LoaderButton';

const ManageLeaves = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const { leaves, loading, updateLeaveStatus, refreshLeaves } = useLeaves();

  const [showToast, setShowToast] = useState(false);
  const [toastMsg,  setToastMsg]  = useState('');
  const [toastType, setToastType] = useState('success');
  const [processing, setProcessing] = useState(null); // id being processed
  const [filter, setFilter] = useState('All'); // All | Pending | Approved | Rejected

  const toast = (msg, type = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleAction = async (leave, status) => {
    setProcessing(leave._id);
    try {
      await updateLeaveStatus(leave, status);  // pass full object (has employeeLeaveId + _id)
      toast(
        `Leave ${status.toLowerCase()} for ${leave.employeeName}!` +
        (status === 'Approved' ? ` (${leave.days} day(s) deducted from balance)` : ''),
        status === 'Approved' ? 'success' : 'error'
      );
    } catch (err) {
      toast(err.message || 'Failed to update leave status.', 'error');
    } finally {
      setProcessing(null);
    }
  };

  const statusClass = (s) =>
    s === 'Approved' ? 'leave-approved' : s === 'Pending' ? 'leave-pending' : 'leave-rejected';

  const filtered = filter === 'All' ? leaves : leaves.filter(l => l.status === filter);
  const pendingCount = leaves.filter(l => l.status === 'Pending').length;

  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="main-wrapper">
        <Navbar title="Manage Leaves" subtitle={user?.role === 'superadmin' ? 'Review and process employee leave requests' : 'View your team\'s leave requests'} />

        <div className="content-container">
          <div className="page-header">
            <div>
              <h1 className="page-title">
                Leave Requests
                {pendingCount > 0 && (
                  <span style={{
                    marginLeft: 10, background: 'rgba(239,68,68,0.15)',
                    color: '#f87171', borderRadius: 20, padding: '2px 10px',
                    fontSize: 14, fontWeight: 600, border: '1px solid rgba(239,68,68,0.3)'
                  }}>
                    {pendingCount} pending
                  </span>
                )}
              </h1>
              <p className="page-subtitle">
                {user?.role === 'superadmin'
                  ? 'Approve or reject pending leave requests from employees'
                  : 'View leave requests — only Super Admin can approve or reject'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <LoaderButton className="btn-secondary" onClick={refreshLeaves} style={{ opacity: loading ? 0.6 : 1 }}>
                🔄 Refresh
              </LoaderButton>
              <LoaderButton className="btn-primary" onClick={() => navigate('/my-leaves')}>
                ✍️ Apply My Leave
              </LoaderButton>
            </div>
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {['All', 'Pending', 'Approved', 'Rejected'].map(f => (
              <LoaderButton
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 500,
                  cursor: 'pointer', transition: 'all 0.2s',
                  background: filter === f ? '#76c733' : 'rgba(255,255,255,0.05)',
                  color: filter === f ? '#000' : '#a0b0a0',
                  border: filter === f ? 'none' : '1px solid #1a2a1a',
                }}
              >
                {f} {f === 'All' ? `(${leaves.length})` : `(${leaves.filter(l => l.status === f).length})`}
              </LoaderButton>
            ))}
          </div>

          <div className="table-card">
            <div className="table-top">
              <span className="table-title">
                {filter} Requests <span className="table-count">({filtered.length} records)</span>
              </span>
              {loading && <span style={{ color: '#6b7b6b', fontSize: 13 }}>Loading…</span>}
            </div>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Leave Type</th>
                  <th>Date Range</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Applied On</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && !loading && (
                  <tr><td colSpan={8} style={{ textAlign: 'center', color: '#6b7b6b', padding: 24 }}>
                    No {filter.toLowerCase()} requests.
                  </td></tr>
                )}
                {filtered.map(l => (
                  <tr key={l._id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#e0f0e0' }}>{l.employeeName}</div>
                      <div style={{ fontSize: 12, color: '#6b7b6b', fontFamily: 'monospace' }}>{l.employeeId}</div>
                    </td>
                    <td style={{ color: '#e0f0e0', fontWeight: 500 }}>{l.leaveType}</td>
                    <td style={{ color: '#6b7b6b' }}>{l.from} → {l.to}</td>
                    <td><span style={{ fontWeight: 700, color: '#76c733' }}>{l.days}d</span></td>
                    <td style={{ color: '#a0b0a0', maxWidth: 180, fontSize: 13, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={l.reason}>
                      {l.reason}
                    </td>
                    <td style={{ color: '#6b7b6b', fontSize: 13 }}>
                      {l.createdAt ? new Date(l.createdAt).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td><span className={statusClass(l.status)}>{l.status}</span></td>
                    <td>
                      {l.status === 'Pending' && user?.role === 'superadmin' ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <LoaderButton
                            onClick={() => handleAction(l, 'Approved')}
                            disabled={processing === l._id}
                            style={{
                              background: 'rgba(118,199,51,0.15)', color: '#76c733',
                              border: '1px solid rgba(118,199,51,0.3)', borderRadius: 6,
                              padding: '4px 10px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                              opacity: processing === l._id ? 0.5 : 1
                            }}
                          >
                            {processing === l._id ? '…' : '✓ Approve'}
                          </LoaderButton>
                          <LoaderButton
                            onClick={() => handleAction(l, 'Rejected')}
                            disabled={processing === l._id}
                            style={{
                              background: 'rgba(239,68,68,0.15)', color: '#ef4444',
                              border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6,
                              padding: '4px 10px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                              opacity: processing === l._id ? 0.5 : 1
                            }}
                          >
                            ✕ Reject
                          </LoaderButton>
                        </div>
                      ) : l.status === 'Pending' ? (
                        <span style={{
                          fontSize: 12, color: '#f59e0b', fontStyle: 'italic',
                          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
                          borderRadius: 6, padding: '3px 8px',
                        }}>
                          ⏳ View Only
                        </span>
                      ) : (
                        <div>
                          <span style={{ color: '#6b7b6b', fontSize: 13 }}>Processed</span>
                          {l.processedAt && (
                            <div style={{ fontSize: 11, color: '#4a5a4a' }}>
                              {new Date(l.processedAt).toLocaleDateString('en-IN')}
                            </div>
                          )}
                        </div>
                      )}
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
          <span className="toast-icon">{toastType === 'error' ? '❌' : '✅'}</span>
          <span className="toast-msg" style={toastType === 'error' ? { color: '#f87171' } : {}}>{toastMsg}</span>
        </div>
      )}
    </div>
  );
};

export default ManageLeaves;
