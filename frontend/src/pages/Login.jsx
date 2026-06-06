import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import './Login.css';

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectionType, setSelectionType] = useState(''); // 'Patient' or 'Doctor'
  const [selectedUserId, setSelectedUserId] = useState('');

  // Google OAuth & Registration state
  const [unregisteredUser, setUnregisteredUser] = useState(null);
  const [regRole, setRegRole] = useState('Patient');
  const [regPhone, setRegPhone] = useState('');
  const [regSpecialty, setRegSpecialty] = useState('');
  const [regDateOfBirth, setRegDateOfBirth] = useState('');
  const [regGender, setRegGender] = useState('Male');
  const [error, setError] = useState('');

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

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    try {
      const response = await fetch('http://localhost:5000/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ credential: credentialResponse.credential })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Google sign-in failed');
      }

      if (data.status === 'success') {
        onLogin(data.user);
        navigate('/');
      } else if (data.status === 'unregistered') {
        setUnregisteredUser({
          email: data.email,
          name: data.name
        });
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  const handleGoogleError = () => {
    setError('Google Sign-In failed. Please try again.');
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const body = {
      role: regRole,
      name: unregisteredUser.name,
      email: unregisteredUser.email,
      phone: regPhone,
      specialty: regRole === 'Doctor' ? regSpecialty : undefined,
      dateOfBirth: regRole === 'Patient' ? regDateOfBirth : undefined,
      gender: regRole === 'Patient' ? regGender : undefined
    };

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      onLogin(data);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err.message);
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

        {error && <div className="login-error-toast">{error}</div>}

        {!unregisteredUser ? (
          <>
            <h1 className="login-title">Welcome Back</h1>
            <p className="login-sub">Sign in to access your digital clinic dashboard.</p>

            <div className="google-signin-wrapper">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="filled_blue"
                shape="pill"
                size="large"
                width="340"
              />
            </div>

            <div className="divider">Or select a demo profile</div>

            {!selectionType ? (
              <div className="demo-btn-group">
                <button className="demo-role-btn" onClick={() => setSelectionType('Doctor')}>
                  Login as Doctor
                </button>
                <button className="demo-role-btn" onClick={() => setSelectionType('Patient')}>
                  Login as Patient
                </button>
              </div>
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
          </>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="register-form">
            <h2 className="register-title">Complete Profile</h2>
            <p className="register-sub">Welcome, {unregisteredUser.name}! Please fill in your details to create a profile.</p>

            <div className="form-group">
              <label className="input-label">Select Role</label>
              <div className="role-btn-group">
                <button 
                  type="button" 
                  className={`role-choice-btn ${regRole === 'Patient' ? 'active' : ''}`}
                  onClick={() => setRegRole('Patient')}
                >
                  Patient
                </button>
                <button 
                  type="button" 
                  className={`role-choice-btn ${regRole === 'Doctor' ? 'active' : ''}`}
                  onClick={() => setRegRole('Doctor')}
                >
                  Doctor
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="input-label">Phone Number</label>
              <input 
                type="tel" 
                required 
                className="form-input"
                placeholder="Enter your phone number" 
                value={regPhone} 
                onChange={(e) => setRegPhone(e.target.value)} 
              />
            </div>

            {regRole === 'Doctor' ? (
              <div className="form-group">
                <label className="input-label">Specialty</label>
                <input 
                  type="text" 
                  required 
                  className="form-input"
                  placeholder="e.g. Cardiologist" 
                  value={regSpecialty} 
                  onChange={(e) => setRegSpecialty(e.target.value)} 
                />
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label className="input-label">Date of Birth</label>
                  <input 
                    type="date" 
                    required 
                    className="form-input"
                    value={regDateOfBirth} 
                    onChange={(e) => setRegDateOfBirth(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label className="input-label">Gender</label>
                  <select 
                    required 
                    className="form-input"
                    value={regGender} 
                    onChange={(e) => setRegGender(e.target.value)}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </>
            )}

            <button type="submit" className="demo-btn" style={{marginTop: '1.5rem'}}>
              Register & Sign In
            </button>
            <button 
              type="button" 
              className="google-btn" 
              style={{marginTop:'0.5rem'}} 
              onClick={() => setUnregisteredUser(null)}
            >
              Cancel
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default Login;

