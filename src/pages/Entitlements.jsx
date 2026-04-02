import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useUser } from '../context/UserContext';
import { API_URL } from '../config';
import LoaderButton from '../components/LoaderButton';
import { Edit2, Save, X, ChevronDown, ChevronUp } from 'lucide-react';
import '../styles/dashboard.css';

const Entitlements = () => {
  const { user } = useUser();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRow, setEditingRow] = useState(null); // { employeeId, leaveType.id }
  const [editFormData, setEditFormData] = useState({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [expandedEmployees, setExpandedEmployees] = useState({});

  const toggleExpand = (empId) => {
    setExpandedEmployees(prev => ({ ...prev, [empId]: !prev[empId] }));
  };

  const fetchEntitlements = async () => {
    try {
      const res = await fetch(`${API_URL}/leave-types`, { credentials: 'include' });
      const json = await res.json();
      setData(json.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntitlements();
  }, []);

  const handleEditClick = (employeeId, type) => {
    setEditingRow({ employeeId, leaveType: type.leaveType });
    setEditFormData({
      yearlyQuota: type.yearlyQuota,
      used: type.used,
    });
  };

  const handleSave = async (userId, leaveTypeStr) => {
    setSaveLoading(true);
    try {
      const remaining = Number(editFormData.yearlyQuota) - Number(editFormData.used);
      const payload = [{
        employeeId: userId,
        leaveType: leaveTypeStr,
        yearlyQuota: Number(editFormData.yearlyQuota),
        used: Number(editFormData.used),
        remaining
      }];

      const res = await fetch(`${API_URL}/leave-types/bulk-update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ entitlements: payload })
      });

      if (res.ok) {
        await fetchEntitlements();
        setEditingRow(null);
      } else {
        alert('Failed to save');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="main-wrapper">
        <Navbar title="Yearly Leave Entitlements" subtitle="Manage leave quotas for each employee" />

        <div className="content-container">
          <div className="page-header">
             <div>
               <h1 className="page-title">Entitlements (Yearly)</h1>
               <p className="page-subtitle">Manage leave quotas for the current year. Each employee can have different leave entitlements.</p>
             </div>
          </div>

          <div className="table-card" style={{ padding: 0 }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#6b7b6b' }}>Loading data...</div>
            ) : (
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Leave Type</th>
                    <th>Yearly Quota</th>
                    <th>Used</th>
                    <th>Remaining</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(group => {
                    const isExpanded = expandedEmployees[group.user.id];
                    return (
                      <React.Fragment key={group.user.id}>
                        {/* Summary Header Row */}
                        <tr style={{ background: 'rgba(255,255,255,0.02)', borderTop: '2px solid #1a2a1a', cursor: 'pointer', transition: 'background 0.2s' }} onClick={() => toggleExpand(group.user.id)}>
                          <td style={{ fontWeight: 600, color: '#e0f0e0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <button style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 6, color: '#38bdf8', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4 }}>
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>
                              {group.user.employeeId} - {group.user.name}
                            </div>
                          </td>
                          <td colSpan={4} style={{ color: '#6b7b6b', fontSize: 13, fontStyle: 'italic' }}>
                            Click to {isExpanded ? 'hide' : 'view'} {group.types.length} leave entitlements
                          </td>
                        </tr>

                        {/* Column sub-header row shown when expanded */}
                        {isExpanded && (
                          <tr style={{ background: 'rgba(56,189,248,0.04)', borderBottom: '1px solid #1a2a1a' }}>
                            <td></td>
                            <td style={{ fontSize: 11, fontWeight: 700, color: '#4a90d9', textTransform: 'uppercase', letterSpacing: '0.06em', paddingTop: 8, paddingBottom: 8 }}>Leave Type</td>
                            <td style={{ fontSize: 11, fontWeight: 700, color: '#4a90d9', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Yearly Quota</td>
                            <td style={{ fontSize: 11, fontWeight: 700, color: '#4a90d9', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Used</td>
                            <td style={{ fontSize: 11, fontWeight: 700, color: '#4a90d9', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Remaining</td>
                            <td style={{ fontSize: 11, fontWeight: 700, color: '#4a90d9', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Actions</td>
                          </tr>
                        )}

                        {/* Expandable Leave Rows */}
                        {isExpanded && group.types.map((t) => {
                          const isEditing = editingRow?.employeeId === group.user.id && editingRow?.leaveType === t.leaveType;
                          return (
                            <tr key={`${group.user.id}-${t.leaveType}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              <td></td> {/* Empty cell for nested look */}
                              <td style={{ color: '#a0b0a0' }}>{t.leaveType}</td>
                              <td>
                                {isEditing ? (
                                  <input 
                                    type="number" 
                                    value={editFormData.yearlyQuota} 
                                    onChange={e => setEditFormData({ ...editFormData, yearlyQuota: e.target.value })}
                                    style={{ width: 60, padding: '4px 8px', background: '#080c08', border: '1px solid currentColor', borderRadius: 4, color: '#e0f0e0' }}
                                  />
                                ) : (
                                  <span style={{ fontWeight: 600, color: '#e0f0e0' }}>{t.yearlyQuota}</span>
                                )}
                              </td>
                              <td>
                                {isEditing ? (
                                  <input 
                                    type="number" 
                                    value={editFormData.used} 
                                    onChange={e => setEditFormData({ ...editFormData, used: e.target.value })}
                                    style={{ width: 60, padding: '4px 8px', background: '#080c08', border: '1px solid currentColor', borderRadius: 4, color: '#e0f0e0' }}
                                  />
                                ) : (
                                  <span style={{ color: '#e0f0e0' }}>{t.used}</span>
                                )}
                              </td>
                              <td>
                                <span style={{ fontWeight: 600, color: t.remaining > 0 ? '#76c733' : '#6b7b6b' }}>
                                  {isEditing ? Number(editFormData.yearlyQuota) - Number(editFormData.used) : t.remaining}
                                </span>
                              </td>
                              <td>
                                {isEditing ? (
                                  <div style={{ display: 'flex', gap: 6 }}>
                                    <LoaderButton 
                                      onClick={() => handleSave(group.user.id, t.leaveType)}
                                      loading={saveLoading}
                                      style={{ background: '#76c733', color: '#000', border: 'none', padding: '4px 8px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}
                                    >
                                      <Save size={14} /> Save
                                    </LoaderButton>
                                    <button 
                                      onClick={() => setEditingRow(null)}
                                      style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', padding: '4px 8px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}
                                    >
                                      <X size={14} /> Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button 
                                    onClick={() => handleEditClick(group.user.id, t)}
                                    style={{ background: 'transparent', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)', padding: '4px 12px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
                                  >
                                    <Edit2 size={14} /> Edit
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                  {data.length === 0 && !loading && (
                     <tr>
                        <td colSpan={6} style={{ textAlign: 'center', color: '#6b7b6b', padding: 20 }}>No employees found.</td>
                     </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Entitlements;
