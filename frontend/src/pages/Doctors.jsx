import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit } from 'lucide-react';
import './Doctors.css';

const locales = {
  'en-US': enUS,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

const Doctors = ({ currentUser }) => {
  const userRole = currentUser?.role;
  const [doctors, setDoctors] = useState([]);
  const [events, setEvents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoctorId, setEditingDoctorId] = useState(null);
  const [formData, setFormData] = useState({
    name: '', specialty: '', email: '', phone: ''
  });

  useEffect(() => {
    fetchDoctors();
    fetchAppointmentsForCalendar();
  }, []);

  const fetchDoctors = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/doctors');
      const data = await res.json();
      setDoctors(data);
    } catch (err) {
      console.error('Failed to fetch doctors', err);
    }
  };

  const fetchAppointmentsForCalendar = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/appointments');
      const data = await res.json();
      
      let userAppointments = data;
      if (currentUser?.role === 'Patient') {
        userAppointments = data.filter(a => a.patient?._id === currentUser.id);
      } else if (currentUser?.role === 'Doctor') {
        userAppointments = data.filter(a => a.doctor?._id === currentUser.id);
      }

      const formattedEvents = userAppointments.map(app => {
        const [startH, startM] = app.startTime.split(':');
        const [endH, endM] = app.endTime.split(':');
        
        const startDate = new Date(app.appointmentDate);
        startDate.setHours(startH, startM, 0);
        
        const endDate = new Date(app.appointmentDate);
        endDate.setHours(endH, endM, 0);

        return {
          title: `${app.doctor?.name} - ${app.patient?.name}`,
          start: startDate,
          end: endDate,
        };
      });
      setEvents(formattedEvents);
    } catch (err) {
      console.error('Error fetching calendar events', err);
    }
  };



  const handleSubmitDoctor = async (e) => {
    e.preventDefault();
    try {
      const url = editingDoctorId 
        ? `http://localhost:5000/api/doctors/${editingDoctorId}`
        : 'http://localhost:5000/api/doctors';
      const method = editingDoctorId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setIsModalOpen(false);
        setEditingDoctorId(null);
        setFormData({ name: '', specialty: '', email: '', phone: '' });
        fetchDoctors();
      }
    } catch (err) {
      console.error('Error saving doctor', err);
    }
  };

  const handleDeleteDoctor = async (id) => {
    if (!window.confirm('Are you sure you want to delete this doctor?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/doctors/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchDoctors();
      }
    } catch (err) {
      console.error('Failed to delete doctor', err);
    }
  };

  return (
    <motion.div 
      className="doctors-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <header className="page-header flex-between">
        <div>
          <h1>Doctor Directory & Availability</h1>
          <p className="subtitle">Manage schedules.</p>
        </div>
        {userRole === 'Doctor' && (
          <button className="primary-btn" onClick={() => {
            setEditingDoctorId(null);
            setFormData({ name: '', specialty: '', email: '', phone: '' });
            setIsModalOpen(true);
          }}>
            <Plus size={18} /> Add Doctor
          </button>
        )}
      </header>

      <div className="doctors-content">
        <div className="calendar-section glass-card">
          <h2>Availability Calendar</h2>
          <div className="calendar-wrapper">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 600 }}
              defaultView="week"
              views={['week']}
            />
          </div>
        </div>

        <div className="doctors-list-section glass-card">
          <h2>Our Doctors</h2>
          <div className="doctors-grid">
            {doctors.length === 0 ? <p style={{color:'var(--text-secondary)'}}>No doctors found.</p> : doctors.map((doc) => (
              <div key={doc._id} className="doctor-card" style={{ position: 'relative' }}>
                {userRole === 'Doctor' && (
                  <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '5px' }}>
                    <button 
                      className="icon-btn" 
                      style={{ background: 'transparent' }} 
                      onClick={() => {
                        setEditingDoctorId(doc._id);
                        setFormData({ name: doc.name, specialty: doc.specialty, email: doc.email, phone: doc.phone });
                        setIsModalOpen(true);
                      }} 
                      title="Edit Doctor"
                    >
                      <Edit size={18} color="var(--accent-primary)" />
                    </button>
                    <button 
                      className="icon-btn" 
                      style={{ background: 'transparent' }} 
                      onClick={() => handleDeleteDoctor(doc._id)} 
                      title="Delete Doctor"
                    >
                      <Trash2 size={18} color="var(--danger)" />
                    </button>
                  </div>
                )}
                <div className="doc-avatar">{doc.name.charAt(0)}</div>
                <div className="doc-info">
                  <h3>{doc.name}</h3>
                  <p className="specialty">{doc.specialty}</p>
                  <p className="contact">{doc.email} | {doc.phone}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isModalOpen && userRole === 'Doctor' && (
        <div className="modal-overlay">
          <motion.div 
            className="modal-content glass-card"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <h2>{editingDoctorId ? 'Edit Doctor' : 'Add New Doctor'}</h2>
            <form onSubmit={handleSubmitDoctor}>
              <div className="form-group">
                <label>Full Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Specialty</label>
                <input required type="text" value={formData.specialty} onChange={e => setFormData({...formData, specialty: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input required type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-btn">{editingDoctorId ? 'Update Doctor' : 'Save Doctor'}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default Doctors;
