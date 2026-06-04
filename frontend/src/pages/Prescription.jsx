import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, FileSignature, Save } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useLocation } from 'react-router-dom';
import './Prescription.css';

const Prescription = ({ currentUser }) => {
  const prescriptionRef = useRef(null);
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const apptId = queryParams.get('appt');

  const [appointments, setAppointments] = useState([]);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [formData, setFormData] = useState({
    diagnosis: '',
    medications: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/appointments');
        const data = await res.json();
        
        let userAppointments = data.filter(a => a.status === 'Completed');
        if (currentUser?.role === 'Patient') {
          userAppointments = userAppointments.filter(a => a.patient?._id === currentUser.id);
        } else if (currentUser?.role === 'Doctor') {
          userAppointments = userAppointments.filter(a => a.doctor?._id === currentUser.id);
        }
        
        setAppointments(userAppointments);

        if (apptId) {
          const appt = userAppointments.find(a => a._id === apptId);
          if (appt) {
            handleSelectAppointment(appt);
          }
        }
      } catch (err) {
        console.error('Failed to fetch data', err);
      }
    };
    fetchAppointments();
  }, [apptId, currentUser]);

  const handleSelectAppointment = (appt) => {
    setSelectedAppt(appt);
    setFormData({
      diagnosis: appt.prescription?.diagnosis || '',
      medications: appt.prescription?.medications || ''
    });
  };

  const handleApptChange = (e) => {
    const appt = appointments.find(a => a._id === e.target.value);
    if(appt) handleSelectAppointment(appt);
    else setSelectedAppt(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSavePrescription = async () => {
    if(!selectedAppt) return;
    setSaving(true);
    try {
      await fetch(`http://localhost:5000/api/appointments/${selectedAppt._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prescription: formData })
      });
      alert('Prescription saved successfully!');
    } catch (err) {
      console.error('Error saving', err);
    }
    setSaving(false);
  };

  const handleDownloadPDF = async () => {
    const element = prescriptionRef.current;
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Prescription_${selectedAppt?.patient?.name?.replace(' ', '_') || 'Patient'}.pdf`);
  };

  const getAge = (dob) => {
    if(!dob) return '—';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    if (today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const isPatient = currentUser?.role === 'Patient';

  return (
    <motion.div 
      className="prescription-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <header className="page-header flex-between">
        <div>
          <h1>Prescriptions</h1>
          <p className="subtitle">{isPatient ? 'View and download your prescriptions.' : 'Generate and save patient prescriptions.'}</p>
        </div>
      </header>

      <div className="prescription-content">
        <div className="prescription-form glass-card">
          {isPatient ? (
            <>
              <h2>Your Prescriptions</h2>
              <div style={{display:'flex', flexDirection:'column', gap:'1rem', marginTop:'1rem'}}>
                {appointments.filter(a => a.prescription?.diagnosis || a.prescription?.medications).length === 0 ? (
                  <p style={{color:'var(--text2)'}}>No prescriptions available yet.</p>
                ) : (
                  appointments.filter(a => a.prescription?.diagnosis || a.prescription?.medications).map(a => (
                    <div 
                      key={a._id} 
                      onClick={() => handleSelectAppointment(a)}
                      style={{
                        padding:'1rem', 
                        borderRadius:'var(--radius-md)', 
                        background: selectedAppt?._id === a._id ? 'var(--bg3)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${selectedAppt?._id === a._id ? 'var(--green2)' : 'var(--border2)'}`,
                        cursor:'pointer',
                        transition:'var(--transition)'
                      }}
                    >
                      <h4 style={{color:'var(--text)'}}>{new Date(a.appointmentDate).toLocaleDateString()}</h4>
                      <p style={{color:'var(--text2)', fontSize:'0.9rem'}}>Dr. {a.doctor?.name}</p>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              <h2>Select Appointment</h2>
              <div className="form-group">
                <select className="form-select" value={selectedAppt?._id || ''} onChange={handleApptChange}>
                  <option value="">-- Choose Completed Appointment --</option>
                  {appointments.map(a => (
                    <option key={a._id} value={a._id}>
                      {new Date(a.appointmentDate).toLocaleDateString()} - Patient: {a.patient?.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedAppt && (
                <>
                  <div className="form-group" style={{marginTop: '2rem'}}>
                    <label>Diagnosis</label>
                    <input 
                      type="text" 
                      name="diagnosis" 
                      value={formData.diagnosis} 
                      onChange={handleChange} 
                      placeholder="e.g. Mild seasonal allergies" 
                    />
                  </div>
                  <div className="form-group">
                    <label>Medications</label>
                    <textarea 
                      name="medications" 
                      value={formData.medications} 
                      onChange={handleChange} 
                      rows="5" 
                      placeholder="1. Medication name..." 
                    />
                  </div>
                  
                  <div style={{display:'flex', gap:'1rem', marginTop:'1rem'}}>
                    <button className="primary-btn" onClick={handleSavePrescription} disabled={saving} style={{flex:1, justifyContent:'center'}}>
                      <Save size={18} /> {saving ? 'Saving...' : 'Save Details'}
                    </button>
                    <button className="primary-btn" onClick={handleDownloadPDF} style={{flex:1, justifyContent:'center', background:'var(--bg3)', border:'1px solid var(--border2)'}}>
                      <Download size={18} /> Download PDF
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <div className="prescription-preview glass-card" style={{opacity: selectedAppt ? 1 : 0.3, pointerEvents: selectedAppt ? 'auto' : 'none'}}>
          <h2>Preview</h2>
          <div className="preview-paper" ref={prescriptionRef}>
            <div className="paper-header">
              <div className="clinic-logo">
                <FileSignature size={32} color="#10b981" />
                <span style={{color: '#064e3b'}}>MediSync Clinic</span>
              </div>
              <div className="doc-meta">
                <strong>Dr. {selectedAppt?.doctor?.name || '[Doctor Name]'}</strong>
                <p>{selectedAppt?.doctor?.specialty || 'General'}</p>
                <p>Phone: {selectedAppt?.doctor?.phone || '+1 234 567 8900'}</p>
              </div>
            </div>
            <div className="paper-body">
              <div className="patient-meta">
                <p><strong>Patient:</strong> {selectedAppt?.patient?.name || '[Patient Name]'}</p>
                <p><strong>Age:</strong> {getAge(selectedAppt?.patient?.dateOfBirth)}</p>
                <p><strong>Date:</strong> {selectedAppt ? new Date(selectedAppt.appointmentDate).toLocaleDateString() : '—'}</p>
              </div>
              
              <div className="diagnosis-sec">
                <h3>Diagnosis</h3>
                <p>{formData.diagnosis || '—'}</p>
              </div>

              <div className="rx-sec">
                <h1 className="rx-symbol" style={{color: 'rgba(16, 185, 129, 0.1)'}}>Rx</h1>
                <pre className="medication-list">{formData.medications || '—'}</pre>
              </div>
            </div>
            <div className="paper-footer">
              <div className="signature-line">
                <p>Doctor's Signature</p>
              </div>
            </div>
          </div>
          {isPatient && selectedAppt && (
            <div style={{marginTop:'1.5rem', display:'flex', justifyContent:'center'}}>
              <button className="primary-btn" onClick={handleDownloadPDF}>
                <Download size={18} /> Download Prescription
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Prescription;
