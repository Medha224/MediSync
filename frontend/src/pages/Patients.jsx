import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Trash2 } from 'lucide-react';
import './Patients.css';

const Patients = ({ currentUser }) => {
  const userRole = currentUser?.role;
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', dateOfBirth: '', gender: 'Male', medicalHistory: ''
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/patients');
      const data = await res.json();
      setPatients(data);
    } catch (err) {
      console.error('Failed to fetch patients', err);
    }
  };

  const handleAddPatient = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ name: '', email: '', phone: '', dateOfBirth: '', gender: 'Male', medicalHistory: '' });
        fetchPatients();
      }
    } catch (err) {
      console.error('Error adding patient', err);
    }
  };

  const handleDeletePatient = async (id) => {
    if (window.confirm('Are you sure you want to delete this patient?')) {
      try {
        const res = await fetch(`http://localhost:5000/api/patients/${id}`, { method: 'DELETE' });
        if (res.ok) fetchPatients();
      } catch (err) {
        console.error('Error deleting patient', err);
      }
    }
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p._id.includes(searchTerm)
  );

  return (
    <motion.div 
      className="patients-page"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
    >
      <header className="page-header flex-between">
        <div>
          <h1>Patient Records</h1>
          <p className="subtitle">Manage patient information and history.</p>
        </div>
        {userRole === 'Doctor' && (
          <button className="primary-btn" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> Add Patient
          </button>
        )}
      </header>

      <div className="table-container glass-card">
        <div className="table-actions">
          <div className="search-bar">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search patients by name or ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Patient ID</th>
              <th>Name</th>
              <th>DOB / Gender</th>
              <th>Contact</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredPatients.length === 0 ? (
              <tr><td colSpan="5" style={{textAlign: 'center', padding: '2rem'}}>No patients found.</td></tr>
            ) : filteredPatients.map((patient, index) => (
              <motion.tr 
                key={patient._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <td><span className="badge">{patient._id.substring(0, 8)}</span></td>
                <td className="fw-600">{patient.name}</td>
                <td>{new Date(patient.dateOfBirth).toLocaleDateString()} / {patient.gender}</td>
                <td>{patient.phone}<br/><small style={{color: 'var(--text-secondary)'}}>{patient.email}</small></td>
                <td>
                  {userRole === 'Doctor' && (
                    <button className="icon-btn" onClick={() => handleDeletePatient(patient._id)} title="Delete">
                      <Trash2 size={18} color="var(--danger)" />
                    </button>
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <motion.div 
            className="modal-content glass-card"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <h2>Add New Patient</h2>
            <form onSubmit={handleAddPatient}>
              <div className="form-group">
                <label>Full Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input required type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Date of Birth</label>
                <input required type="date" value={formData.dateOfBirth} onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Gender</label>
                <select style={{width:'100%', padding:'0.75rem', background:'rgba(255,255,255,0.05)', color:'white', border:'1px solid var(--border-color)', borderRadius:'var(--radius-sm)'}} 
                  value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-btn">Save Patient</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default Patients;
