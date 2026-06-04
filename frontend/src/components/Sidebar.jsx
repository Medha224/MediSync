import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, UserRoundCog, CalendarDays, FileText, Activity, LogOut } from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ currentUser, onLogout }) => {
  const userRole = currentUser?.role;
  const navItems = [
    { path: '/', name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/patients', name: 'Patients', icon: <Users size={20} />, hideFor: 'Patient' },
    { path: '/doctors', name: 'Doctors', icon: <UserRoundCog size={20} /> },
    { path: '/appointments', name: 'Appointments', icon: <CalendarDays size={20} /> },
    { path: '/prescription', name: 'Prescription', icon: <FileText size={20} /> },
  ].filter(item => item.hideFor !== userRole);

  const getInitial = () => {
    return userRole ? userRole.charAt(0).toUpperCase() : 'A';
  }

  return (
    <aside className="sidebar glass-card">
      <div className="sidebar-header">
        <Activity className="logo-icon" size={32} />
        <h2 className="logo-text gradient-text">MediSync</h2>
      </div>
      
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-name">{item.name}</span>
          </NavLink>
        ))}
      </nav>
      
      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="avatar">{getInitial()}</div>
          <div className="user-info">
            <p className="user-name">{currentUser?.name || 'User'}</p>
            <p className="user-role">{userRole}</p>
          </div>
          <button className="logout-btn" onClick={onLogout} title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
