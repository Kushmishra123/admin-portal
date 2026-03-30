import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_URL } from '../config';
import { useUser } from './UserContext';

const EmployeeContext = createContext();

export const EmployeeProvider = ({ children }) => {
  const { user } = useUser();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  // ── Fetch employees scoped to the current user's role ─────────────────────
  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Pass callerId so server can scope results by role
      const callerParam = user?.employeeId ? `?callerId=${encodeURIComponent(user.employeeId)}` : '';
      const res = await fetch(`${API_URL}/employees${callerParam}`, { credentials: 'include' });
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const data = await res.json();
      setEmployees(data.employees || []);
    } catch (err) {
      console.error('Failed to load employees:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.employeeId]);

  // Fetch on first mount and when user changes
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // ── Local state helpers (optimistic updates) ───────────────────────────────
  const addEmployee = (emp) => {
    setEmployees(prev => [emp, ...prev]);
  };

  const updateEmployee = async (id, updatedData) => {
    try {
      const res = await fetch(`${API_URL}/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updatedData),
      });

      // Always parse the body so we can surface real error messages
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || `Server responded ${res.status}`);
      }

      if (updatedData.dob) {
        localStorage.removeItem(`birthdayPopupShown_${id}_${updatedData.dob}`);
      }

      await fetchEmployees();
      return true;
    } catch (err) {
      console.error('Failed to update employee:', err);
      setError(err.message);
      return false;
    }
  };

  const deleteEmployee = async (id) => {
    try {
      const res = await fetch(`${API_URL}/employees/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Delete failed');
      }
      // Re-fetch from server to ensure full sync (clears manager refs, etc.)
      await fetchEmployees();
    } catch (err) {
      console.error('Failed to delete employee:', err);
    }
  };

  return (
    <EmployeeContext.Provider
      value={{ employees, loading, error, addEmployee, updateEmployee, deleteEmployee, refreshEmployees: fetchEmployees }}
    >
      {children}
    </EmployeeContext.Provider>
  );
};

export const useEmployee = () => useContext(EmployeeContext);
