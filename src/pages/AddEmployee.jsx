import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useEmployee } from '../context/EmployeeContext';
import '../styles/dashboard.css';

const DEPARTMENTS = ['ADMIN (1 offs/wk)', 'Security', 'HR', 'Design', 'Quality', 'Sales', 'SOC', 'NOC', 'FMS', 'Operations', 'Marketing', 'Compliance', 'CXO', 'Directorship'];
const SHIFTS      = ['None', 'Morning Shift', 'Night Shift', 'General'];
const GENDERS     = ['Male', 'Female', 'Other'];
const DURATIONS   = ['6 Hours', '8 Hours', '9 Hours'];
const OFFS        = ['None', '1 Day', '2 Days'];
const WORK_TYPES  = ['Rotational (24/7)', 'Fixed'];
const OVERTIME    = ['0 hrs (Base)', '1 hr', '2 hrs'];
const LEAVE_TYPES = ['Week Off (WO)', 'Sick Leave', 'Casual Leave', 'Earned Leave'];
const MOCK_EMPLOYEES = ['QBL-E0001 - Puspinder Singh', 'QBL-E0002 - Hemant Sharma', 'QBL-E0003 - Khushi Verma'];

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
  const { refreshEmployees } = useEmployee();
  const [showToast, setShowToast]       = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [serverError, setServerError]   = useState('');

  const [form, setForm] = useState({
    employeeCode:    '',
    fullName:        '',
    designation:     '',
    gender:          'Male',
    dob:             '',
    joinDate:        '',
    assets:          '',
    docUrl:          '',
    department:      'ADMIN (1 offs/wk)',
    defaultShift:    'None',
    offsPerWeek:     '2 Days',
    duration:        '6 Hours',
    startTime:       '',
    endTime:         '',
    kra:             '',
    kpa:             '',
    // 🔐 Login credentials
    email:           '',
    password:        '',
    confirmPassword: '',
  });

  const [deptForm,  setDeptForm]  = useState({ deptName: '', workType: 'Rotational (24/7)', offs: '2 Days' });
  const [shiftForm, setShiftForm] = useState({ shiftName: '', shiftCode: '', start: '', end: '', duration: '6 Hours', overtime: '0 hrs (Base)' });
  const [leaveForm, setLeaveForm] = useState({ employee: 'QBL-E0001 - Puspinder Singh', leaveType: 'Week Off (WO)', fromDate: '', toDate: '', reason: '' });
  const [errors, setErrors] = useState({});

  // ── Validation ──
  const validate = () => {
    const e = {};
    if (!form.employeeCode.trim())   e.employeeCode    = 'Employee code is required';
    if (!form.fullName.trim())       e.fullName        = 'Full name is required';
    if (!form.password)              e.password        = 'Password is required';
    if (form.password.length < 6)    e.password        = 'Password must be at least 6 characters';
    if (!form.confirmPassword)       e.confirmPassword = 'Please confirm the password';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    return e;
  };

  // ── Change handlers ──
  const handleChange      = (field, val) => {
    setForm(f => ({ ...f, [field]: val }));
    setServerError('');
    if (errors[field]) setErrors(e => { const ne = { ...e }; delete ne[field]; return ne; });
  };
  const handleDeptChange  = (field, val) => setDeptForm(f  => ({ ...f, [field]: val }));
  const handleShiftChange = (field, val) => setShiftForm(f => ({ ...f, [field]: val }));
  const handleLeaveChange = (field, val) => setLeaveForm(f => ({ ...f, [field]: val }));

  // ── Submit → saves to MongoDB (users + employeeDetails) ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmitLoading(true);

    const payload = {
      employeeCode: form.employeeCode,
      fullName:     form.fullName,
      email:        form.email     || undefined,
      password:     form.password,
      designation:  form.designation,
      department:   form.department,
      gender:       form.gender,
      dob:          form.dob,
      joinDate:     form.joinDate,
      assets:       form.assets,
      docUrl:       form.docUrl,
      shiftType:    'Rotational',
      shift:        form.defaultShift,
      offsPerWeek:  parseInt(form.offsPerWeek) || 0,
      duration:     form.duration,
      startTime:    form.startTime,
      endTime:      form.endTime,
      kra:          form.kra,
      kpa:          form.kpa,
    };

    console.log('📤 [ADD-EMPLOYEE FORM] Sending to server:', { ...payload, password: '***hidden***' });

    try {
      const response = await fetch(`${API_URL}/employees/add-employee`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('📬 [ADD-EMPLOYEE FORM] Server response:', data);

      if (!response.ok) {
        setServerError(data.message || 'Failed to add employee. Please try again.');
        setSubmitLoading(false);
        return;
      }

      // Re-fetch employees from MongoDB so the table shows the newly added employee
      await refreshEmployees();

      setShowToast(true);
      setTimeout(() => { setShowToast(false); navigate('/employees'); }, 2000);

    } catch (err) {
      console.error('❌ [ADD-EMPLOYEE FORM] Network error:', err);
      setServerError('Network error. Make sure the backend server is running.');
      setSubmitLoading(false);
    }
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
            <button className="btn-secondary" onClick={() => navigate('/employees')}>
              ← Back to Directory
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(320px, 350px)', gap: 24, alignItems: 'start' }}>

            {/* ── Left: Main Form ── */}
            <form onSubmit={handleSubmit} noValidate>

              {/* Personal Info */}
              <div className="form-card" style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                  👤 Personal Information
                </h3>
                <Field label="Employee Code"  field="employeeCode" placeholder="e.g. QBL-E0026" form={form} errors={errors} handleChange={handleChange} />
                <Field label="Full Name"       field="fullName"     form={form} errors={errors} handleChange={handleChange} />
                <Field label="Designation"     field="designation"  placeholder="e.g., Manager, Executive" form={form} errors={errors} handleChange={handleChange} />
                <Select label="Gender"         field="gender"       options={GENDERS}      form={form} errors={errors} handleChange={handleChange} />
                <Field label="Date of Birth"   field="dob"          type="date"            form={form} errors={errors} handleChange={handleChange} />
                <Field label="Joining Date"    field="joinDate"     type="date"            form={form} errors={errors} handleChange={handleChange} />
                <Textarea label="Company Assets" field="assets" placeholder="e.g., Laptop, ID Card, Access Card" form={form} errors={errors} handleChange={handleChange} />
                <Field
                  label="Verification Document URL"
                  field="docUrl"
                  placeholder="https://drive.google.com/..."
                  hint="Paste Google Drive or OneDrive link"
                  form={form} errors={errors} handleChange={handleChange}
                />
              </div>

              {/* Work & Shift */}
              <div className="form-card" style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                  🏢 Work &amp; Shift Details
                </h3>
                <Select label="Department"   field="department"   options={DEPARTMENTS} form={form} errors={errors} handleChange={handleChange} />
                <Select label="Default Shift" field="defaultShift" options={SHIFTS}      form={form} errors={errors} handleChange={handleChange} />
                <Select label="Offs / Week"   field="offsPerWeek"  options={OFFS}        form={form} errors={errors} handleChange={handleChange} />
                <Select label="Duration"      field="duration"     options={DURATIONS}   form={form} errors={errors} handleChange={handleChange} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Field label="Start" field="startTime" type="time" form={form} errors={errors} handleChange={handleChange} />
                  <Field label="End"   field="endTime"   type="time" form={form} errors={errors} handleChange={handleChange} />
                </div>
                <Textarea label="KRA" icon="🎯" field="kra" form={form} errors={errors} handleChange={handleChange} />
              </div>

              {/* KPA */}
              <div className="form-card" style={{ marginBottom: 20 }}>
                <Textarea label="KPA" icon="📈" field="kpa" form={form} errors={errors} handleChange={handleChange} />
              </div>

              {/* 🔐 Login Credentials */}
              <div className="form-card" style={{ marginBottom: 24, border: '1px solid rgba(92, 184, 92, 0.2)', background: 'rgba(92,184,92,0.03)' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#5cb85c', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                  🔐 Login Credentials
                </h3>
                <p style={{ fontSize: 12, color: '#6b7b6b', marginBottom: 20 }}>
                  These will let the employee sign in to the portal. Password is securely hashed before storage.
                </p>

                <Field
                  label="Email Address (optional)"
                  field="email"
                  type="email"
                  placeholder="e.g. john@quisitive.com  —  auto-generated if blank"
                  form={form} errors={errors} handleChange={handleChange}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Field
                    label="Password" icon="🔑"
                    field="password" type="password"
                    placeholder="Min. 6 characters"
                    form={form} errors={errors} handleChange={handleChange}
                  />
                  <Field
                    label="Confirm Password" icon="✅"
                    field="confirmPassword" type="password"
                    placeholder="Re-enter password"
                    form={form} errors={errors} handleChange={handleChange}
                  />
                </div>
              </div>

              {/* Server Error Banner */}
              {serverError && (
                <div style={{
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 12, padding: '12px 16px', marginBottom: 16,
                  fontSize: 13, color: '#f87171', display: 'flex', alignItems: 'center', gap: 8
                }}>
                  ⚠️ {serverError}
                </div>
              )}

              <div className="form-actions" style={{ marginBottom: 40 }}>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ width: '100%', padding: '14px', opacity: submitLoading ? 0.7 : 1 }}
                  disabled={submitLoading}
                >
                  {submitLoading ? '⏳ Saving to Database…' : '✅ Add Employee'}
                </button>
              </div>
            </form>

            {/* ── Right: Side Panels ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* Add Department */}
              <div className="form-card" style={{ background: '#080c08' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 16, borderBottom: '1px solid #1a2a1a' }}>
                  🏢 Add Department
                </h3>
                <Field label="Department Name" field="deptName"  form={deptForm} errors={{}} handleChange={handleDeptChange} />
                <Select label="Work Type"       field="workType"  options={WORK_TYPES} form={deptForm} errors={{}} handleChange={handleDeptChange} />
                <Select label="Offs Per Week"   field="offs"      options={OFFS}       form={deptForm} errors={{}} handleChange={handleDeptChange} />
                <button type="button" className="btn-primary" style={{ width: '100%', marginTop: 8 }}>
                  Add Department
                </button>
              </div>

              {/* Add Shift */}
              <div className="form-card" style={{ background: '#080c08' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 16, borderBottom: '1px solid #1a2a1a' }}>
                  ⏱ Add Shift
                </h3>
                <Field label="Shift Name" field="shiftName" placeholder="e.g., Morning Shift" form={shiftForm} errors={{}} handleChange={handleShiftChange} />
                <Field label="Shift Code" field="shiftCode" placeholder="e.g., M"             form={shiftForm} errors={{}} handleChange={handleShiftChange} />
                <Field label="Start Time" field="start"     type="time" form={shiftForm} errors={{}} handleChange={handleShiftChange} />
                <Field label="End Time"   field="end"       type="time" form={shiftForm} errors={{}} handleChange={handleShiftChange} />
                <Select label="Duration (Hours)" field="duration" options={DURATIONS} form={shiftForm} errors={{}} handleChange={handleShiftChange} />
                <Select label="Overtime Hours"   field="overtime" options={OVERTIME}  form={shiftForm} errors={{}} handleChange={handleShiftChange} />
                <button type="button" className="btn-secondary" style={{ width: '100%', marginTop: 8, borderColor: '#0ea5e9', color: '#0ea5e9', background: 'rgba(14,165,233,0.1)' }}>
                  Add Shift
                </button>
              </div>

              {/* Submit Leave Request */}
              <div className="form-card" style={{ background: '#080c08' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 16, borderBottom: '1px solid #1a2a1a' }}>
                  📋 Submit Leave Request
                </h3>
                <Select label="Employee"   field="employee"  options={MOCK_EMPLOYEES} form={leaveForm} errors={{}} handleChange={handleLeaveChange} />
                <Select label="Leave Type" field="leaveType" options={LEAVE_TYPES}    form={leaveForm} errors={{}} handleChange={handleLeaveChange} />
                <Field label="From Date"   field="fromDate"  type="date" form={leaveForm} errors={{}} handleChange={handleLeaveChange} />
                <Field label="To Date"     field="toDate"    type="date" form={leaveForm} errors={{}} handleChange={handleLeaveChange} />
                <Textarea label="Reason"   field="reason"    form={leaveForm} errors={{}} handleChange={handleLeaveChange} />
                <button type="button" className="btn-primary" style={{ width: '100%', marginTop: 8, background: '#f59e0b', color: '#000', border: 'none' }}>
                  Submit Request
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>

      {showToast && (
        <div className="toast">
          <span className="toast-icon">✅</span>
          <span className="toast-msg">Employee added successfully! Saved to MongoDB.</span>
        </div>
      )}
    </div>
  );
};

export default AddEmployee;
