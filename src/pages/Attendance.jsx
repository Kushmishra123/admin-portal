import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { attendanceData } from '../data/attendanceData';
import Navbar from '../components/Navbar';
import '../styles/Attendance.css';

const Attendance = () => {
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSelectEmployee = (emp) => {
    setSelectedEmployee(emp);
  };

  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="main-wrapper">
        <Navbar title="Employee Attendance" subtitle="View attendance records and summaries for employees." />

        <div className="attendance-container">
          <div className="employee-list">
            <h3 style={{ marginBottom: '12px' }}>Employee List</h3>
            <input
              type="text"
              placeholder="Search by name or ID..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <ul>
              {attendanceData.departments.map((dept) => {
                const filteredEmployees = dept.employees.filter((emp) =>
                  emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  emp.id.toLowerCase().includes(searchQuery.toLowerCase())
                );

                if (filteredEmployees.length === 0) return null;

                return (
                  <div key={dept.name}>
                    <h4 style={{ color: '#5cb85c', fontSize: '0.75rem', marginTop: '8px', marginBottom: '8px', paddingLeft: '4px', letterSpacing: '1px' }}>
                      {dept.name} DEPARTMENT
                    </h4>
                    {filteredEmployees.map((emp) => (
                      <li 
                        key={emp.id} 
                        className={`employee-item ${selectedEmployee?.id === emp.id ? 'active' : ''}`}
                        onClick={() => handleSelectEmployee(emp)}
                      >
                        <div className="emp-name">{emp.name}</div>
                        <div className="emp-id">{emp.id}</div>
                      </li>
                    ))}
                  </div>
                );
              })}
            </ul>
          </div>

          <div className="employee-details">
            {selectedEmployee ? (
              <div className="details-card">
                <h2>{selectedEmployee.name} ({selectedEmployee.id})</h2>
                
                <div className="summary-section">
                  <h3>Summary</h3>
                  <div className="summary-grid">
                    <div className="summary-item">
                      <span className="label">Present:</span> {selectedEmployee.summary?.present || 0}
                    </div>
                    <div className="summary-item">
                      <span className="label">Absent:</span> {selectedEmployee.summary?.absent || 0}
                    </div>
                    <div className="summary-item">
                      <span className="label">Total Work Duration:</span> {selectedEmployee.summary?.totalWorkDuration || '-'}
                    </div>
                    <div className="summary-item">
                      <span className="label">Total OT:</span> {selectedEmployee.summary?.totalOT || '-'}
                    </div>
                    <div className="summary-item">
                      <span className="label">Weekly Off:</span> {selectedEmployee.summary?.weeklyOff || 0}
                    </div>
                    <div className="summary-item">
                      <span className="label">Late By Hours:</span> {selectedEmployee.summary?.lateByHours || '-'}
                    </div>
                    <div className="summary-item">
                      <span className="label">Early By Hours:</span> {selectedEmployee.summary?.earlyByHours || '-'}
                    </div>
                    <div className="summary-item">
                      <span className="label">Average Working Hours:</span> {selectedEmployee.summary?.averageWorkingHours || '-'}
                    </div>
                  </div>
                </div>

                <div className="attendance-section">
                  <h3>Daily Attendance</h3>
                  {selectedEmployee.attendance && selectedEmployee.attendance.length > 0 ? (
                    <table className="attendance-table">
                      <thead>
                        <tr>
                          <th>Day</th>
                          <th>Status</th>
                          <th>In</th>
                          <th>Out</th>
                          <th>Duration</th>
                          <th>Late By</th>
                          <th>OT</th>
                          <th>Shift</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedEmployee.attendance.map((record, index) => (
                          <tr key={index}>
                            <td>{record.day}</td>
                            <td>
                              <span className={`status-badge ${record.status.toLowerCase()}`}>
                                {record.status}
                              </span>
                            </td>
                            <td>{record.in || '-'}</td>
                            <td>{record.out || '-'}</td>
                            <td>{record.duration || '-'}</td>
                            <td>{record.lateBy || '-'}</td>
                            <td>{record.ot || '-'}</td>
                            <td>{record.shift || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ color: '#999', padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', fontSize: '0.9rem' }}>
                      No detailed attendance records available for this employee.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <p>Select an employee to view details.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
