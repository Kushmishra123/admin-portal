import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_URL } from '../config';

const EmployeeContext = createContext();

export const EmployeeProvider = ({ children }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  // ── Fetch all employees from the database ──────────────────────────────────
  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/employees`, { credentials: 'include' });
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const data = await res.json();
      setEmployees(data.employees || []);
    } catch (err) {
      console.error('Failed to load employees:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on first mount
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
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      
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
      await fetch(`${API_URL}/employees/${id}`, { method: 'DELETE', credentials: 'include' });
      setEmployees(prev => prev.filter(e => e.id !== id));
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
