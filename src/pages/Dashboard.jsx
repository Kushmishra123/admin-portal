import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useLeaves } from '../context/LeavesContext';
import { useEmployee } from '../context/EmployeeContext';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import Chat from '../components/Chat';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config';
import '../styles/dashboard.css';

const CalendarModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const today = new Date();
  const [currentDate, setCurrentDate] = useState(today);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDate = monthStart.getDay();
  const daysInMonth = monthEnd.getDate();

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: '#0e1510', border: '1px solid #1a2a1a',
        borderRadius: 24, padding: 36, width: 400, position: 'relative'
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 16, right: 16,
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 8, color: '#f87171', width: 32, height: 32,
          cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>✕</button>

        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0, marginBottom: 24 }}>Calendar</h2>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <button onClick={prevMonth} style={{ background: 'none', border: 'none', color: '#76c733', cursor: 'pointer', fontSize: 18, fontWeight: 'bold' }}>&lt;</button>
          <div style={{ fontWeight: 600, color: '#fff', fontSize: 18 }}>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</div>
          <button onClick={nextMonth} style={{ background: 'none', border: 'none', color: '#76c733', cursor: 'pointer', fontSize: 18, fontWeight: 'bold' }}>&gt;</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, textAlign: 'center', color: '#6b7b6b', fontSize: 13, marginBottom: 16, fontWeight: 600 }}>
          <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, textAlign: 'center' }}>
          {Array.from({ length: startDate }).map((_, idx) => (
            <div key={`empty-${idx}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const day = idx + 1;
            const isToday = day === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();

            const holidays = [
              { month: 0, date: 1, name: "New Year's Day" },
              { month: 0, date: 26, name: "Republic Day" },
              { month: 4, date: 1, name: "Labour Day" },
              { month: 7, date: 15, name: "Independence Day" },
              { month: 9, date: 2, name: "Gandhi Jayanti" },
              { month: 11, date: 25, name: "Christmas Day" }
            ];

            const currentMonth = currentDate.getMonth();
            const holiday = holidays.find(h => h.month === currentMonth && h.date === day);
            const isHoliday = !!holiday;

            return (
              <div
                key={day}
                title={holiday ? holiday.name : ''}
                style={{
                  padding: '10px 0',
                  borderRadius: '12px',
                  background: isHoliday ? 'rgba(239, 68, 68, 0.15)' : isToday ? '#76c733' : 'rgba(255,255,255,0.03)',
                  color: isHoliday ? '#f87171' : isToday ? '#000' : '#d0e0d0',
                  fontWeight: isToday || isHoliday ? 700 : 500,
                  fontSize: 14,
                  cursor: 'pointer',
                  border: isHoliday ? '1px solid rgba(239, 68, 68, 0.5)' : isToday ? 'none' : '1px solid #1a2a1a',
                  position: 'relative'
                }}
              >
                {day}
                {isHoliday && (
                  <div style={{
                    position: 'absolute', top: 4, right: 4,
                    width: 6, height: 6, borderRadius: '50%', background: '#EF4444',
                    boxShadow: '0 0 6px #EF4444'
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useUser();
  const { leaves } = useLeaves();
  const { employees } = useEmployee();
  const navigate = useNavigate();
  const [showCalendar, setShowCalendar] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [wishTarget, setWishTarget] = useState(null);
  const [wishMessage, setWishMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const isAdmin = user?.role === 'superadmin';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const pendingCount = leaves.filter(l => l.status === 'Pending').length;
  const approvedCount = leaves.filter(l => l.status === 'Approved').length;

  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.status === 'Active').length;

  const deptCounts = employees.reduce((acc, emp) => {
    const dept = emp.department || 'Unassigned';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {});
  const departmentsCount = Object.keys(deptCounts).length;
  const attendancePct = totalEmployees > 0 ? Math.round(((activeEmployees - approvedCount) / totalEmployees) * 100) : 0;

  // ── Global Socket Connection ──
  React.useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'superadmin')) {
      const currentUserId = user.employeeId || user.id;
      const newSocket = io(API_BASE_URL, {
        query: { employeeId: currentUserId }
      });

      setSocket(newSocket);

      newSocket.on('receiveMessage', (message) => {
        console.log('📩 [DASHBOARD] receiveMessage fired:', message);
        const isFromMe = message.senderId === currentUserId;

        // If the message is from me, skip it — we already optimistically added it in Chat
        if (!isFromMe) {
          setMessages((prev) => {
            // Prevent duplicates by checking _id
            if (message._id && prev.some(m => m._id === message._id)) return prev;
            return [...prev, message];
          });
          console.log('🔴 [DASHBOARD] Incrementing unread count!');
          setUnreadCount(prev => prev + 1);
        }
      });

      newSocket.on('onlineUsers', (users) => {
        setOnlineUsers(users);
      });

      return () => newSocket.close();
    }
  }, [user]);

  // Reset unread count when opening the chat
  React.useEffect(() => {
    if (showChat) {
      setUnreadCount(0);
    }
  }, [showChat]);

  // ── Birthday Calculation ──
  const now = new Date();
  const nextBirthday = employees
    .filter(e => e.dob)
    .map(e => {
      const birthDate = new Date(e.dob);
      const thisYearBirthday = new Date(now.getFullYear(), birthDate.getMonth(), birthDate.getDate());
      let nextBday = thisYearBirthday;
      if (thisYearBirthday < now && (thisYearBirthday.toDateString() !== now.toDateString())) {
        nextBday = new Date(now.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate());
      }
      return { ...e, nextBday, diff: nextBday - now };
    })
    .sort((a, b) => a.diff - b.diff)[0];

  const adminStats = [
    { icon: '👥', label: 'Total Employees', value: totalEmployees, change: 'Total workforce', up: true, iconBg: 'rgba(118,199,51,0.15)' },
    { icon: '✅', label: 'Active Today', value: Math.max(0, activeEmployees - approvedCount), change: `${attendancePct}% attendance`, up: attendancePct >= 80, iconBg: 'rgba(74,144,217,0.15)' },
    { icon: '📅', label: 'On Leave', value: approvedCount, change: `${pendingCount} pending`, up: pendingCount === 0, iconBg: 'rgba(251,191,36,0.15)' },
    { icon: '🏢', label: 'Departments', value: departmentsCount, change: 'All active', up: true, iconBg: 'rgba(155,89,182,0.15)' },
  ];

  const stats = isAdmin ? adminStats : [];

  const adminActions = [
    { icon: '➕', label: 'Add New Employee', path: '/add-employee' },
    { icon: '📈', label: 'View Analytics', path: '/analytics' },
    { icon: '👥', label: 'Manage Employees', path: '/employees' },
    { icon: '📅', label: 'Manage Leaves', path: '/manage-leaves' },
    { icon: '⚙️', label: 'Settings', path: '/settings' },
  ];

  const employeeActions = [
    { icon: '📅', label: 'Apply for Leave', path: '/my-leaves' },
    { icon: '⚙️', label: 'Profile Settings', path: '/settings' },
  ];

  const actions = isAdmin ? adminActions : employeeActions;

  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="main-wrapper">
        <Navbar title="Dashboard" subtitle="Your personal workspace overview" />

        <div className="content-container">

          {/* Welcome Banner */}
          <div className="welcome-banner">
            <div className="live-tag">
              <span className="live-dot" />
              LIVE UPDATES
            </div>
            <h1 className="welcome-title">
              {greeting},<br />
              <span>{user?.name}.</span>
            </h1>

            {/* Extended Profile Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 }}>
              <p style={{ color: '#76c733', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
                <span>✉️</span> {user?.email}
              </p>
              <p style={{ color: '#999999', fontSize: 13, maxWidth: 500, lineHeight: 1.5 }}>
                {user?.bio || "No bio set. Head over to Settings to add a short bio and personalize your profile!"}
              </p>
            </div>

            <button className="view-calendar-btn" onClick={() => setShowCalendar(true)}>📅 View Calendar</button>
          </div>

          {/* Stats Grid */}
          {stats.length > 0 && (
            <div className="stats-grid">
              {stats.map((s, i) => (
                <div className="stat-card" key={i}>
                  <div className="stat-icon" style={{ background: s.iconBg }}>{s.icon}</div>
                  <div className="stat-number">{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                  <div className={`stat-change ${s.up ? 'stat-up' : 'stat-down'}`}>
                    {s.up ? '↑' : '↓'} {s.change}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Employee Leave Balance Overview */}
          {!isAdmin && (
            <div style={{ marginBottom: 32 }}>
              <h3 className="card-title" style={{ marginBottom: 16 }}>MY LEAVE BALANCE</h3>
              <div className="leave-balance-grid">
                {[
                  { type: 'Casual', val: useLeaves().balance.casual },
                  { type: 'Sick', val: useLeaves().balance.sick },
                  { type: 'Annual', val: useLeaves().balance.annual },
                  { type: 'Emergency', val: useLeaves().balance.emergency },
                ].map(({ type, val }) => {
                  const total = val?.total ?? 0;
                  const used = val?.used ?? 0;
                  const rem = total - used;
                  return (
                    <div className="leave-balance-card" key={type} onClick={() => navigate('/my-leaves')} style={{ cursor: 'pointer' }}>
                      <div className="leave-balance-num" style={{ color: rem === 0 ? '#ef4444' : '#76c733' }}>{rem}</div>
                      <div className="leave-balance-type">{type} Leave</div>
                      <div style={{ fontSize: 11, color: '#6b7b6b', marginTop: 4 }}>{used} used of {total}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bottom Cards Row */}
          <div className="section-grid">

            {/* Team Celebration Card */}
            <div className="celebration-card" style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', top: 20, right: 20,
                background: '#1a2a1a', padding: '10px',
                borderRadius: '12px', fontSize: '22px'
              }}>🎂</div>

              <p className="card-title">TEAM CELEBRATIONS</p>

              {nextBirthday ? (
                <>
                  <h3 className="card-heading">Upcoming Birthday: {nextBirthday.name}</h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: 14,
                      overflow: 'hidden', border: '2px solid #76c733', flexShrink: 0,
                      background: nextBirthday.color || 'rgba(118,199,51,0.1)'
                    }}>
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: '#fff' }}>
                        {nextBirthday.initials}
                      </div>
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 15, color: '#fff' }}>
                        {new Date(nextBirthday.dob).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </p>
                      <p style={{ color: '#6b7b6b', fontSize: 13, marginTop: 4 }}>
                        {nextBirthday.nextBday.toDateString() === now.toDateString() ? "Happening Today! 🎊" : `Next in ${Math.ceil(nextBirthday.diff / (1000 * 60 * 60 * 24))} days 🎉`}
                      </p>
                    </div>
                  </div>
                  {(user?.employeeId || user?.id) !== nextBirthday.id && (
                    <button
                      onClick={() => {
                        if (nextBirthday) {
                          setWishTarget({
                            id: nextBirthday.id,
                            name: nextBirthday.name,
                            initials: nextBirthday.initials,
                            role: nextBirthday.role || 'admin'
                          });
                          setWishMessage(`Happy Birthday, ${nextBirthday.name} 🎉`);
                          setShowChat(true);
                        }
                      }}
                      style={{
                        marginTop: 16,
                        background: 'rgba(118,199,51,0.12)',
                        border: '1px solid rgba(118,199,51,0.3)',
                        borderRadius: 12,
                        padding: '10px 20px',
                        color: '#76c733',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontSize: 14,
                        transition: 'all 0.2s',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        fontFamily: 'inherit'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(118,199,51,0.2)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(118,199,51,0.12)';
                      }}
                    >
                      🎉 Send a Wish
                    </button>
                  )}
                </>
              ) : (
                <>
                  <h3 className="card-heading">No Upcoming Birthdays</h3>
                  <p style={{ color: '#6b7b6b', fontSize: 13, marginTop: 10 }}>Keep track of team celebrations here.</p>
                </>
              )}
            </div>

            {/* Quick Actions Card */}
            <div className="card">
              <p className="card-title">QUICK ACTIONS</p>
              <h3 className="card-heading">What would you like to do?</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {actions.map(({ icon, label, path }) => (
                  <button
                    key={path}
                    onClick={() => navigate(path)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 16px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid #1a2a1a',
                      borderRadius: 12,
                      color: '#d0e0d0', fontSize: 14, fontWeight: 500,
                      cursor: 'pointer', width: '100%',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                      fontFamily: 'inherit',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'rgba(118,199,51,0.3)';
                      e.currentTarget.style.background = 'rgba(118,199,51,0.05)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = '#1a2a1a';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{icon}</span>
                    {label}
                    <span style={{ marginLeft: 'auto', color: '#4a5a4a' }}>→</span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
      <CalendarModal isOpen={showCalendar} onClose={() => setShowCalendar(false)} />

      {/* Floating Chat Button for Admin and Superadmin */}
      {(user?.role === 'admin' || user?.role === 'superadmin') && (
        <div style={{
          position: 'fixed', bottom: 32, right: 32,
          zIndex: 90,
          width: 64, height: 64,
        }}>
          <button
            onClick={() => setShowChat(true)}
            style={{
              width: '100%', height: '100%', borderRadius: '50%',
              backgroundColor: '#76c733', color: '#0e1510',
              border: 'none', boxShadow: '0 8px 24px rgba(118,199,51,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 11.5C21 16.1944 16.9706 20 12 20C10.5901 20 9.25595 19.6888 8.08226 19.1352C7.65215 18.9324 7.15197 18.9137 6.70277 19.0886L3 20.5L4.41142 16.7972C4.58628 16.348 4.56762 15.8479 4.36476 15.4177C3.81116 14.244 3.5 12.9099 3.5 11.5C3.5 6.80558 7.52944 3 12.5 3C17.4706 3 21 6.80558 21 11.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Notification Badge — outside the button so border-radius doesn't clip it */}
          {unreadCount > 0 && !showChat && (
            <div style={{
              position: 'absolute', top: -8, right: -8,
              backgroundColor: '#EF4444', color: 'white',
              fontSize: '11px', fontWeight: '700',
              minWidth: '22px', height: '22px',
              borderRadius: '11px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 12px rgba(239, 68, 68, 0.7)',
              border: '2px solid #080c08',
              animation: 'pulse 1.5s ease-in-out infinite',
              pointerEvents: 'none',
              zIndex: 2,
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
        </div>
      )}


      <Chat
        isOpen={showChat}
        onClose={() => {
          setShowChat(false);
          setWishTarget(null);
          setWishMessage('');
        }}
        socket={socket}
        messages={messages}
        setMessages={setMessages}
        onlineUsers={onlineUsers}
        wishTarget={wishTarget}
        wishMessage={wishMessage}
        setWishMessage={setWishMessage}
      />
    </div>
  );
};

export default Dashboard;