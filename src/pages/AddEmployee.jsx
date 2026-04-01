import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useEmployee } from '../context/EmployeeContext';
import { useUser } from '../context/UserContext';
import '../styles/dashboard.css';
import LoaderButton from '../components/LoaderButton';
import { Trash2 } from 'lucide-react';

const GENDERS   = ['Male', 'Female', 'Other'];
const DURATIONS = ['6 Hours', '8 Hours', '9 Hours'];
const OFFS      = ['None', '1 Day', '2 Days'];
const WORK_TYPES = ['Rotational (24/7)', 'Fixed'];
const OVERTIME   = ['0 hrs (Base)', '1 hr', '2 hrs'];

// ── Reusable sub-components ──────────────────────────────────────────────────
const Field = ({ label, field, type = 'text', placeholder, form, errors, handleChange, hint, icon }) => (
  <div className="form-group" style={{ marginBottom: 16 }}>
    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {icon} {label}
    </label>
    <input
      className="form-input"
      type={type}
      placeholder={placeholder || label}
      value={form[field] || ''}
      onChange={e => handleChange(field, e.target.value)}
      style={errors[field] ? { borderColor: 'rgba(239,68,68,0.5)' } : {}}
    />
    {hint && <span style={{ fontSize: 13, color: '#6b7b6b', marginTop: 6, display: 'block' }}>{hint}</span>}
    {errors[field] && <span style={{ fontSize: 11, color: '#f87171' }}>{errors[field]}</span>}
  </div>
);

const Select = ({ label, field, options, form, errors, handleChange }) => (
  <div className="form-group" style={{ marginBottom: 16 }}>
    <label className="form-label">{label}</label>
    <select
      className="form-select"
      value={form[field] || ''}
      onChange={e => handleChange(field, e.target.value)}
      style={errors[field] ? { borderColor: 'rgba(239,68,68,0.5)' } : {}}
    >
      <option value="">Select {label}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
    {errors[field] && <span style={{ fontSize: 11, color: '#f87171' }}>{errors[field]}</span>}
  </div>
);

const Textarea = ({ label, field, placeholder, form, errors, handleChange, hint, icon }) => (
  <div className="form-group" style={{ marginBottom: 16 }}>
    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {icon} {label}
    </label>
    <textarea
      className="form-input"
      placeholder={placeholder || label}
      value={form[field] || ''}
      onChange={e => handleChange(field, e.target.value)}
      rows={4}
      style={{ resize: 'vertical', minHeight: 80, ...(errors[field] ? { borderColor: 'rgba(239,68,68,0.5)' } : {}) }}
    />
    {hint && <span style={{ fontSize: 13, color: '#6b7b6b', marginTop: 6, display: 'block' }}>{hint}</span>}
    {errors[field] && <span style={{ fontSize: 11, color: '#f87171' }}>{errors[field]}</span>}
  </div>
);

