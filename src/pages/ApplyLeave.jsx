import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useEmployee } from '../context/EmployeeContext';
import { useUser } from '../context/UserContext';
import { useLeaves } from '../context/LeavesContext';
import { API_URL } from '../config';
import '../styles/dashboard.css';
import LoaderButton from '../components/LoaderButton';

const LEAVE_TYPES = ['Casual Leave', 'Sick Leave', 'Annual Leave', 'Emergency Leave'];

const ApplyLeave = () => {
  const { user } = useUser();
  const { employees, loading: empLoading } = useEmployee();
  const { applyLeave } = useLeaves();

  // Mode: 'self' = apply for myself | 'behalf' = apply on behalf of employee
  // HR can do both; superadmin and manager can only do 'self' here
  const isHR         = user?.role === 'hr';
  const isSuperAdmin = user?.role === 'superadmin';
  const isManager    = user?.role === 'manager';
  const canApplyBehalf = isHR; // only HR applies on behalf

  const [mode, setMode] = useState(canApplyBehalf ? 'behalf' : 'self'); // 'self' | 'behalf'

  // ── Self-apply form (mirrors MyLeaves logic) ──────────────────────────────
  const [selfForm, setSelfForm] = useState({ type: '', from: '', to: '', reason: '' });
  const [selfSubmitting, setSelfSubmitting] = useState(false);
  const [selfErrors, setSelfErrors] = useState({});

  // ── On-behalf form ────────────────────────────────────────────────────────
  const [behalfForm, setBehalfForm] = useState({
    employeeId: '', leaveType: '', from: '', to: '', reason: '',
  });
  const [behalfErrors, setBehalfErrors] = useState({});
  const [behalfSubmitting, setBehalfSubmitting] = useState(false);

  // ── Toast ─────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });
  const showToast = (msg, type = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: '', type: 'success' }), 3500);
  };

  // ── Self-apply submit ─────────────────────────────────────────────────────
  const validateSelf = () => {
    const e = {};
    if (!selfForm.type)        e.type   = 'Select a leave type';
    if (!selfForm.from)        e.from   = 'From date is required';
    if (!selfForm.to)          e.to     = 'To date is required';
    if (selfForm.from && selfForm.to && selfForm.to < selfForm.from)
      e.to = 'To date must be after From date';
    if (!selfForm.reason.trim()) e.reason = 'Reason is required';
    return e;
  };

  const handleSelfSubmit = async (e) => {
    e.preventDefault();
    const errs = validateSelf();
    if (Object.keys(errs).length) { setSelfErrors(errs); return; }

    const days = Math.max(1, Math.round((new Date(selfForm.to) - new Date(selfForm.from)) / 86400000) + 1);
    setSelfSubmitting(true);
    try {
      await applyLeave({ leaveType: selfForm.type, from: selfForm.from, to: selfForm.to, days, reason: selfForm.reason });
      setSelfForm({ type: '', from: '', to: '', reason: '' });
      setSelfErrors({});
      showToast(` Leave request submitted! Awaiting approval.`, 'success');
    } catch (err) {
      showToast(` ${err.message}`, 'error');
    } finally {
      setSelfSubmitting(false);
    }
  };

  const handleSelfChange = (field, val) => {
    setSelfForm(f => ({ ...f, [field]: val }));
    if (selfErrors[field]) setSelfErrors(e => { const ne = { ...e }; delete ne[field]; return ne; });
  };

  // ── On-behalf submit ──────────────────────────────────────────────────────
  const validateBehalf = () => {
    const e = {};
    if (!behalfForm.employeeId) e.employeeId = 'Please select an employee';
    if (!behalfForm.leaveType)  e.leaveType  = 'Please select a leave type';
    if (!behalfForm.from)       e.from       = 'From date is required';
    if (!behalfForm.to)         e.to         = 'To date is required';
    if (behalfForm.from && behalfForm.to && behalfForm.to < behalfForm.from)
      e.to = 'To date must be after From date';
    if (!behalfForm.reason.trim()) e.reason  = 'Reason is required';
    return e;
  };

  const handleBehalfSubmit = async (e) => {
    e.preventDefault();
    const errs = validateBehalf();
    if (Object.keys(errs).length) { setBehalfErrors(errs); return; }

    const days = Math.max(1, Math.round((new Date(behalfForm.to) - new Date(behalfForm.from)) / 86400000) + 1);
    const selectedEmp = employees.find(emp => emp.id === behalfForm.employeeId);
    setBehalfSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/leaves/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          employeeId: behalfForm.employeeId,
          employeeName: selectedEmp?.name || behalfForm.employeeId,
          leaveType: behalfForm.leaveType,
          from: behalfForm.from,
          to: behalfForm.to,
          days,
          reason: behalfForm.reason,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit leave');

      showToast(` Leave applied for ${selectedEmp?.name || behalfForm.employeeId} successfully!`, 'success');
      setBehalfForm({ employeeId: '', leaveType: '', from: '', to: '', reason: '' });
      setBehalfErrors({});
    } catch (err) {
      showToast(` ${err.message}`, 'error');
    } finally {
      setBehalfSubmitting(false);
    }
  };

  const handleBehalfChange = (field, val) => {
    setBehalfForm(f => ({ ...f, [field]: val }));
    if (behalfErrors[field]) setBehalfErrors(e => { const ne = { ...e }; delete ne[field]; return ne; });
  };

  // ── Role label for badge ──────────────────────────────────────────────────
  const roleBadge = isSuperAdmin
    ? { label: ' Super Admin', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' }
    : isManager
    ? { label: ' Manager',     color: '#0ea5e9', bg: 'rgba(14,165,233,0.08)', border: 'rgba(14,165,233,0.2)' }
    : { label: ' HR Mode',     color: '#76c733', bg: 'rgba(118,199,51,0.08)', border: 'rgba(118,199,51,0.2)' };

  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="main-wrapper">
        <Navbar
          title="Apply Leave"
          subtitle={mode === 'self' ? 'Submit your own leave request' : 'Submit leave request on behalf of an employee'}
        />

        <div className="content-container">

          {/* ── Page Header ── */}
          <div className="page-header" style={{ marginBottom: 24 }}>
            <div>
              <h1 className="page-title">Apply Leave</h1>
              <p className="page-subtitle">
                {mode === 'self'
                  ? 'Your leave request will be submitted for supervisor approval'
                  : 'Submit a leave request on behalf of any employee'}
              </p>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: roleBadge.bg, border: `1px solid ${roleBadge.border}`,
              borderRadius: 10, padding: '8px 16px', fontSize: 13, color: roleBadge.color, fontWeight: 600,
            }}>
              {roleBadge.label}
            </div>
          </div>

          {/* ── Mode Toggle (only show tabs if HR who can do both) ── */}
          {canApplyBehalf && (
            <div style={{
              display: 'flex', gap: 0, marginBottom: 28,
              background: '#0b150b', border: '1px solid #1a2a1a',
              borderRadius: 12, padding: 4, width: 'fit-content',
            }}>
              {[
                { key: 'self',   icon: '', label: 'Apply for Myself' },
                { key: 'behalf', icon: '', label: 'Apply on Behalf' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setMode(tab.key)}
                  style={{
                    padding: '10px 24px', borderRadius: 9, border: 'none',
                    cursor: 'pointer', fontSize: 14, fontWeight: 600,
                    transition: 'all 0.2s',
                    background: mode === tab.key ? '#76c733' : 'transparent',
                    color:      mode === tab.key ? '#000'    : '#6b7b6b',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              SELF-APPLY MODE
          ══════════════════════════════════════════════════════════════════ */}
          {mode === 'self' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 300px', gap: 24, alignItems: 'start' }}>

              {/* Left: Self Leave Form */}
              <form noValidate onSubmit={handleSelfSubmit}>
                <div className="form-card" style={{ marginBottom: 0 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 16, borderBottom: '1px solid #1a2a1a' }}>
                     My Leave Request
                  </h3>

                  {/* Leave Type */}
                  <div className="form-group" style={{ marginBottom: 20 }}>
                    <label className="form-label"> Leave Type</label>
                    <select
                      className="form-select"
                      value={selfForm.type}
                      onChange={e => handleSelfChange('type', e.target.value)}
                      style={selfErrors.type ? { borderColor: 'rgba(239,68,68,0.5)' } : {}}
                    >
                      <option value="">— Select Leave Type —</option>
                      {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {selfErrors.type && <span style={{ fontSize: 11, color: '#f87171' }}>{selfErrors.type}</span>}
                  </div>

                  {/* Date Range */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label"> From Date</label>
                      <input
                        className="form-input" type="date"
                        value={selfForm.from}
                        onChange={e => handleSelfChange('from', e.target.value)}
                        style={selfErrors.from ? { borderColor: 'rgba(239,68,68,0.5)' } : {}}
                      />
                      {selfErrors.from && <span style={{ fontSize: 11, color: '#f87171' }}>{selfErrors.from}</span>}
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label"> To Date</label>
                      <input
                        className="form-input" type="date"
                        value={selfForm.to}
                        onChange={e => handleSelfChange('to', e.target.value)}
                        style={selfErrors.to ? { borderColor: 'rgba(239,68,68,0.5)' } : {}}
                      />
                      {selfErrors.to && <span style={{ fontSize: 11, color: '#f87171' }}>{selfErrors.to}</span>}
                    </div>
                  </div>

                  {/* Duration preview */}
                  {selfForm.from && selfForm.to && selfForm.to >= selfForm.from && (
                    <div style={{
                      background: 'rgba(118,199,51,0.07)', border: '1px solid rgba(118,199,51,0.18)',
                      borderRadius: 8, padding: '10px 14px', marginBottom: 20,
                      fontSize: 13, color: '#76c733', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                       Duration:{' '}
                      <span style={{ color: '#fff' }}>
                        {Math.max(1, Math.round((new Date(selfForm.to) - new Date(selfForm.from)) / 86400000) + 1)} day(s)
                      </span>
                    </div>
                  )}

                  {/* Reason */}
                  <div className="form-group" style={{ marginBottom: 24 }}>
                    <label className="form-label"> Reason</label>
                    <textarea
                      className="form-input"
                      placeholder="Enter reason for leave…"
                      value={selfForm.reason}
                      onChange={e => handleSelfChange('reason', e.target.value)}
                      rows={4}
                      style={{ resize: 'vertical', minHeight: 90, ...(selfErrors.reason ? { borderColor: 'rgba(239,68,68,0.5)' } : {}) }}
                    />
                    {selfErrors.reason && <span style={{ fontSize: 11, color: '#f87171' }}>{selfErrors.reason}</span>}
                  </div>

                  <LoaderButton
                    type="submit"
                    className="btn-primary"
                    style={{ width: '100%', padding: '14px', fontSize: 15, fontWeight: 700 }}
                    disabled={selfSubmitting}
                    onClick={handleSelfSubmit}
                  >
                    {selfSubmitting ? '⏳ Submitting…' : ' Submit My Leave Request'}
                  </LoaderButton>
                </div>
              </form>

              {/* Right: Info Panel */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Who is applying */}
                <div className="form-card" style={{ background: '#080c08', border: '1px solid rgba(118,199,51,0.18)' }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#76c733', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                     Applying As
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      ['Name',        user?.name       || '—'],
                      ['Employee ID', user?.employeeId || '—'],
                      ['Role',        user?.role       || '—'],
                    ].map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid #1a2a1a', paddingBottom: 8 }}>
                        <span style={{ color: '#6b7b6b', fontWeight: 600 }}>{k}</span>
                        <span style={{ color: '#e0f0e0', fontWeight: 500, textTransform: 'capitalize' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Leave Policy */}
                <div className="form-card" style={{ background: '#080c08' }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 16 }}> Leave Policy</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { type: 'Casual Leave',    days: 8,  color: '#76c733' },
                      { type: 'Sick Leave',      days: 10, color: '#0ea5e9' },
                      { type: 'Annual Leave',    days: 15, color: '#f59e0b' },
                      { type: 'Emergency Leave', days: 3,  color: '#f87171' },
                    ].map(({ type, days, color }) => (
                      <div key={type} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderBottom: '1px solid #1a2a1a' }}>
                        <span style={{ color: '#a0b0a0' }}>{type}</span>
                        <span style={{ color, fontWeight: 700 }}>{days} days/yr</span>
                      </div>
                    ))}
                  </div>
                  <p style={{ marginTop: 14, fontSize: 11, color: '#4a5a4a', fontStyle: 'italic', lineHeight: 1.6 }}>
                    Your leave request will be set to <strong style={{ color: '#f59e0b' }}>Pending</strong> and can be approved by Super Admin.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              ON-BEHALF MODE (HR only)
          ══════════════════════════════════════════════════════════════════ */}
          {mode === 'behalf' && canApplyBehalf && (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: 24, alignItems: 'start' }}>

              {/* Left: On-behalf Form */}
              <form noValidate onSubmit={handleBehalfSubmit}>
                <div className="form-card" style={{ marginBottom: 0 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 16, borderBottom: '1px solid #1a2a1a' }}>
                     Leave Request Form
                  </h3>

                  {/* Employee Dropdown */}
                  <div className="form-group" style={{ marginBottom: 20 }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                       Select Employee
                    </label>
                    <select
                      className="form-select"
                      value={behalfForm.employeeId}
                      onChange={e => handleBehalfChange('employeeId', e.target.value)}
                      style={behalfErrors.employeeId ? { borderColor: 'rgba(239,68,68,0.5)' } : {}}
                    >
                      <option value="">
                        {empLoading ? 'Loading employees…' : '— Select Employee —'}
                      </option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.id} — {emp.name}{emp.department ? ` (${emp.department})` : ''}
                        </option>
                      ))}
                    </select>
                    {behalfErrors.employeeId && <span style={{ fontSize: 11, color: '#f87171' }}>{behalfErrors.employeeId}</span>}
                  </div>

                  {/* Leave Type */}
                  <div className="form-group" style={{ marginBottom: 20 }}>
                    <label className="form-label"> Leave Type</label>
                    <select
                      className="form-select"
                      value={behalfForm.leaveType}
                      onChange={e => handleBehalfChange('leaveType', e.target.value)}
                      style={behalfErrors.leaveType ? { borderColor: 'rgba(239,68,68,0.5)' } : {}}
                    >
                      <option value="">— Select Leave Type —</option>
                      {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {behalfErrors.leaveType && <span style={{ fontSize: 11, color: '#f87171' }}>{behalfErrors.leaveType}</span>}
                  </div>

                  {/* Date Range */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label"> From Date</label>
                      <input
                        className="form-input" type="date"
                        value={behalfForm.from}
                        onChange={e => handleBehalfChange('from', e.target.value)}
                        style={behalfErrors.from ? { borderColor: 'rgba(239,68,68,0.5)' } : {}}
                      />
                      {behalfErrors.from && <span style={{ fontSize: 11, color: '#f87171' }}>{behalfErrors.from}</span>}
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label"> To Date</label>
                      <input
                        className="form-input" type="date"
                        value={behalfForm.to}
                        onChange={e => handleBehalfChange('to', e.target.value)}
                        style={behalfErrors.to ? { borderColor: 'rgba(239,68,68,0.5)' } : {}}
                      />
                      {behalfErrors.to && <span style={{ fontSize: 11, color: '#f87171' }}>{behalfErrors.to}</span>}
                    </div>
                  </div>

                  {/* Duration preview */}
                  {behalfForm.from && behalfForm.to && behalfForm.to >= behalfForm.from && (
                    <div style={{
                      background: 'rgba(118,199,51,0.07)', border: '1px solid rgba(118,199,51,0.18)',
                      borderRadius: 8, padding: '10px 14px', marginBottom: 20,
                      fontSize: 13, color: '#76c733', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                       Duration:{' '}
                      <span style={{ color: '#fff' }}>
                        {Math.max(1, Math.round((new Date(behalfForm.to) - new Date(behalfForm.from)) / 86400000) + 1)} day(s)
                      </span>
                    </div>
                  )}

                  {/* Reason */}
                  <div className="form-group" style={{ marginBottom: 24 }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                       Reason
                    </label>
                    <textarea
                      className="form-input"
                      placeholder="Enter reason for leave…"
                      value={behalfForm.reason}
                      onChange={e => handleBehalfChange('reason', e.target.value)}
                      rows={4}
                      style={{ resize: 'vertical', minHeight: 90, ...(behalfErrors.reason ? { borderColor: 'rgba(239,68,68,0.5)' } : {}) }}
                    />
                    {behalfErrors.reason && <span style={{ fontSize: 11, color: '#f87171' }}>{behalfErrors.reason}</span>}
                  </div>

                  <LoaderButton
                    type="submit"
                    className="btn-primary"
                    style={{ width: '100%', padding: '14px', fontSize: 15, fontWeight: 700 }}
                    disabled={behalfSubmitting}
                    onClick={handleBehalfSubmit}
                  >
                    {behalfSubmitting ? '⏳ Submitting…' : ' Submit Leave Request'}
                  </LoaderButton>
                </div>
              </form>

              {/* Right: Employee Preview + Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {behalfForm.employeeId && (() => {
                  const emp = employees.find(e => e.id === behalfForm.employeeId);
                  return emp ? (
                    <div className="form-card" style={{ background: '#080c08', border: '1px solid rgba(118,199,51,0.18)' }}>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#76c733', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                         Selected Employee
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {[
                          ['Name',        emp.name],
                          ['Employee ID', emp.id],
                          ['Department',  emp.department  || '—'],
                          ['Designation', emp.designation || '—'],
                          ['Status',      emp.status      || '—'],
                        ].map(([k, v]) => (
                          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid #1a2a1a', paddingBottom: 8 }}>
                            <span style={{ color: '#6b7b6b', fontWeight: 600 }}>{k}</span>
                            <span style={{ color: '#e0f0e0', fontWeight: 500 }}>{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()}

                <div className="form-card" style={{ background: '#080c08' }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 16 }}> Leave Policy</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { type: 'Casual Leave',    days: 8,  color: '#76c733' },
                      { type: 'Sick Leave',      days: 10, color: '#0ea5e9' },
                      { type: 'Annual Leave',    days: 15, color: '#f59e0b' },
                      { type: 'Emergency Leave', days: 3,  color: '#f87171' },
                    ].map(({ type, days, color }) => (
                      <div key={type} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderBottom: '1px solid #1a2a1a' }}>
                        <span style={{ color: '#a0b0a0' }}>{type}</span>
                        <span style={{ color, fontWeight: 700 }}>{days} days/yr</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{
                  background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)',
                  borderRadius: 12, padding: '14px 16px',
                }}>
                  <p style={{ fontSize: 12, color: '#f59e0b', margin: 0, fontWeight: 600, marginBottom: 6 }}> HR Notice</p>
                  <p style={{ fontSize: 12, color: '#a08050', margin: 0, lineHeight: 1.6 }}>
                    You are applying leave on behalf of an employee. The leave status will be set to{' '}
                    <strong style={{ color: '#f59e0b' }}>Pending</strong> and can be approved by Super Admin.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Toast */}
      {toast.show && (
        <div className="toast" style={
          toast.type === 'error'
            ? { background: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.3)' }
            : {}
        }>
          <span className="toast-icon">{toast.type === 'error' ? '' : ''}</span>
          <span className="toast-msg" style={toast.type === 'error' ? { color: '#f87171' } : {}}>{toast.msg}</span>
        </div>
      )}
    </div>
  );
};

export default ApplyLeave;
