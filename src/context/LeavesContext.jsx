import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_URL } from '../config';
import { useUser } from './UserContext';

const LeavesContext = createContext();

export const LeavesProvider = ({ children }) => {
  const { user } = useUser();

  const [leaves,  setLeaves]  = useState([]);
  const [balance, setBalance] = useState({
    casual:    { total: 8,  used: 0 },
    sick:      { total: 10, used: 0 },
    annual:    { total: 15, used: 0 },
    emergency: { total: 3,  used: 0 },
  });
  const [entitlements, setEntitlements] = useState([]);
  const [loading, setLoading] = useState(false);

  // ── Fetch leaves from the database ──────────────────────────────────────────
  const fetchLeaves = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (user.role === 'superadmin' || user.role === 'manager' || user.role === 'hr') {
        // Elevated roles see all (or scoped) requests
        const res  = await fetch(`${API_URL}/leaves/all?callerId=${encodeURIComponent(user.employeeId)}`, { credentials: 'include' });
        const data = await res.json();
        setLeaves(data.leaves || []);
      } else {
        // Normal admin sees own requests + balance in one call
        const res  = await fetch(`${API_URL}/leaves/my/${user.employeeId}`, { credentials: 'include' });
        const data = await res.json();
        setLeaves(data.requests || []);
        if (data.balance) setBalance(data.balance);
      }
    } catch (err) {
      console.error('Failed to fetch leaves:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch balance separately only for superadmin
  const fetchBalance = useCallback(async () => {
    if (!user || user.role === 'superadmin') return;
    // Balance is already returned by fetchLeaves for normal admin
  }, [user]);

  const fetchEntitlements = useCallback(async () => {
    if (!user) return;
    try {
      const uId = user.id || user._id; // Ensure we get the Mongo ObjectId
      if (typeof uId === 'string' && uId.startsWith('QBL-')) {
          // If the context uses employeeId as its primary id, fallback logic shouldn't be here since the DB stores Mongo IDs in LeaveType. 
          // Let's pass the Mongo ID. If `user.id` is QBL, we will use employeeId to look up the DB inside `server.js`.
      }
      // Wait, my endpoint `user/:userId`. The userId is passed and `LeaveType.find({ employeeId: req.params.userId })`
      // Wait! LeaveType schema:
      // `employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }`
      // This means `req.params.userId` must be the mongoose ObjectId `_id`.
      
      const realMongoId = user._id || user.id; // Usually backend sends _id in user.id or user._id on login
      // Wait! Login sends `user: { employeeId: user.employeeId, id: user._id ...}`?
      // Let's check server.js login logic. 
      // I'll just use another endpoint `/api/leave-types/employee/:employeeId` later if this fails, but since I am passing `user.id` everywhere, let's try `user.id`. Actually `user.id` is not standard, `user.employeeId` is the string.
      // I will update the URL below to use employeeId and fix the backend route to accept employeeId string.
      const res = await fetch(`${API_URL}/leave-types/employee/${encodeURIComponent(user.employeeId)}`, { credentials: 'include' });
      const data = await res.json();
      if (data.data) {
        setEntitlements(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch entitlements:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchLeaves();
    fetchBalance();
    fetchEntitlements();
  }, [fetchLeaves, fetchBalance, fetchEntitlements]);

  // ── Normal admin applies for leave ──────────────────────────────────────────
  const applyLeave = async ({ leaveType, from, to, days, reason }) => {
    const res  = await fetch(`${API_URL}/leaves/apply`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        employeeId:   user.employeeId,
        employeeName: user.name,
        leaveType, from, to, days, reason,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to apply');
    // Refresh both
    await fetchLeaves();
    await fetchBalance();
    return data.leave;
  };

  // ── Superadmin updates leave status ─────────────────────────────────────────
  const updateLeaveStatus = async (leave, status) => {
    // leave has both employeeLeaveId (parent doc) and _id (embedded request)
    const res  = await fetch(`${API_URL}/leaves/${leave.employeeLeaveId}/request/${leave._id}/status`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status, processedBy: user?.employeeId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update');
    await fetchLeaves();
    return data;
  };

  return (
    <LeavesContext.Provider value={{
      leaves, balance, entitlements, loading,
      applyLeave, updateLeaveStatus,
      refreshLeaves: () => { fetchLeaves(); fetchEntitlements(); },
    }}>
      {children}
    </LeavesContext.Provider>
  );
};

export const useLeaves = () => useContext(LeavesContext);
