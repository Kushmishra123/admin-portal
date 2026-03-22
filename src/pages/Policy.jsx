import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useUser } from '../context/UserContext';
import { API_BASE_URL } from '../config';
import '../styles/dashboard.css';

const API = API_BASE_URL;

const policies = [
  {
    id: 1,
    icon: '🕐',
    title: 'Attendance & Working Hours',
    summary: 'Standard working hours are 9:00 AM – 6:00 PM, Monday to Saturday.',
    details: [
      'Employees must mark attendance on the portal by 9:15 AM.',
      'Late arrivals beyond 15 minutes must be reported to the manager.',
      'Working from home requires prior written approval.',
      'A minimum of 9 hours of productive work is expected per day.',
    ],
  },
  {
    id: 2,
    icon: '📅',
    title: 'Leave Policy',
    summary: 'Employees are entitled to Casual, Sick, Annual, and Emergency leaves.',
    details: [
      'Casual Leave: 8 days per year.',
      'Sick Leave: 10 days per year (medical certificate required for more than 2 consecutive days).',
      'Annual Leave: 15 days per year (must be applied 7 days in advance).',
      'Emergency Leave: 3 days per year.',
      'Leave requests must be submitted through the portal and approved by the Super Admin.',
      'Unapproved absences will be treated as Leave Without Pay (LWP).',
    ],
  },
  {
    id: 3,
    icon: '💻',
    title: 'IT & Asset Usage Policy',
    summary: 'Company assets are for official use only and must be handled responsibly.',
    details: [
      'All company laptops, mobile devices, and equipment must be used for official purposes only.',
      'Employees must not install unauthorized software on company devices.',
      'Company data must not be shared with external parties without authorization.',
      'Report any damage, loss, or theft immediately to the IT department.',
      'Internet usage is monitored; personal browsing during work hours is discouraged.',
    ],
  },
  {
    id: 4,
    icon: '🔒',
    title: 'Data Confidentiality & Security',
    summary: 'All company and client data must be treated with strict confidentiality.',
    details: [
      'Employee and client information is strictly confidential.',
      'Do not share login credentials, passwords, or access tokens with anyone.',
      'Use strong passwords (minimum 8 characters with alphanumeric and special characters).',
      'Lock your workstation whenever you step away.',
      'Breaches of data confidentiality may lead to disciplinary action.',
    ],
  },
  {
    id: 5,
    icon: '🤝',
    title: 'Code of Conduct',
    summary: 'Maintain a respectful, professional, and inclusive workplace.',
    details: [
      'Treat all colleagues, clients, and stakeholders with respect.',
      'Discrimination, harassment, or misconduct of any kind will not be tolerated.',
      'Maintain professional communication in all channels (email, chat, meetings).',
      'Dress code: Business casual at all times in office premises.',
      'Conflicts should be reported to HR for impartial resolution.',
    ],
  },
  {
    id: 6,
    icon: '🚗',
    title: 'Travel & Expense Policy',
    summary: 'Business travel and expenses must be pre-approved and submitted on time.',
    details: [
      'All business travel must be approved by the reporting manager in advance.',
      'Expense claims must be submitted within 7 days of returning from travel.',
      'Retain all original receipts for reimbursement.',
      'Personal expenses incurred during office travel will not be reimbursed.',
      'Daily travel allowance (DA) is applicable as per company grade.',
    ],
  },
];

