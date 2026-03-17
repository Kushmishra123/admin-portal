import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import EmployeeTable from '../components/EmployeeTable';
import { useEmployee } from '../context/EmployeeContext';
import '../styles/dashboard.css';

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
            📊 {emp.id} - {emp.name} (Year {currentYear})
          </div>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', color: '#60a5fa',
            cursor: 'pointer', fontSize: 16, fontWeight: 'bold'
          }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '16px', background: '#0e1510' }}>
          {/* Info Card */}
          <div style={{ 
            width: '100%', background: '#080c08', padding: '16px', borderRadius: '6px', border: '1px solid #1a2a1a',
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px'
          }}>
            <div>
              <div style={{ color: '#6b7b6b', fontSize: 12, marginBottom: 4 }}>Department</div>
              <div style={{ color: '#e0f0e0', fontSize: 14 }}>{emp.department || 'N/A'}</div>
            </div>
            <div>
              <div style={{ color: '#6b7b6b', fontSize: 12, marginBottom: 4 }}>Designation</div>
              <div style={{ color: '#e0f0e0', fontSize: 14 }}>{emp.designation || 'N/A'}</div>
            </div>
            <div>
              <div style={{ color: '#6b7b6b', fontSize: 12, marginBottom: 4 }}>Gender</div>
              <div style={{ color: '#e0f0e0', fontSize: 14 }}>{emp.gender || 'N/A'}</div>
            </div>
            <div>
              <div style={{ color: '#6b7b6b', fontSize: 12, marginBottom: 4 }}>Date of Birth</div>
              <div style={{ color: '#e0f0e0', fontSize: 14 }}>{emp.dob || 'N/A'}</div>
            </div>
            <div>
              <div style={{ color: '#6b7b6b', fontSize: 12, marginBottom: 4 }}>Joining Date</div>
              <div style={{ color: '#e0f0e0', fontSize: 14 }}>{emp.joinDate || 'N/A'}</div>
            </div>
          </div>

          {/* KRA */}
          <div style={{ 
            flex: 1, background: '#080c08', padding: '20px', borderRadius: '6px', border: '1px solid #1a2a1a'
          }}>
            <h4 style={{ color: '#60a5fa', fontSize: 14, fontWeight: 600, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
              🎯 KRA (Key Result Areas)
            </h4>
            <p style={{ color: '#a0b0a0', fontSize: 14, margin: 0, fontStyle: 'italic' }}>
              {emp.kra || 'Not set'}
            </p>
          </div>

          {/* KPA */}
          <div style={{ 
            flex: 1, background: '#080c08', padding: '20px', borderRadius: '6px', border: '1px solid #1a2a1a'
          }}>
            <h4 style={{ color: '#10b981', fontSize: 14, fontWeight: 600, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
              📈 KPA (Key Performance Areas)
            </h4>
            <p style={{ color: '#a0b0a0', fontSize: 14, margin: 0, fontStyle: 'italic' }}>
              {emp.kpa || 'Not set'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const EditEmployeeModal = ({ emp, onClose, onSave }) => {
  if (!emp) return null;
  const [form, setForm] = useState({
    code: emp.id || '',
    name: emp.name || '',
    designation: emp.designation || '',
    gender: emp.gender || 'Male',
    joinDate: emp.joinDate || '',
    dob: emp.dob || '',
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
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#e0f0e0', margin: 0 }}>Edit Employee - {emp.name}</h2>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', color: '#6b7b6b', cursor: 'pointer', fontSize: 24, lineHeight: 1
          }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, color: '#e0f0e0' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#6b7b6b', fontWeight: 500 }}>Code</label>
              <input type="text" value={form.code} onChange={e => handleChange('code', e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #1a2a1a', borderRadius: 6, outline: 'none', background: '#080c08', color: '#e0f0e0' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#6b7b6b', fontWeight: 500 }}>Name</label>
              <input type="text" value={form.name} onChange={e => handleChange('name', e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #1a2a1a', borderRadius: 6, outline: 'none', background: '#080c08', color: '#e0f0e0' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#6b7b6b', fontWeight: 500 }}>Designation</label>
              <input type="text" value={form.designation} onChange={e => handleChange('designation', e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #1a2a1a', borderRadius: 6, outline: 'none', background: '#080c08', color: '#e0f0e0' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#6b7b6b', fontWeight: 500 }}>Gender</label>
              <select value={form.gender} onChange={e => handleChange('gender', e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #1a2a1a', borderRadius: 6, outline: 'none', background: '#080c08', color: '#e0f0e0' }}>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#6b7b6b', fontWeight: 500 }}>Joining Date</label>
              <input type="date" value={form.joinDate} onChange={e => handleChange('joinDate', e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #1a2a1a', borderRadius: 6, outline: 'none', background: '#080c08', color: '#e0f0e0', colorScheme: 'dark' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#6b7b6b', fontWeight: 500 }}>Date of Birth</label>
              <input type="date" value={form.dob} onChange={e => handleChange('dob', e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #1a2a1a', borderRadius: 6, outline: 'none', background: '#080c08', color: '#e0f0e0', colorScheme: 'dark' }} />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#6b7b6b', fontWeight: 500 }}>Company Assets</label>
            <textarea rows={3} value={form.assets} onChange={e => handleChange('assets', e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #1a2a1a', borderRadius: 6, outline: 'none', resize: 'vertical', background: '#080c08', color: '#e0f0e0' }} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#6b7b6b', fontWeight: 500 }}>Verification Document URL</label>
            <input type="text" value={form.docUrl} onChange={e => handleChange('docUrl', e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #1a2a1a', borderRadius: 6, outline: 'none', background: '#080c08', color: '#e0f0e0' }} />
            <span style={{ fontSize: 12, color: '#4a5b4a', marginTop: 4, display: 'block' }}>Paste Google Drive or OneDrive link</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#6b7b6b', fontWeight: 500 }}>Department</label>
              <select value={form.department} onChange={e => handleChange('department', e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #1a2a1a', borderRadius: 6, outline: 'none', background: '#080c08', color: '#e0f0e0' }}>
                <option>Directorship</option>
                <option>CXO</option>
                <option>Operations</option>
                <option>Marketing</option>
                <option>SOC</option>
                <option>HR</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#6b7b6b', fontWeight: 500 }}>Shift</label>
              <select value={form.shift} onChange={e => handleChange('shift', e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #1a2a1a', borderRadius: 6, outline: 'none', background: '#080c08', color: '#e0f0e0' }}>
                <option>General - General Shift</option>
                <option>Night Shift</option>
                <option>FMS</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#6b7b6b', fontWeight: 500 }}>Offs/Week</label>
              <select value={form.offs} onChange={e => handleChange('offs', e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #1a2a1a', borderRadius: 6, outline: 'none', background: '#080c08', color: '#e0f0e0' }}>
                <option>1</option>
                <option>2</option>
                <option>0</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#6b7b6b', fontWeight: 500 }}>Duration</label>
              <select value={form.duration} onChange={e => handleChange('duration', e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #1a2a1a', borderRadius: 6, outline: 'none', background: '#080c08', color: '#e0f0e0' }}>
                <option>9h</option>
                <option>8h</option>
                <option>6h</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
             <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#6b7b6b', fontWeight: 500 }}>Start</label>
              <input type="time" value={form.start} onChange={e => handleChange('start', e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #1a2a1a', borderRadius: 6, outline: 'none', background: '#080c08', color: '#e0f0e0' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#6b7b6b', fontWeight: 500 }}>End</label>
              <input type="time" value={form.end} onChange={e => handleChange('end', e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #1a2a1a', borderRadius: 6, outline: 'none', background: '#080c08', color: '#e0f0e0' }} />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: 14, color: '#6b7b6b', fontWeight: 500 }}>🎯 KRA</label>
            <textarea rows={2} value={form.kra} onChange={e => handleChange('kra', e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #1a2a1a', borderRadius: 6, outline: 'none', resize: 'vertical', background: '#080c08', color: '#e0f0e0' }} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: 14, color: '#6b7b6b', fontWeight: 500 }}>📈 KPA</label>
            <textarea rows={3} value={form.kpa} onChange={e => handleChange('kpa', e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #1a2a1a', borderRadius: 6, outline: 'none', resize: 'vertical', background: '#080c08', color: '#e0f0e0' }} />
          </div>

        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 24px', borderTop: '1px solid #1a2a1a', background: '#0e1510' }}>
          <button onClick={onClose} style={{ 
            background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: 6, fontWeight: 500, cursor: 'pointer' 
          }}>
            Close
          </button>
          <button onClick={() => { onSave(form); onClose(); }} style={{ 
            background: '#2563eb', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, fontWeight: 500, cursor: 'pointer' 
          }}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

const Employees = () => {
  const navigate = useNavigate();
  const { updateEmployee } = useEmployee();
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [editingEmp, setEditingEmp] = useState(null);

  const handleSaveEdit = (form) => {
    updateEmployee(form.code, {
      name: form.name,
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
            <button className="btn-primary" onClick={() => navigate('/add-employee')}>
              ➕ Add Employee
            </button>
          </div>

          <EmployeeTable onEdit={setEditingEmp} onViewDetails={setSelectedEmp} />
        </div>
      </div>

      {editingEmp && <EditEmployeeModal emp={editingEmp} onClose={() => setEditingEmp(null)} onSave={handleSaveEdit} />}
      {selectedEmp && !editingEmp && <EmployeeDetailModal emp={selectedEmp} onClose={() => setSelectedEmp(null)} />}
    </div>
  );
};

export default Employees;