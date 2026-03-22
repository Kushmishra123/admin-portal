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
import BirthdayPopup from './components/BirthdayPopup';

function App() {
  const [user, setUser] = useState(() => {
    // Check localStorage for saved user on initial load
    const savedUser = localStorage.getItem('qb_user');
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      console.error('Failed to parse saved user:', e);
      return null;
    }
  });

  // Sync user state to localStorage whenever it changes
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

  return (
    <UserContext.Provider value={{ user, setUser, handleLogout, isSidebarCollapsed, setIsSidebarCollapsed }}>
      <LoaderProvider>
        <EmployeeProvider>
          <LeavesProvider>
            <Router>
            <Routes>
              {/* Root — redirect based on role */}
              <Route
                path="/"
                element={
                  !user ? (
                    <Login onLogin={handleLogin} />
                  ) : (
                    <Navigate to={user.role === 'superadmin' ? '/employees' : '/dashboard'} />
                  )
                }
              />

              {/* Shared Routes */}
              <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/" />} />
              <Route path="/settings"  element={user ? <Settings />  : <Navigate to="/" />} />
              <Route path="/about"     element={user ? <AboutCompany /> : <Navigate to="/" />} />

              {/* Superadmin-only Routes */}
              <Route path="/employees"    element={user?.role === 'superadmin' ? <Employees />   : <Navigate to="/" />} />
              <Route path="/add-employee" element={user?.role === 'superadmin' ? <AddEmployee /> : <Navigate to="/" />} />
              <Route path="/analytics"    element={user?.role === 'superadmin' ? <Analytics />   : <Navigate to="/" />} />
              <Route path="/manage-leaves" element={user?.role === 'superadmin' ? <ManageLeaves /> : <Navigate to="/" />} />

              {/* Admin-only Routes (non-superadmin logged-in users) */}
              <Route path="/my-leaves" element={user?.role === 'admin' ? <MyLeaves /> : <Navigate to="/" />} />
              <Route path="/policy"    element={user?.role === 'admin' ? <Policy />   : <Navigate to="/" />} />

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