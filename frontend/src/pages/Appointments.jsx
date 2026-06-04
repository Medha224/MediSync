import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Check, X, Clock, Trash2, FileSignature } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Appointments.css';

const Appointments = ({ currentUser }) => {
  const userRole = currentUser?.role;
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All');
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    patient: '', doctor: '', appointmentDate: '', startTime: '', endTime: '', notes: ''
  });

  useEffect(() => {
    fetchAppointments();
    fetchPatientsAndDoctors();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/appointments');
      const data = await res.json();
      let userAppointments = data;
      if (currentUser?.role === 'Patient') {
        userAppointments = data.filter(a => a.patient?._id === currentUser.id);
      } else if (currentUser?.role === 'Doctor') {
        userAppointments = data.filter(a => a.doctor?._id === currentUser.id);
      }
      setAppointments(userAppointments);
    } catch (err) {
      console.error('Failed to fetch appointments', err);
    }
  };

  const fetchPatientsAndDoctors = async () => {
    try {
      const [pRes, dRes] = await Promise.all([
        fetch('http://localhost:5000/api/patients'),
        fetch('http://localhost:5000/api/doctors')
      ]);
      setPatients(await pRes.json());
      setDoctors(await dRes.json());
    } catch (err) {
      console.error('Failed to fetch relations', err);
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ patient: '', doctor: '', appointmentDate: '', startTime: '', endTime: '', notes: '' });
        fetchAppointments();
      }
    } catch (err) {
      console.error('Error booking appointment', err);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await fetch(`http://localhost:5000/api/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) fetchAppointments();
    } catch (err) {
      console.error('Error updating status', err);
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm('Delete this appointment record entirely?')) {
      try {
        const res = await fetch(`http://localhost:5000/api/appointments/${id}`, { method: 'DELETE' });
        if (res.ok) fetchAppointments();
      } catch (err) {
        console.error('Error deleting', err);
      }
    }
  }

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Scheduled': return <span className="status-badge status-scheduled"><Clock size={14}/> Scheduled</span>;
      case 'Completed': return <span className="status-badge status-completed"><Check size={14}/> Completed</span>;
      case 'Cancelled': return <span className="status-badge status-cancelled"><X size={14}/> Cancelled</span>;
      default: return null;
    }
  };

  return (
    <motion.div 
      className="appointments-page"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <header className="page-header flex-between">
        <div>
          <h1>Appointments</h1>
          <p className="subtitle">Manage bookings and status updates.</p>
        </div>
        <button className="primary-btn" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Book Appointment
        </button>
      </header>

      <div className="glass-card">
        <div className="filter-tabs">
          {['All', 'Scheduled', 'Completed', 'Cancelled'].map(tab => (
            <button 
              key={tab} 
              className={`filter-tab ${filter === tab ? 'active' : ''}`}
              onClick={() => setFilter(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="appointments-list">
          {appointments.length === 0 ? <p style={{color:'var(--text-secondary)'}}>No appointments found.</p> :
            appointments
            .filter(app => filter === 'All' || app.status === filter)
            .map((app, index) => (
              <motion.div 
                key={app._id} 
                className="appointment-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="app-time-block">
                  <span className="app-date">{new Date(app.appointmentDate).toLocaleDateString()}</span>
                  <span className="app-time">{app.startTime}</span>
                </div>
                <div className="app-details">
                  <h4>{app.patient?.name || 'Unknown'}</h4>
                  <p>with {app.doctor?.name || 'Unknown'}</p>
                </div>
                <div className="app-status">
                  {getStatusBadge(app.status)}
                </div>
                <div className="app-actions">
                  {app.status === 'Scheduled' && (
                    <>
                      {userRole === 'Doctor' && (
                        <button className="action-btn success-btn" onClick={() => handleUpdateStatus(app._id, 'Completed')} title="Mark Completed"><Check size={16}/></button>
                      )}
                      <button className="action-btn danger-btn" onClick={() => handleUpdateStatus(app._id, 'Cancelled')} title="Cancel Appointment"><X size={16}/></button>
                    </>
                  )}
                  {app.status === 'Completed' && (
                    <button className="action-btn" style={{background:'rgba(16,185,129,0.1)', color:'var(--success)'}} onClick={() => {
                      navigate(`/prescription?appt=${app._id}`);
                    }} title="View Prescription">
                      <FileSignature size={16} />
                    </button>
                  )}
                  {userRole === 'Doctor' && (
                    <button className="action-btn" style={{background:'rgba(255,255,255,0.05)', color:'var(--text-secondary)'}} onClick={() => handleDelete(app._id)} title="Delete Record"><Trash2 size={16}/></button>
                  )}
                </div>
              </motion.div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <motion.div 
            className="modal-content glass-card"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <h2>Book Appointment</h2>
            <form onSubmit={handleBookAppointment}>
              <div className="form-group">
                <label>Select Patient</label>
                <select required value={formData.patient} onChange={e => setFormData({...formData, patient: e.target.value})} className="form-select">
                  <option value="">-- Choose Patient --</option>
                  {patients.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Select Doctor</label>
                <select required value={formData.doctor} onChange={e => setFormData({...formData, doctor: e.target.value})} className="form-select">
                  <option value="">-- Choose Doctor --</option>
                  {doctors.map(d => <option key={d._id} value={d._id}>{d.name} ({d.specialty})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Date</label>
                <input required type="date" value={formData.appointmentDate} onChange={e => setFormData({...formData, appointmentDate: e.target.value})} />
              </div>
              <div className="form-group" style={{display:'flex', gap:'1rem'}}>
                <div style={{flex:1}}>
                  <label>Start Time</label>
                  <input required type="time" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} />
                </div>
                <div style={{flex:1}}>
                  <label>End Time</label>
                  <input required type="time" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-btn">Book Appointment</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default Appointments;
