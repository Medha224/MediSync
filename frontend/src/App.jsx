import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Doctors from './pages/Doctors';
import Appointments from './pages/Appointments';
import Prescription from './pages/Prescription';
import Login from './pages/Login';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './App.css';

function App() {
  
   const [isAuthenticated, setIsAuthenticated] = useState(
  !!localStorage.getItem("user")
);

const [currentUser, setCurrentUser] = useState(() => {
  try {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  } catch (error) {
    return null;
  }
});

  const handleLogin = (user) => {
  localStorage.setItem("user", JSON.stringify(user));

  setCurrentUser(user);
  setIsAuthenticated(true);
};

  const handleLogout = () => {
  localStorage.removeItem("user");

  setCurrentUser(null);
  setIsAuthenticated(false);
};

  return (
    <Router>
      <div className="global-bg-wrapper">
        <div className="bg-blob b1"></div>
        <div className="bg-blob b2"></div>
        <div className="bg-blob b3"></div>
        
        {!isAuthenticated ? (
          <Routes>
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        ) : (
          <div className="app-container">
            <Sidebar currentUser={currentUser} onLogout={handleLogout} />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Dashboard currentUser={currentUser} />} />
                <Route path="/patients" element={<Patients currentUser={currentUser} />} />
                <Route path="/doctors" element={<Doctors currentUser={currentUser} />} />
                <Route path="/appointments" element={<Appointments currentUser={currentUser} />} />
                <Route path="/prescription" element={<Prescription currentUser={currentUser} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        )}
      </div>
    </Router>
  );
}

export default App;
