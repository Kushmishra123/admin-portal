import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserContext } from './context/UserContext';
import { LeavesProvider } from './context/LeavesContext';
import { EmployeeProvider } from './context/EmployeeContext';
import { LoaderProvider } from './context/LoaderContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import AddEmployee from './pages/AddEmployee';
import Analytics from './pages/Analytics';
import MyLeaves from './pages/MyLeaves';
import Settings from './pages/Settings';
import ManageLeaves from './pages/ManageLeaves';
import Signup from './pages/Signup';
import AboutCompany from './pages/AboutCompany';
import Policy from './pages/Policy';
import ApplyLeave from './pages/ApplyLeave';
import BirthdayPopup from './components/BirthdayPopup';

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('qb_user');
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      console.error('Failed to parse saved user:', e);
      return null;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('qb_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('qb_user');
    }
  }, [user]);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleLogin = (userObj) => {
    setUser(userObj);
    return true;
  };

  const handleLogout = () => {
    setUser(null);
  };

  // ── Role helpers ─────────────────────────────────────────────────────────────
  const role = user?.role;
  const isSuperAdmin = role === 'superadmin';
  const isManager    = role === 'manager';
  const isHR         = role === 'hr';
  const isEmployee   = role === 'employee' || role === 'admin'; // backward compat

  // Elevated = superadmin | manager | hr  (all three can see employee directory + manage leaves)
  const isElevated   = isSuperAdmin || isManager || isHR;

  return (
    <UserContext.Provider value={{ user, setUser, handleLogout, isSidebarCollapsed, setIsSidebarCollapsed }}>
      <LoaderProvider>
        <EmployeeProvider>
          <LeavesProvider>
            <Router>
            <Routes>
              {/* Root — redirect based on auth */}
              <Route
                path="/"
                element={
                  !user ? (
                    <Login onLogin={handleLogin} />
                  ) : (
                    <Navigate to="/dashboard" />
                  )
                }
              />

              {/* Shared Routes — any logged-in user */}
              <Route path="/dashboard" element={user ? <Dashboard />    : <Navigate to="/" />} />
              <Route path="/settings"  element={user ? <Settings />     : <Navigate to="/" />} />
              <Route path="/about"     element={user ? <AboutCompany /> : <Navigate to="/" />} />

              {/* Elevated routes — superadmin | manager | hr */}
              <Route
                path="/employees"
                element={user && isElevated ? <Employees />   : <Navigate to="/" />}
              />
              <Route
                path="/manage-leaves"
                element={user && isElevated ? <ManageLeaves /> : <Navigate to="/" />}
              />
              <Route
                path="/apply-leave"
                element={user && isElevated ? <ApplyLeave />  : <Navigate to="/" />}
              />

              {/* Add Employee — Superadmin, Manager & HR */}
              <Route
                path="/add-employee"
                element={user && (isSuperAdmin || isManager || isHR) ? <AddEmployee /> : <Navigate to="/" />}
              />
              <Route
                path="/analytics"
                element={user && isSuperAdmin ? <Analytics />   : <Navigate to="/" />}
              />

              {/* Employee-only Routes */}
              <Route
                path="/my-leaves"
                element={user && isEmployee ? <MyLeaves /> : <Navigate to="/" />}
              />
              <Route
                path="/policy"
                element={user && isEmployee ? <Policy />   : <Navigate to="/" />}
              />

              {/* Public Signup Page */}
              <Route path="/signup" element={<Signup />} />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Router>
          <BirthdayPopup />
          </LeavesProvider>
        </EmployeeProvider>
      </LoaderProvider>
    </UserContext.Provider>
  );
}

export default App;