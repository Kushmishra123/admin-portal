import React, { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import { useUser } from '../context/UserContext';
import { useEmployee } from '../context/EmployeeContext';
import LoaderButton from './LoaderButton';

const BirthdayPopup = () => {
  const { user } = useUser();
  const { employees } = useEmployee();
  const [showPopup, setShowPopup] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!user || !employees || employees.length === 0) return;

    const currentId = user.id || user.employeeId;
    
    // Find if today is this user's birthday
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentDate = today.getDate();

    const myEmployeeRecord = employees.find(e => e.id === currentId || e._id === currentId || e.id === user.employeeId);
    
    if (myEmployeeRecord && myEmployeeRecord.dob) {
      const dobStr = String(myEmployeeRecord.dob).substring(0, 10);
      const [__, bMonth, bDate] = dobStr.split('-').map(Number);
      
      // Check day and month (bMonth is 1-indexed, currentMonth is 0-indexed)
      if ((bMonth - 1) === currentMonth && bDate === currentDate) {
        const popupKey = `birthdayPopupShown_${currentId}_${dobStr}`;
        const hasShown = localStorage.getItem(popupKey);
        
        if (!hasShown) {
          setShowPopup(true);
          localStorage.setItem(popupKey, 'true');
        }
      }
    }
  }, [user, employees]);

  if (!showPopup) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, 
      background: 'radial-gradient(circle at center, rgba(14,21,16,0.95) 0%, rgba(10,15,10,0.98) 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, backdropFilter: 'blur(10px)',
      overflow: 'hidden'
    }}>
      <Confetti 
        width={windowSize.width} 
        height={windowSize.height} 
        recycle={true} 
        numberOfPieces={400} 
        gravity={0.15} 
        colors={['#76c733', '#8ee04a', '#a9df7c', '#ffffff', '#4a5a4a']}
      />

      {[...Array(15)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          fontSize: `${Math.random() * 30 + 30}px`,
          left: `${Math.random() * 100}%`,
          bottom: '-10%',
          animation: `themeFloatUp ${Math.random() * 5 + 5}s linear infinite`,
          animationDelay: `${Math.random() * 5}s`,
          opacity: 0.8,
          zIndex: 1,
          willChange: 'transform'
        }}>
          {['🎈', '✨', '🎁', '🎊'][Math.floor(Math.random() * 4)]}
        </div>
      ))}

      <div style={{
        position: 'absolute', width: '600px', height: '600px',
        background: 'radial-gradient(circle at center, rgba(118, 199, 51, 0.2) 0%, transparent 70%)',
        animation: 'themePulseGlow 3s ease-in-out infinite'
      }} />

      <div style={{
        position: 'relative', zIndex: 10,
        background: 'rgba(14, 21, 16, 0.85)',
        border: '2px solid rgba(118, 199, 51, 0.4)',
        borderRadius: 32, padding: '60px 40px', width: 560, maxWidth: '90%',
        textAlign: 'center',
        boxShadow: '0 0 80px rgba(118, 199, 51, 0.25), inset 0 0 40px rgba(118, 199, 51, 0.05)',
        animation: 'themeModalPopIn 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
      }}>
        <LoaderButton onClick={() => setShowPopup(false)} style={{
          position: 'absolute', top: 20, right: 20,
          background: 'rgba(255,255,255,0.05)', border: 'none',
          borderRadius: '50%', color: '#d0e0d0', width: 40, height: 40,
          cursor: 'pointer', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.3s ease',
          zIndex: 100
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.8)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'scale(1.1)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#d0e0d0'; e.currentTarget.style.transform = 'scale(1)'; }}
        title="Close"
        >✕</LoaderButton>

        <div style={{ fontSize: 90, marginBottom: 20, animation: 'themeCakeBounce 2s infinite', willChange: 'transform' }}>🎂</div>
        <h2 style={{ 
          fontSize: 42, fontWeight: 900, color: '#fff', margin: 0, marginBottom: 20,
          background: 'linear-gradient(90deg, #76c733, #a9df7c, #76c733)',
          backgroundSize: '200% auto',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          animation: 'themeTextShine 3s linear infinite'
        }}>
          🎉 Happy Birthday! 🎉
        </h2>
        <p style={{ fontSize: 32, color: '#f0fdf4', fontWeight: 800, marginBottom: 24, textShadow: '0 2px 10px rgba(118, 199, 51, 0.4)' }}>
          {user?.name || user?.fullName}!
        </p>
        <p style={{ fontSize: 18, color: '#d0e0d0', lineHeight: 1.7, marginBottom: 40, fontWeight: 500 }}>
          Wish you a great year ahead!<br/> May your day be filled with joy, success, and lots of amazing celebrations! 🥂✨
        </p>

        <LoaderButton onClick={() => setShowPopup(false)} style={{
          background: 'linear-gradient(135deg, #76c733 0%, #4a8a1a 100%)', 
          color: '#0e1510', border: 'none',
          padding: '16px 40px', borderRadius: 100, fontSize: 18, fontWeight: 800,
          cursor: 'pointer', transition: 'all 0.3s ease',
          boxShadow: '0 10px 25px rgba(118, 199, 51, 0.3)',
          display: 'inline-block'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
          e.currentTarget.style.boxShadow = '0 15px 35px rgba(118, 199, 51, 0.5)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
          e.currentTarget.style.boxShadow = '0 10px 25px rgba(118, 199, 51, 0.3)';
        }}
        >
          Start Celebrating! 🎊
        </LoaderButton>
      </div>
      <style>{`
        @keyframes themeModalPopIn {
          0% { opacity: 0; transform: scale(0.6) translate3d(0, 50px, 0); }
          100% { opacity: 1; transform: scale(1) translate3d(0, 0, 0); }
        }
        @keyframes themeCakeBounce {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(0, -20px, 0) scale(1.05); }
        }
        @keyframes themePulseGlow {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 0.8; }
        }
        @keyframes themeFloatUp {
          0% { transform: translate3d(0, 0, 0) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translate3d(0, -120vh, 0) rotate(360deg); opacity: 0; }
        }
        @keyframes themeTextShine {
          to { background-position: 200% center; }
        }
      `}</style>
    </div>
  );
};

export default BirthdayPopup;