// ── Main Component ───────────────────────────────────────────────────────────
const AddEmployee = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { refreshEmployees } = useEmployee();
  const [showToast, setShowToast]     = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg, setResetMsg]       = useState('');

  // ── Dynamic lists from DB ────────────────────────────────────────────────
  const [departments, setDepartments] = useState([]);
  const [shifts, setShifts]           = useState([]);
  const [deptLoading, setDeptLoading] = useState(false);
  const [shiftLoading, setShiftLoading] = useState(false);
  const [deptError, setDeptError]     = useState('');
  const [shiftError, setShiftError]   = useState('');

  const fetchDepartments = async () => {
    try {
      const res = await fetch(`${API_URL}/departments`, { credentials: 'include' });
      const data = await res.json();
      setDepartments(data.departments || []);
    } catch { setDepartments([]); }
  };

  const fetchShifts = async () => {
    try {
      const res = await fetch(`${API_URL}/shifts`, { credentials: 'include' });
      const data = await res.json();
      setShifts(data.shifts || []);
    } catch { setShifts([]); }
  };

  useEffect(() => {
    fetchDepartments();
    fetchShifts();
  }, []);

  // ── Main employee form ───────────────────────────────────────────────────
  const [form, setForm] = useState({
    employeeCode: '', fullName: '', designation: '',
    phone: '', gender: 'Male', dob: '', joinDate: '',
    assets: '', docUrl: '', profileImage: '',
    department: '', defaultShift: '',
    offsPerWeek: '2 Days', duration: '6 Hours',
    startTime: '', endTime: '', kra: '', kpa: '',
    targetCode: '', password: '', confirmPassword: '',
    role: 'employee', managerId: '',
  });

  // ── Add Department form ──────────────────────────────────────────────────
  const [deptForm, setDeptForm] = useState({ deptName: '', workType: 'Fixed', offs: '1' });

  // ── Add Shift form ───────────────────────────────────────────────────────
  const [shiftForm, setShiftForm] = useState({ shiftName: '', shiftCode: '', start: '', end: '', duration: '9 Hours', overtime: '0 hrs (Base)' });

  const [errors, setErrors] = useState({});

  // Set defaults once lists load
  useEffect(() => {
    if (departments.length > 0 && !form.department) {
      setForm(f => ({ ...f, department: departments[0].name }));
    }
  }, [departments]);

  useEffect(() => {
    if (shifts.length > 0 && !form.defaultShift) {
      setForm(f => ({ ...f, defaultShift: shifts[0].name }));
    }
  }, [shifts]);

  // ── Validation ──
  const validate = () => {
    const e = {};
    if (!form.employeeCode.trim()) e.employeeCode = 'Employee code is required';
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (!form.password) e.password = 'Password is required';
    if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (!form.confirmPassword) e.confirmPassword = 'Please confirm the password';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    return e;
  };

  const handleChange = (field, val) => {
    setForm(f => ({ ...f, [field]: val }));
    setServerError('');
    if (errors[field]) setErrors(e => { const ne = { ...e }; delete ne[field]; return ne; });
  };

  // ── Submit ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitLoading(true);

    const payload = {
      employeeCode: form.employeeCode,
      fullName: form.fullName,
      email: form.targetCode || undefined,
      phone: form.phone,
      password: form.password,
      designation: form.designation,
      department: form.department,
      gender: form.gender,
      dob: form.dob,
      joinDate: form.joinDate,
      assets: form.assets,
      docUrl: form.docUrl,
      profileImage: form.profileImage,
      shiftType: 'Rotational',
      shift: form.defaultShift,
      offsPerWeek: parseInt(form.offsPerWeek) || 0,
      duration: form.duration,
      startTime: form.startTime,
      endTime: form.endTime,
      kra: form.kra,
      kpa: form.kpa,
      role: form.role || 'employee',
      managerId: user?.role === 'manager' ? user.employeeId : (form.managerId || undefined),
    };

    try {
      const response = await fetch(`${API_URL}/employees/add-employee`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        setServerError(data.error || data.message || 'Failed to add employee. Please try again.');
        setSubmitLoading(false);
        return;
      }
      await refreshEmployees();
      setShowToast(true);
      setTimeout(() => { setShowToast(false); navigate('/employees'); }, 2000);
    } catch (err) {
      setServerError('Network error. Make sure the backend server is running.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setResetMsg('');
    if (!form.targetCode) { setResetMsg(' Please enter the Employee Code to reset.'); return; }
    if (!form.password || form.password.length < 6) { setResetMsg(' New password must be at least 6 characters.'); return; }
    if (form.password !== form.confirmPassword) { setResetMsg(' Passwords do not match.'); return; }
    setResetLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/admin-reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ adminEmployeeId: user?.id, targetEmployeeId: form.targetCode, newPassword: form.password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResetMsg(` ${data.message || 'Password reset failed.'}`);
      } else {
        setResetMsg(` ${data.message || 'Password reset successfully!'}`);
        setForm(f => ({ ...f, targetCode: '', password: '', confirmPassword: '' }));
      }
    } catch { setResetMsg(' Network error. Please try again.'); }
    finally { setResetLoading(false); }
  };

  // ── Add Department handler ───────────────────────────────────────────────
  const handleAddDepartment = async () => {
    if (!deptForm.deptName.trim()) { setDeptError('Department name is required'); return; }
    setDeptError('');
    setDeptLoading(true);
    try {
      const res = await fetch(`${API_URL}/departments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: deptForm.deptName.trim(),
          workType: deptForm.workType,
          offsPerWeek: parseInt(deptForm.offs) || 1,
          callerId: user?.employeeId,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setDeptError(data.message || 'Failed to add department'); return; }
      setDeptForm({ deptName: '', workType: 'Fixed', offs: '1' });
      await fetchDepartments();
    } catch { setDeptError('Network error. Please try again.'); }
    finally { setDeptLoading(false); }
  };

  const handleDeleteDepartment = async (id) => {
    if (!window.confirm('Delete this department?')) return;
    try {
      await fetch(`${API_URL}/departments/${id}`, { method: 'DELETE', credentials: 'include' });
      await fetchDepartments();
    } catch { alert('Failed to delete department'); }
  };

  // ── Add Shift handler ────────────────────────────────────────────────────
  const handleAddShift = async () => {
    if (!shiftForm.shiftName.trim()) { setShiftError('Shift name is required'); return; }
    setShiftError('');
    setShiftLoading(true);
    try {
      const res = await fetch(`${API_URL}/shifts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: shiftForm.shiftName.trim(),
          shiftCode: shiftForm.shiftCode,
          startTime: shiftForm.start,
          endTime: shiftForm.end,
          duration: shiftForm.duration,
          overtime: shiftForm.overtime,
          callerId: user?.employeeId,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setShiftError(data.message || 'Failed to add shift'); return; }
      setShiftForm({ shiftName: '', shiftCode: '', start: '', end: '', duration: '9 Hours', overtime: '0 hrs (Base)' });
      await fetchShifts();
    } catch { setShiftError('Network error. Please try again.'); }
    finally { setShiftLoading(false); }
  };

  const handleDeleteShift = async (id) => {
    if (!window.confirm('Delete this shift?')) return;
    try {
      await fetch(`${API_URL}/shifts/${id}`, { method: 'DELETE', credentials: 'include' });
      await fetchShifts();
    } catch { alert('Failed to delete shift'); }
  };

  // ── Inline styles ─────────────────────────────────────────────────────────
  const listItemStyle = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '7px 10px', borderRadius: 6, marginBottom: 4,
    background: 'rgba(255,255,255,0.03)', border: '1px solid #1a2a1a',
    fontSize: 13, color: '#c0d0c0',
  };
  const deleteBtnStyle = {
    background: 'none', border: 'none', cursor: 'pointer',
    color: '#f87171', padding: '2px 4px', borderRadius: 4,
    display: 'flex', alignItems: 'center',
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="main-wrapper">
        <Navbar title="Add Employee" subtitle="Complete the form below to onboard a new team member" />

        <div className="content-container">
          <div className="page-header" style={{ marginBottom: 24 }}>
            <div>
              <h1 className="page-title">Add New Employee</h1>
              <p className="page-subtitle">Complete the form below to onboard a new team member</p>
            </div>
            <LoaderButton className="btn-secondary" onClick={() => navigate('/employees')}>
              ← Back to Directory
            </LoaderButton>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(320px, 360px)', gap: 24, alignItems: 'start' }}>

            {/* ── Left: Main Employee Form ── */}
            <form onSubmit={handleSubmit} noValidate>

              {/* Personal Info */}
              <div className="form-card" style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                  Personal Information
                </h3>
                <Field label="Employee Code" field="employeeCode" placeholder="e.g. QBL-E0026" form={form} errors={errors} handleChange={handleChange} />
                <Field label="Full Name" field="fullName" form={form} errors={errors} handleChange={handleChange} />
                <Field label="Phone Number" field="phone" type="tel" placeholder="e.g. +1 123 456 7890" form={form} errors={errors} handleChange={handleChange} />
                <Field label="Designation" field="designation" placeholder="e.g., Manager, Executive" form={form} errors={errors} handleChange={handleChange} />
                <Select label="Gender" field="gender" options={GENDERS} form={form} errors={errors} handleChange={handleChange} />
                <Field label="Date of Birth" field="dob" type="date" form={form} errors={errors} handleChange={handleChange} />
                <Field label="Joining Date" field="joinDate" type="date" form={form} errors={errors} handleChange={handleChange} />
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    Profile Image
                  </label>
                  <input
                    className="form-input" type="file" accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        if (file.size > 2 * 1024 * 1024) { alert('Image size should be less than 2MB'); e.target.value = ''; return; }
                        const reader = new FileReader();
                        reader.onloadend = () => handleChange('profileImage', reader.result);
                        reader.readAsDataURL(file);
                      }
                    }}
                    style={{ paddingTop: '8px' }}
                  />
                  {form.profileImage && (
                    <div style={{ marginTop: 10 }}>
                      <img src={form.profileImage} alt="Profile Preview" style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', border: '2px solid #76c733' }} />
                    </div>
                  )}
                </div>
                <Textarea label="Company Assets" field="assets" placeholder="e.g., Laptop, ID Card, Access Card" form={form} errors={errors} handleChange={handleChange} />
                <Field label="Verification Document URL" field="docUrl" placeholder="https://drive.google.com/..." hint="Paste Google Drive or OneDrive link" form={form} errors={errors} handleChange={handleChange} />
              </div>

              {/* Work & Shift — uses dynamic lists from DB */}
              <div className="form-card" style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                  Work &amp; Shift Details
                </h3>

                {/* Department — dynamic from DB */}
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">Department</label>
                  <select
                    className="form-select"
                    value={form.department}
                    onChange={e => handleChange('department', e.target.value)}
                  >
                    <option value="">Select Department</option>
                    {departments.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
                  </select>
                </div>

                {/* Shift — dynamic from DB */}
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">Default Shift</label>
                  <select
                    className="form-select"
                    value={form.defaultShift}
                    onChange={e => handleChange('defaultShift', e.target.value)}
                  >
                    <option value="">Select Shift</option>
                    {shifts.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>

                <Select label="Offs / Week" field="offsPerWeek" options={OFFS} form={form} errors={errors} handleChange={handleChange} />
                <Select label="Duration" field="duration" options={DURATIONS} form={form} errors={errors} handleChange={handleChange} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Field label="Start" field="startTime" type="time" form={form} errors={errors} handleChange={handleChange} />
                  <Field label="End" field="endTime" type="time" form={form} errors={errors} handleChange={handleChange} />
                </div>
                <Textarea label="KRA" icon="" field="kra" form={form} errors={errors} handleChange={handleChange} />
              </div>

              {/* KPA */}
              <div className="form-card" style={{ marginBottom: 20 }}>
                <Textarea label="KPA" icon="" field="kpa" form={form} errors={errors} handleChange={handleChange} />
              </div>

              {/* Login Credentials */}
              <div className="form-card" style={{ marginBottom: 24, border: '1px solid rgba(92,184,92,0.2)', background: 'rgba(92,184,92,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#5cb85c', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                    Login Credentials
                  </h3>
                  {user?.role === 'superadmin' && (
                    <LoaderButton type="button" onClick={handleResetPassword} disabled={resetLoading}
                      style={{ background: '#fbbf24', color: '#000', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: resetLoading ? 'wait' : 'pointer' }}>
                      {resetLoading ? '⏳ Resetting...' : ' Reset Password'}
                    </LoaderButton>
                  )}
                </div>
                <p style={{ fontSize: 12, color: '#6b7b6b', marginBottom: 20 }}>
                  These will let the employee sign in to the portal. Super Admins can also reset passwords here.
                </p>
                {user?.role === 'superadmin' ? (
                  <Field label="Employee Code (For Password Reset)" field="targetCode" type="text" placeholder="e.g. QBL-E0021" form={form} errors={errors} handleChange={handleChange} />
                ) : (
                  <Field label="Email Address (optional)" field="targetCode" type="email" placeholder="e.g. john@quisitive.com  —  auto-generated if blank" form={form} errors={errors} handleChange={handleChange} />
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Field label="Password" icon="" field="password" type="password" placeholder="Min. 6 characters" form={form} errors={errors} handleChange={handleChange} />
                  <Field label="Confirm Password" icon="" field="confirmPassword" type="password" placeholder="Re-enter password" form={form} errors={errors} handleChange={handleChange} />
                </div>
                {resetMsg && <div style={{ marginTop: 12, fontSize: 13, color: resetMsg.startsWith('') ? '#4ade80' : '#f87171' }}>{resetMsg}</div>}
              </div>

              {/* RBAC */}
              <div className="form-card" style={{ marginBottom: 24, border: '1px solid rgba(99,102,241,0.25)', background: 'rgba(99,102,241,0.04)' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#818cf8', display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 6px' }}>
                  Role &amp; Access Control
                </h3>
                <p style={{ fontSize: 12, color: '#6b7b6b', marginBottom: 20 }}>
                  Assign a role to control what this user can access in the portal.
                </p>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">Role</label>
                  <select className="form-select" value={form.role} onChange={e => handleChange('role', e.target.value)}>
                    <option value="employee">Employee — limited view (own data)</option>
                    {(user?.role === 'superadmin' || user?.role === 'hr') && (
                      <>
                        <option value="hr">HR — all employees, no leave approval</option>
                        <option value="manager">Manager — own team, no leave approval</option>
                        <option value="superadmin">Super Admin — full access + leave approval</option>
                      </>
                    )}
                  </select>
                </div>
                {form.role === 'employee' && (user?.role === 'superadmin' || user?.role === 'hr') && (
                  <Field label="Manager Employee Code (Optional)" icon="" field="managerId" placeholder="e.g. QBL-E0010"
                    hint="Link this employee to a manager. Leave blank if not assigned." form={form} errors={errors} handleChange={handleChange} />
                )}
                {form.role === 'employee' && user?.role === 'manager' && (
                  <div style={{ marginTop: 8, marginBottom: 16, fontSize: 13, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(16,185,129,0.3)' }}>
                    This employee will be automatically assigned to your team.
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                  {[
                    { r: 'superadmin', label: ' Super Admin', color: '#f59e0b' },
                    { r: 'manager',    label: ' Manager',     color: '#0ea5e9' },
                    { r: 'hr',         label: '‍ HR',        color: '#a78bfa' },
                    { r: 'employee',   label: ' Employee',   color: '#76c733' },
                  ].map(({ r, label, color }) => (
                    <span key={r} style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, color, background: `${color}18`, border: `1px solid ${color}40`, opacity: form.role === r ? 1 : 0.3, transition: 'opacity 0.2s' }}>{label}</span>
                  ))}
                </div>
              </div>

              {serverError && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#f87171', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {serverError}
                </div>
              )}

              <div className="form-actions" style={{ marginBottom: 40 }}>
                <LoaderButton type="submit" className="btn-primary" loading={submitLoading}
                  style={{ width: '100%', padding: '14px', opacity: submitLoading ? 0.7 : 1 }} disabled={submitLoading}>
                  {submitLoading ? '⏳ Saving to Database…' : ' Add Employee'}
                </LoaderButton>
              </div>
            </form>

            {/* ── Right: Side Panels ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* ─── Add Department Panel ─────────────────────────────── */}
              <div className="form-card" style={{ background: '#080c08' }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fbbf24', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 12, borderBottom: '1px solid #1a2a1a' }}>
                   Departments
                </h3>

                {/* Add form */}
                <div style={{ marginBottom: 14 }}>
                  <input
                    className="form-input"
                    placeholder="New department name…"
                    value={deptForm.deptName}
                    onChange={e => setDeptForm(f => ({ ...f, deptName: e.target.value }))}
                    style={{ marginBottom: 8 }}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                    <select className="form-select" value={deptForm.workType} onChange={e => setDeptForm(f => ({ ...f, workType: e.target.value }))}>
                      {WORK_TYPES.map(w => <option key={w}>{w}</option>)}
                    </select>
                    <select className="form-select" value={deptForm.offs} onChange={e => setDeptForm(f => ({ ...f, offs: e.target.value }))}>
                      <option value="0">0 offs/wk</option>
                      <option value="1">1 off/wk</option>
                      <option value="2">2 offs/wk</option>
                    </select>
                  </div>
                  {deptError && <p style={{ color: '#f87171', fontSize: 12, margin: '0 0 6px' }}>{deptError}</p>}
                  <LoaderButton
                    type="button"
                    loading={deptLoading}
                    onClick={handleAddDepartment}
                    style={{ width: '100%', padding: '9px', background: '#fbbf24', border: 'none', borderRadius: 6, color: '#000', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                  >
                    {deptLoading ? 'Saving…' : '+ Add Department'}
                  </LoaderButton>
                </div>

                {/* Existing list */}
                <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                  {departments.length === 0 ? (
                    <p style={{ color: '#4a5b4a', fontSize: 12, textAlign: 'center', padding: '12px 0' }}>No departments yet</p>
                  ) : departments.map(d => (
                    <div key={d._id} style={listItemStyle}>
                      <div>
                        <span style={{ fontWeight: 600 }}>{d.name}</span>
                        <span style={{ fontSize: 11, color: '#6b7b6b', marginLeft: 8 }}>{d.workType} · {d.offsPerWeek} off/wk</span>
                      </div>
                      <button style={deleteBtnStyle} onClick={() => handleDeleteDepartment(d._id)} title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* ─── Add Shift Panel ──────────────────────────────────── */}
              <div className="form-card" style={{ background: '#080c08' }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#38bdf8', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 12, borderBottom: '1px solid #1a2a1a' }}>
                   Shifts
                </h3>

                {/* Add form */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                    <input className="form-input" placeholder="Shift name…" value={shiftForm.shiftName} onChange={e => setShiftForm(f => ({ ...f, shiftName: e.target.value }))} />
                    <input className="form-input" placeholder="Code (e.g. M)" value={shiftForm.shiftCode} onChange={e => setShiftForm(f => ({ ...f, shiftCode: e.target.value }))} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                    <div>
                      <label style={{ fontSize: 11, color: '#6b7b6b', display: 'block', marginBottom: 3 }}>Start Time</label>
                      <input className="form-input" type="time" value={shiftForm.start} onChange={e => setShiftForm(f => ({ ...f, start: e.target.value }))} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: '#6b7b6b', display: 'block', marginBottom: 3 }}>End Time</label>
                      <input className="form-input" type="time" value={shiftForm.end} onChange={e => setShiftForm(f => ({ ...f, end: e.target.value }))} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                    <select className="form-select" value={shiftForm.duration} onChange={e => setShiftForm(f => ({ ...f, duration: e.target.value }))}>
                      {DURATIONS.map(d => <option key={d}>{d}</option>)}
                    </select>
                    <select className="form-select" value={shiftForm.overtime} onChange={e => setShiftForm(f => ({ ...f, overtime: e.target.value }))}>
                      {OVERTIME.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  {shiftError && <p style={{ color: '#f87171', fontSize: 12, margin: '0 0 6px' }}>{shiftError}</p>}
                  <LoaderButton
                    type="button"
                    loading={shiftLoading}
                    onClick={handleAddShift}
                    style={{ width: '100%', padding: '9px', background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.4)', borderRadius: 6, color: '#38bdf8', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                  >
                    {shiftLoading ? 'Saving…' : '+ Add Shift'}
                  </LoaderButton>
                </div>

                {/* Existing list */}
                <div style={{ maxHeight: 180, overflowY: 'auto' }}>
                  {shifts.length === 0 ? (
                    <p style={{ color: '#4a5b4a', fontSize: 12, textAlign: 'center', padding: '12px 0' }}>No shifts yet</p>
                  ) : shifts.map(s => (
                    <div key={s._id} style={listItemStyle}>
                      <div>
                        <span style={{ fontWeight: 600 }}>{s.name}</span>
                        {s.shiftCode && <span style={{ fontSize: 11, color: '#38bdf8', marginLeft: 6, background: 'rgba(56,189,248,0.1)', padding: '1px 5px', borderRadius: 4 }}>{s.shiftCode}</span>}
                        {(s.startTime || s.endTime) && (
                          <span style={{ fontSize: 11, color: '#6b7b6b', marginLeft: 6 }}>{s.startTime} – {s.endTime}</span>
                        )}
                      </div>
                      <button style={deleteBtnStyle} onClick={() => handleDeleteShift(s._id)} title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {showToast && (
        <div className="toast">
          <span className="toast-icon"></span>
          <span className="toast-msg">Employee added successfully! Saved to MongoDB.</span>
        </div>
      )}
    </div>
  );
};

export default AddEmployee;
