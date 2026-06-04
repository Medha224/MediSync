import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectionType, setSelectionType] = useState(''); // 'Patient' or 'Doctor'
  const [selectedUserId, setSelectedUserId] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/api/patients').then(res => res.json()).then(setPatients).catch(console.error);
    fetch('http://localhost:5000/api/doctors').then(res => res.json()).then(setDoctors).catch(console.error);
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!selectedUserId) return;
    
    let user;
    if (selectionType === 'Patient') {
      user = patients.find(p => p._id === selectedUserId);
    } else {
      user = doctors.find(d => d._id === selectedUserId);
    }

    if (user) {
      onLogin({
        role: selectionType,
        id: user._id,
        name: user.name
      });
      navigate('/');
    }
  };

  return (
    <div className="login-page-container">
      <motion.div 
        className="login-card"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="login-logo">
          <div className="logo-icon">
            <Activity color="#fff" size={28} />
          </div>
          <div className="login-brand">MediSync</div>
        </div>

        <h1 className="login-title">Welcome Back</h1>
        <p className="login-sub">Sign in to access your digital clinic dashboard.</p>

        {!selectionType ? (
          <>
            <button className="google-btn" onClick={() => setSelectionType('Doctor')}>
             
              Login as Doctor
            </button>
            <button className="google-btn" onClick={() => setSelectionType('Patient')}>
             
              Login as Patient
            </button>
          </>
        ) : (
          <form onSubmit={handleLogin} style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
            <p style={{color:'var(--text2)', textAlign:'center', marginBottom:'10px'}}>Select your {selectionType.toLowerCase()} profile:</p>
            <select 
              required
              style={{
                width: '100%', padding: '14px', borderRadius: '13px', 
                background: 'var(--bg3)', border: '1px solid var(--border2)', 
                color: 'var(--text)', outline: 'none'
              }}
              value={selectedUserId} 
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              <option value="">-- Choose Profile --</option>
              {selectionType === 'Patient' ? 
                patients.map(p => <option key={p._id} value={p._id}>{p.name}</option>) :
                doctors.map(d => <option key={d._id} value={d._id}>{d.name} ({d.specialty})</option>)
              }
            </select>
            <button type="submit" className="demo-btn">
              Sign In
            </button>
            <button type="button" className="google-btn" style={{marginTop:'0'}} onClick={() => {setSelectionType(''); setSelectedUserId('');}}>
              Go Back
            </button>
          </form>
        )}

   
      </motion.div>
    </div>
  );
};

export default Login;
