import React from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useUser } from '../context/UserContext';
import { useEmployee } from '../context/EmployeeContext';
import { Download } from 'lucide-react';
import '../styles/dashboard.css';
import LoaderButton from '../components/LoaderButton';

const Analytics = () => {
  const { employees } = useEmployee();
  
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.status === 'Active').length;
  
  const deptCounts = employees.reduce((acc, emp) => {
    const dept = emp.department || 'Unassigned';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {});
  
  const deptColors = {
    'Security': '#76c733', 'HR': '#e67e22', 'Directorship': '#9b59b6',
    'CXO': '#3498db', 'Operations': '#f1c40f', 'Marketing': '#e74c3c',
    'SOC': '#1abc9c', 'ADMIN': '#34495e', 'FMS': '#2ecc71',
    'NOC': '#95a5a6', 'Compliance': '#d35400'
  };
  
  const departments = Object.entries(deptCounts).map(([name, count]) => ({
    name, count, color: deptColors[name] || '#7f8c8d'
  })).sort((a, b) => b.count - a.count);
  
  const maxCount = departments.length ? Math.max(...departments.map(d => d.count)) : 1;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  
  const monthlyJoins = new Array(12).fill(0);
  employees.forEach(emp => {
    if (emp.joinDate) {
      const date = new Date(emp.joinDate);
      if (!isNaN(date.getTime())) monthlyJoins[date.getMonth()] += 1;
    }
  });
  const monthlyMax = Math.max(...monthlyJoins, 1);

  const kpis = [
    { icon: '', label: 'Total Employees',  value: totalEmployees, sub: 'Total workforce',  color: '#76c733' },
    { icon: '', label: 'Active Employees',  value: activeEmployees, sub: `${totalEmployees ? Math.round((activeEmployees/totalEmployees)*100) : 0}% of total`,  color: '#4a90d9' },
    { icon: '', label: 'Departments',       value: departments.length, sub: 'Active departments', color: '#9b59b6' },
  ];

  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="main-wrapper">
        <Navbar title="Analytics" subtitle="Organisation insights and workforce metrics" />

        <div className="content-container">
          <div className="page-header">
            <div>
              <h1 className="page-title">Analytics</h1>
              <p className="page-subtitle">Workforce overview and department breakdown</p>
            </div>
            <LoaderButton className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Download size={16} /> Export Report</LoaderButton>
          </div>

          {/* KPI Cards */}
          <div className="stats-grid" style={{ marginBottom: 24 }}>
            {kpis.map((k, i) => (
              <div className="stat-card" key={i}>
                <div className="stat-icon" style={{ background: `${k.color}20`, fontSize: 22 }}>{k.icon}</div>
                <div className="stat-number" style={{ color: k.color }}>{k.value}</div>
                <div className="stat-label">{k.label}</div>
                <div className="stat-change stat-up">↑ {k.sub}</div>
              </div>
            ))}
          </div>

          <div className="section-grid">
            {/* Department Breakdown */}
            <div className="card">
              <p className="card-title">DEPARTMENT BREAKDOWN</p>
              <h3 className="card-heading">Headcount by Team</h3>
              <div className="dept-list">
                {departments.map(d => (
                  <div className="dept-row" key={d.name}>
                    <div className="dept-info">
                      <span style={{ color: '#d0e0d0', fontWeight: 500 }}>{d.name}</span>
                      <span style={{ color: d.color, fontWeight: 700 }}>{d.count} employees</span>
                    </div>
                    <div className="dept-bar-track">
                      <div
                        className="dept-bar-fill"
                        style={{ width: `${(d.count / maxCount) * 100}%`, background: d.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly Hiring Trend */}
            <div className="card">
              <p className="card-title">HIRING TREND</p>
              <h3 className="card-heading">New Joins per Month</h3>
              <div className="bar-chart">
                {monthlyJoins.map((v, i) => (
                  <div className="bar-col" key={i}>
                    <div
                      className="bar-fill"
                      style={{ height: monthlyMax > 0 ? `${(v / monthlyMax) * 90}px` : '4px', minHeight: 4 }}
                    />
                    <span className="bar-lbl">{months[i]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="card" style={{ marginTop: 20 }}>
            <p className="card-title">EMPLOYEE STATUS</p>
            <h3 className="card-heading">Active vs Inactive</h3>
            <div style={{ display: 'flex', gap: 20, marginTop: 16, flexWrap: 'wrap' }}>
              {['Active','Inactive'].map(status => {
                const count = employees.filter(e => e.status === status).length;
                const pct = employees.length > 0 ? Math.round((count / employees.length) * 100) : 0;
                const colors = { Active: '#76c733', Inactive: '#f87171' };
                return (
                  <div key={status} style={{
                    flex: 1, minWidth: 160,
                    background: `${colors[status]}10`,
                    border: `1px solid ${colors[status]}25`,
                    borderRadius: 16, padding: '20px 24px',
                    display: 'flex', flexDirection: 'column', gap: 8
                  }}>
                    <span style={{ fontSize: 36, fontWeight: 800, color: colors[status] }}>{count}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#d0e0d0' }}>{status}</span>
                    <span style={{ fontSize: 12, color: '#6b7b6b' }}>{pct}% of workforce</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
