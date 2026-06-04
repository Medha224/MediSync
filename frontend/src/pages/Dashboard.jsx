import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, UserRoundCog, CalendarDays, TrendingUp } from 'lucide-react';
import './Dashboard.css';

const Dashboard = ({ currentUser }) => {
  const userRole = currentUser?.role;
  const [stats, setStats] = useState({
    patients: 0,
    doctors: 0,
    appointments: 0
  });
  const [recentAppointments, setRecentAppointments] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [patientsRes, doctorsRes, appointmentsRes] = await Promise.all([
          fetch('http://localhost:5000/api/patients'),
          fetch('http://localhost:5000/api/doctors'),
          fetch('http://localhost:5000/api/appointments')
        ]);

        const patients = await patientsRes.json();
        const doctors = await doctorsRes.json();
        const appointments = await appointmentsRes.json();

        // Filter appointments for Patient if needed
        let userAppointments = appointments;
        if (currentUser?.role === 'Patient') {
          userAppointments = appointments.filter(a => a.patient?._id === currentUser.id);
        } else if (currentUser?.role === 'Doctor') {
          userAppointments = appointments.filter(a => a.doctor?._id === currentUser.id);
        }

        setStats({
          patients: patients.length || 0,
          doctors: doctors.length || 0,
          appointments: userAppointments.filter(a => new Date(a.appointmentDate).toDateString() === new Date().toDateString()).length || 0
        });

        // Set recent appointments
        setRecentAppointments(userAppointments.slice(-4).reverse());

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchDashboardData();
  }, []);

  const statCards = [
    ...(userRole !== 'Patient' ? [{ title: 'Total Patients', value: stats.patients, icon: <Users />, color: 'var(--accent-primary)' }] : []),
    { title: 'Available Doctors', value: stats.doctors, icon: <UserRoundCog />, color: 'var(--success)' },
    { title: 'Appointments Today', value: stats.appointments, icon: <CalendarDays />, color: 'var(--warning)' }
  ];

  return (
    <motion.div 
      className="dashboard-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <header className="page-header">
        <div>
          <h1>Dashboard Overview</h1>
          <p className="subtitle">Welcome back! Here's what's happening today.</p>
        </div>
      </header>

      <div className="stats-grid">
        {statCards.map((stat, index) => (
          <motion.div 
            key={index}
            className="stat-card glass-card"
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="stat-icon" style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>
              {<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-briefcase-medical-icon lucide-briefcase-medical"><path d="M12 11v4"/><path d="M14 13h-4"/><path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><path d="M18 6v14"/><path d="M6 6v14"/><rect width="20" height="14" x="2" y="6" rx="2"/></svg>}
            </div>
            <div className="stat-info">
              <h3>{stat.value}</h3>
              <p>{stat.title}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="dashboard-content">
        <div className="recent-activity glass-card">
          <h2>{userRole === 'Patient' ? 'Recent Activity' : 'Recent Appointments'}</h2>
          <div className="activity-list">
            {recentAppointments.length === 0 ? (
              <p style={{color: 'var(--text-secondary)'}}>No recent appointments found.</p>
            ) : (
              recentAppointments.map((item, idx) => (
                <div key={item._id} className="activity-item">
                  <div className="activity-avatar">{item.patient?.name?.charAt(0) || 'P'}</div>
                  <div className="activity-details">
                    <h4>{item.patient?.name || 'Unknown Patient'}</h4>
                    <p>Checkup with {item.doctor?.name || 'Doctor'}</p>
                  </div>
                  <div className="activity-time">
                    {item.startTime}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