const Policy = () => {
  const { user, setUser } = useUser();
  const empId = user?.employeeId || user?.id;   // handle old sessions stored as 'id'
  const [openId, setOpenId] = useState(null);
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [alreadyAcknowledged, setAlreadyAcknowledged] = useState(false);

  // Load current policy status from server on mount
  useEffect(() => {
    if (!empId) return;
    fetch(`${API}/api/auth/policy-status/${empId}`)
      .then((r) => r.json())
      .then((data) => {
        const status = data.policyStatus ?? false;
        setChecked(status);
        setAlreadyAcknowledged(status);
      })
      .catch(() => {});
  }, [empId]);

  const toggle = (id) => setOpenId(openId === id ? null : id);

  const handleSave = async () => {
    console.log('🟡 [POLICY] Save clicked');
    console.log('🟡 [POLICY] empId:', empId, '| checked:', checked);

    if (!empId || !checked) {
      console.warn('⚠️ [POLICY] Blocked — empId or checkbox missing', { empId, checked });
      return;
    }

    const url = `${API}/api/auth/policy-status/${empId}`;
    console.log('📡 [POLICY] Sending PATCH to:', url);

    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policyStatus: true }),
      });
      console.log('📩 [POLICY] Response status:', res.status, res.statusText);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      console.log('✅ [POLICY] Response data:', data);
      setUser((prev) => ({ ...prev, policyStatus: data.policyStatus }));
      setAlreadyAcknowledged(true);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('❌ [POLICY] Error:', err.message);
      setError('Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="main-wrapper">
        <Navbar title="Company Policies" subtitle="Guidelines & Standards for All Employees" />

        <div className="content-container">
          {/* Header */}
          <div className="page-header">
            <div>
              <h1 className="page-title">📋 Company Policy</h1>
              <p className="page-subtitle">
                Please read and follow all policies to maintain a productive and compliant workplace.
              </p>
            </div>
          </div>

          {/* Policy Accordion Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {policies.map((policy) => {
              const isOpen = openId === policy.id;
              return (
                <div
                  key={policy.id}
                  className="form-card"
                  style={{
                    cursor: 'pointer',
                    border: isOpen
                      ? '1px solid rgba(118, 199, 51, 0.4)'
                      : '1px solid rgba(118, 199, 51, 0.1)',
                    transition: 'border 0.3s ease, box-shadow 0.3s ease',
                    boxShadow: isOpen ? '0 0 16px rgba(118, 199, 51, 0.08)' : 'none',
                    padding: '0',
                    overflow: 'hidden',
                  }}
                  onClick={() => toggle(policy.id)}
                >
                  {/* Header row */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '18px 22px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <span style={{ fontSize: '26px' }}>{policy.icon}</span>
                      <div>
                        <div
                          style={{
                            color: '#e4ebe4',
                            fontWeight: 600,
                            fontSize: '15px',
                            marginBottom: '3px',
                          }}
                        >
                          {policy.title}
                        </div>
                        <div style={{ color: '#7a9e7a', fontSize: '13px' }}>
                          {policy.summary}
                        </div>
                      </div>
                    </div>
                    <span
                      style={{
                        color: '#76c733',
                        fontSize: '20px',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s ease',
                        flexShrink: 0,
                      }}
                    >
                      ▾
                    </span>
                  </div>

                  {/* Expandable details */}
                  {isOpen && (
                    <div
                      style={{
                        padding: '14px 22px 18px 62px',
                        borderTop: '1px solid rgba(118, 199, 51, 0.1)',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                        {policy.details.map((point, i) => (
                          <li
                            key={i}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '10px',
                              color: '#a3b5a3',
                              fontSize: '14px',
                              lineHeight: '1.6',
                              marginBottom: '8px',
                            }}
                          >
                            <span style={{ color: '#76c733', marginTop: '2px', flexShrink: 0 }}>
                              ✓
                            </span>
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Acknowledgement Section ────────────────────────────── */}
          <div
            className="form-card"
            style={{
              marginTop: '10px',
              border: checked
                ? '1px solid rgba(118, 199, 51, 0.45)'
                : '1px solid rgba(118, 199, 51, 0.15)',
              background: 'linear-gradient(145deg, #111e14, #0a110b)',
              transition: 'border 0.3s ease',
            }}
          >
            <div className="settings-section-title">✅ Policy Acknowledgement</div>
            <p style={{ color: '#7a9e7a', fontSize: '13px', marginBottom: '18px' }}>
              By checking the box below, you confirm that you have read, understood, and agree to
              abide by all the company policies listed above.
            </p>

            {/* Checkbox row */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                marginBottom: '20px',
              }}
            >
              <div
                onClick={() => setChecked((c) => !c)}
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '6px',
                  border: checked ? '2px solid #76c733' : '2px solid #3a5a3a',
                  background: checked ? 'rgba(118, 199, 51, 0.2)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  flexShrink: 0,
                  cursor: 'pointer',
                }}
              >
                {checked && (
                  <span style={{ color: '#76c733', fontSize: '14px', fontWeight: 700 }}>✓</span>
                )}
              </div>
              <span
                style={{ color: checked ? '#e4ebe4' : '#7a9e7a', fontSize: '14px', userSelect: 'none' }}
                onClick={() => setChecked((c) => !c)}
              >
                I have read and agree to all company policies.
              </span>
            </label>

            {/* Save Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              {alreadyAcknowledged ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '10px 20px', borderRadius: '8px', background: 'rgba(118, 199, 51, 0.12)', border: '1px solid rgba(118, 199, 51, 0.35)', color: '#76c733', fontWeight: 600, fontSize: '14px' }}>
                  ✅ Policy Already Acknowledged
                </span>
              ) : (
                <button
                  onClick={handleSave}
                  disabled={saving || !checked}
                  style={{ padding: '10px 26px', borderRadius: '8px', border: 'none', background: !checked || saving ? 'rgba(118, 199, 51, 0.25)' : 'linear-gradient(135deg, #76c733, #5aaa1a)', color: !checked || saving ? '#5a7a5a' : '#0a1a0a', fontWeight: 700, fontSize: '14px', cursor: !checked || saving ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease' }}
                >
                  {saving ? 'Saving...' : 'Save Acknowledgement'}
                </button>
              )}
              {saved && (
                <span style={{ color: '#76c733', fontSize: '13px', fontWeight: 600 }}>✓ Saved successfully!</span>
              )}
              {error && (
                <span style={{ color: '#e05252', fontSize: '13px' }}>{error}</span>
              )}
            </div>
          </div>

          {/* Footer note */}
          <div
            className="form-card"
            style={{ marginTop: '10px', borderColor: 'rgba(118, 199, 51, 0.1)' }}
          >
            <p style={{ color: '#7a9e7a', fontSize: '13px', margin: 0, textAlign: 'center' }}>
              📌 These policies are subject to periodic review. For queries, contact HR at{' '}
              <span style={{ color: '#76c733' }}>hr@quisitive.com</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Policy;
