import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useEmployee } from '../context/EmployeeContext';
import { useUser } from '../context/UserContext';
import { API_URL } from '../config';
import '../styles/dashboard.css';
import LoaderButton from '../components/LoaderButton';

const LEAVE_TYPES = ['Casual Leave', 'Sick Leave', 'Annual Leave', 'Emergency Leave'];

const ApplyLeave = () => {
  const { user } = useUser();
  const { employees, loading: empLoading } = useEmployee();

  const [form, setForm] = useState({
    employeeId: '',
    leaveType: '',
    from: '',
    to: '',
    reason: '',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });

  const showToast = (msg, type = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: '', type: 'success' }), 3500);
  };

  const validate = () => {
    const e = {};
    if (!form.employeeId) e.employeeId = 'Please select an employee';
    if (!form.leaveType) e.leaveType = 'Please select a leave type';
    if (!form.from) e.from = 'From date is required';
    if (!form.to) e.to = 'To date is required';
    if (form.from && form.to && form.to < form.from) e.to = 'To date must be after From date';
    if (!form.reason.trim()) e.reason = 'Reason is required';
    return e;
  };

  const handleChange = (field, val) => {
    setForm(f => ({ ...f, [field]: val }));
    if (errors[field]) setErrors(e => { const ne = { ...e }; delete ne[field]; return ne; });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const days = Math.max(1, Math.round((new Date(form.to) - new Date(form.from)) / 86400000) + 1);
    const selectedEmp = employees.find(emp => emp.id === form.employeeId);

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/leaves/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          employeeId: form.employeeId,
          employeeName: selectedEmp?.name || form.employeeId,
          leaveType: form.leaveType,
          from: form.from,
          to: form.to,
          days,
          reason: form.reason,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit leave');

      showToast(`✅ Leave applied for ${selectedEmp?.name || form.employeeId} successfully!`, 'success');
      setForm({ employeeId: '', leaveType: '', from: '', to: '', reason: '' });
    } catch (err) {
      showToast(`⚠️ ${err.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="main-wrapper">
        <Navbar title="Apply Leave" subtitle="Submit leave requests on behalf of employees" />

        <div className="content-container">
          {/* Page Header */}
          <div className="page-header" style={{ marginBottom: 32 }}>
            <div>
              <h1 className="page-title">Apply Leave</h1>
              <p className="page-subtitle">Submit a leave request on behalf of any employee</p>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(118,199,51,0.08)', border: '1px solid rgba(118,199,51,0.2)',
              borderRadius: 10, padding: '8px 16px', fontSize: 13, color: '#76c733', fontWeight: 600,
            }}>
              🛡️ HR Mode
            </div>
          </div>

          {/* Main Card */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: 24, alignItems: 'start' }}>

            {/* ── Left: Leave Form ── */}
            <form noValidate onSubmit={handleSubmit}>
              <div className="form-card" style={{ marginBottom: 0 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 16, borderBottom: '1px solid #1a2a1a' }}>
                  📋 Leave Request Form
                </h3>

                {/* Employee Dropdown */}
                <div className="form-group" style={{ marginBottom: 20 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    👤 Select Employee
                  </label>
                  <select
                    className="form-select"
                    value={form.employeeId}
                    onChange={e => handleChange('employeeId', e.target.value)}
                    style={errors.employeeId ? { borderColor: 'rgba(239,68,68,0.5)' } : {}}
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
                  {errors.employeeId && (
                    <span style={{ fontSize: 11, color: '#f87171' }}>{errors.employeeId}</span>
                  )}
                </div>

                {/* Leave Type */}
                <div className="form-group" style={{ marginBottom: 20 }}>
                  <label className="form-label">📆 Leave Type</label>
                  <select
                    className="form-select"
                    value={form.leaveType}
                    onChange={e => handleChange('leaveType', e.target.value)}
                    style={errors.leaveType ? { borderColor: 'rgba(239,68,68,0.5)' } : {}}
                  >
                    <option value="">— Select Leave Type —</option>
                    {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {errors.leaveType && (
                    <span style={{ fontSize: 11, color: '#f87171' }}>{errors.leaveType}</span>
                  )}
                </div>

                {/* Date Range */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">📅 From Date</label>
                    <input
                      className="form-input"
                      type="date"
                      value={form.from}
                      onChange={e => handleChange('from', e.target.value)}
                      style={errors.from ? { borderColor: 'rgba(239,68,68,0.5)' } : {}}
                    />
                    {errors.from && <span style={{ fontSize: 11, color: '#f87171' }}>{errors.from}</span>}
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">📅 To Date</label>
                    <input
                      className="form-input"
                      type="date"
                      value={form.to}
                      onChange={e => handleChange('to', e.target.value)}
                      style={errors.to ? { borderColor: 'rgba(239,68,68,0.5)' } : {}}
                    />
                    {errors.to && <span style={{ fontSize: 11, color: '#f87171' }}>{errors.to}</span>}
                  </div>
                </div>

                {/* Duration preview */}
                {form.from && form.to && form.to >= form.from && (
                  <div style={{
                    background: 'rgba(118,199,51,0.07)', border: '1px solid rgba(118,199,51,0.18)',
                    borderRadius: 8, padding: '10px 14px', marginBottom: 20,
                    fontSize: 13, color: '#76c733', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    ⏱ Duration:{' '}
                    <span style={{ color: '#fff' }}>
                      {Math.max(1, Math.round((new Date(form.to) - new Date(form.from)) / 86400000) + 1)} day(s)
                    </span>
                  </div>
                )}

                {/* Reason */}
                <div className="form-group" style={{ marginBottom: 24 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    📝 Reason
                  </label>
                  <textarea
                    className="form-input"
                    placeholder="Enter reason for leave…"
                    value={form.reason}
                    onChange={e => handleChange('reason', e.target.value)}
                    rows={4}
                    style={{
                      resize: 'vertical', minHeight: 90,
                      ...(errors.reason ? { borderColor: 'rgba(239,68,68,0.5)' } : {}),
                    }}
                  />
                  {errors.reason && <span style={{ fontSize: 11, color: '#f87171' }}>{errors.reason}</span>}
                </div>

                {/* Submit */}
                <LoaderButton
                  type="submit"
                  className="btn-primary"
                  style={{ width: '100%', padding: '14px', fontSize: 15, fontWeight: 700 }}
                  disabled={submitting}
                  onClick={handleSubmit}
                >
                  {submitting ? '⏳ Submitting…' : '✅ Submit Leave Request'}
                </LoaderButton>
              </div>
            </form>

            {/* ── Right: Info Panel ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Selected Employee Preview */}
              {form.employeeId && (() => {
                const emp = employees.find(e => e.id === form.employeeId);
                return emp ? (
                  <div className="form-card" style={{ background: '#080c08', border: '1px solid rgba(118,199,51,0.18)' }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#76c733', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                      👤 Selected Employee
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {[
                        ['Name', emp.name],
                        ['Employee ID', emp.id],
                        ['Department', emp.department || '—'],
                        ['Designation', emp.designation || '—'],
                        ['Status', emp.status || '—'],
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

              {/* Leave Types Info */}
              <div className="form-card" style={{ background: '#080c08' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                  ℹ️ Leave Policy
                </h3>
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
                  Leave is submitted on behalf of the selected employee and will appear in their record for review.
                </p>
              </div>

              {/* Note */}
              <div style={{
                background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)',
                borderRadius: 12, padding: '14px 16px',
              }}>
                <p style={{ fontSize: 12, color: '#f59e0b', margin: 0, fontWeight: 600, marginBottom: 6 }}>
                  ⚠️ HR Notice
                </p>
                <p style={{ fontSize: 12, color: '#a08050', margin: 0, lineHeight: 1.6 }}>
                  You are applying leave on behalf of an employee. The leave status will be set to <strong style={{ color: '#f59e0b' }}>Pending</strong> and can be approved by Super Admin.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Toast */}
      {toast.show && (
        <div className="toast" style={
          toast.type === 'error'
            ? { background: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.3)' }
            : {}
        }>
          <span className="toast-icon">{toast.type === 'error' ? '⚠️' : '📅'}</span>
          <span className="toast-msg" style={toast.type === 'error' ? { color: '#f87171' } : {}}>{toast.msg}</span>
        </div>
      )}
    </div>
  );
};

export default ApplyLeave;
