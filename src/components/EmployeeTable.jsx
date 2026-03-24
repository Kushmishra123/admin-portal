import React, { useState } from 'react';
import { useEmployee } from '../context/EmployeeContext';
import { useUser } from '../context/UserContext';
import LoaderButton from './LoaderButton';

const EmployeeTable = ({ onEdit, onViewDetails, onResetPassword }) => {
  const { employees, deleteEmployee } = useEmployee();
  const { user } = useUser();
  const [filter, setFilter] = useState('');

  const filtered = employees.filter(emp =>
    emp.name.toLowerCase().includes(filter.toLowerCase()) ||
    emp.department.toLowerCase().includes(filter.toLowerCase()) ||
    emp.id.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="table-card" style={{ overflowX: 'auto' }}>
      <div className="table-top">
        <div>
          <span className="table-title">Employee Directory</span>
          <span className="table-count">({filtered.length} total)</span>
        </div>
        <input
          type="text"
          placeholder="🔍  Search by name, code, dept…"
          className="filter-input"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <p>No employees match "{filter}"</p>
        </div>
      ) : (
        <table className="custom-table" style={{ minWidth: 1000 }}>
          <thead>
            <tr>
              <th style={{ width: '10%' }}>Code</th>
              <th style={{ width: '13%' }}>Name</th>
              <th style={{ width: '8%' }}>Role</th>
              <th style={{ width: '10%' }}>Joining Date</th>
              <th style={{ width: '13%' }}>Assets</th>
              <th style={{ width: '7%' }}>Document</th>
              <th style={{ width: '9%' }}>Dept</th>
              <th style={{ width: '7%' }}>Shift</th>
              <th style={{ width: '5%' }}>Offs</th>
              <th style={{ width: '11%' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(emp => (
              <tr key={emp.id}>
                <td style={{ fontWeight: 600, color: '#e0f0e0' }}>{emp.id}</td>
                <td>
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); onViewDetails && onViewDetails(emp); }}
                    style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 500 }}
                  >
                    {emp.name}
                  </a>
                </td>
                <td>
                  {(() => {
                    const roleMeta = {
                      superadmin: { label: 'Super Admin', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
                      manager:    { label: 'Manager',     color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)' },
                      hr:         { label: 'HR',          color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
                      employee:   { label: 'Employee',    color: '#76c733', bg: 'rgba(118,199,51,0.1)' },
                      admin:      { label: 'Employee',    color: '#76c733', bg: 'rgba(118,199,51,0.1)' },
                    };
                    const m = roleMeta[emp.role] || roleMeta.employee;
                    return (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, color: m.color, background: m.bg, border: `1px solid ${m.color}40`, whiteSpace: 'nowrap' }}>
                        {m.label}
                      </span>
                    );
                  })()}
                </td>
                <td style={{ color: '#6b7b6b', fontSize: 13 }}>{emp.joinDate}</td>
                <td style={{ color: '#6b7b6b', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }} title={emp.assets}>
                  {emp.assets}
                </td>
                <td>
                  {emp.document ? (
                    <LoaderButton style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: 'rgba(16, 185, 129, 0.1)', color: '#10b981',
                      border: '1px solid rgba(16, 185, 129, 0.3)', padding: '4px 8px',
                      borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer'
                    }}>
                      📄 View
                    </LoaderButton>
                  ) : (
                    <span style={{ color: '#6b7b6b' }}>-</span>
                  )}
                </td>
                <td style={{ color: '#e0f0e0', fontSize: 13 }}>{emp.department}</td>
                <td>
                  <span style={{
                    background: emp.shiftType === 'Rotational' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                    color: emp.shiftType === 'Rotational' ? '#3b82f6' : '#10b981',
                    border: `1px solid ${emp.shiftType === 'Rotational' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                    padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600
                  }}>
                    {emp.shiftType}
                  </span>
                </td>
                <td>
                  <span style={{
                    background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600
                  }}>
                    {emp.shift}
                  </span>
                </td>
                <td style={{ fontWeight: 600, color: '#e0f0e0' }}>{emp.offs}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {/* Edit */}
                    <LoaderButton
                      style={{
                        background: 'transparent',
                        border: '1px solid rgba(249, 115, 22, 0.4)',
                        color: '#f97316', padding: '6px', borderRadius: 4,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                      onClick={() => onEdit && onEdit(emp)}
                      title="Edit Employee"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </LoaderButton>

                    {/* Reset Password & Delete — Only for Super Admins */}
                    {user?.role === 'superadmin' && (
                      <>
                        <LoaderButton
                          style={{
                            background: 'transparent',
                            border: '1px solid rgba(251, 191, 36, 0.45)',
                            color: '#fbbf24', padding: '6px', borderRadius: 4,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s'
                          }}
                          onClick={() => onResetPassword && onResetPassword(emp)}
                          title="Reset Password"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="7.5" cy="15.5" r="5.5"></circle>
                            <path d="M21 2l-9.6 9.6"></path>
                            <path d="M15.5 7.5l3 3L22 7l-3-3"></path>
                          </svg>
                        </LoaderButton>

                        {/* Delete */}
                        <LoaderButton
                          style={{
                            background: 'transparent',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            color: '#f87171', padding: '6px', borderRadius: 4,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s'
                          }}
                          title="Delete Employee"
                          onClick={() => deleteEmployee(emp.id)}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                          </svg>
                        </LoaderButton>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default EmployeeTable;