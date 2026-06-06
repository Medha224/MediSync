const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const { OAuth2Client } = require('google-auth-library');


// --- Patients ---
router.get('/patients', async (req, res) => {
  try {
    const patients = await Patient.find();
    res.json(patients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/patients', async (req, res) => {
  try {
    const patient = new Patient(req.body);
    await patient.save();
    res.status(201).json(patient);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/patients/:id', async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(patient);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/patients/:id', async (req, res) => {
  try {
    await Patient.findByIdAndDelete(req.params.id);
    res.json({ message: 'Patient deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Doctors ---
router.get('/doctors', async (req, res) => {
  try {
    const doctors = await Doctor.find();
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/doctors', async (req, res) => {
  try {
    const doctor = new Doctor(req.body);
    await doctor.save();
    res.status(201).json(doctor);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/doctors/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(doctor);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/doctors/:id', async (req, res) => {
  try {
    await Doctor.findByIdAndDelete(req.params.id);
    res.json({ message: 'Doctor deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Appointments ---
router.get('/appointments', async (req, res) => {
  try {
    const appointments = await Appointment.find().populate('patient').populate('doctor');
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/appointments', async (req, res) => {
  try {
    const appointment = new Appointment(req.body);
    await appointment.save();
    res.status(201).json(appointment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/appointments/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(appointment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/appointments/:id', async (req, res) => {
  try {
    await Appointment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Appointment cancelled' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Analytics (Heatmap) ---
router.get('/analytics/appointments-heatmap', async (req, res) => {
  try {
    const appointments = await Appointment.find();
    // Group by date to get count
    const heatMapData = appointments.reduce((acc, appt) => {
      const dateKey = new Date(appt.appointmentDate).toISOString().split('T')[0];
      acc[dateKey] = (acc[dateKey] || 0) + 1;
      return acc;
    }, {});
    
    // Format for typical heatmap charting libraries (e.g. { date, count })
    const result = Object.keys(heatMapData).map(date => ({
      date,
      count: heatMapData[date]
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Google Authentication & Registration ---
const GOOGLE_CLIENT_ID = '591216304352-ltmt0cn7ivo8guov86pbt89p1hbqgsd8.apps.googleusercontent.com';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

router.post('/auth/google', async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ error: 'Credential token is required' });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name } = payload;

    // Check Doctor
    const doctor = await Doctor.findOne({ email });
    if (doctor) {
      return res.json({
        status: 'success',
        user: {
          role: 'Doctor',
          id: doctor._id,
          name: doctor.name,
          email: doctor.email
        }
      });
    }

    // Check Patient
    const patient = await Patient.findOne({ email });
    if (patient) {
      return res.json({
        status: 'success',
        user: {
          role: 'Patient',
          id: patient._id,
          name: patient.name,
          email: patient.email
        }
      });
    }

    // Unregistered
    return res.json({
      status: 'unregistered',
      email,
      name
    });
  } catch (err) {
    console.error('Google verification error:', err);
    res.status(401).json({ error: 'Invalid Google token' });
  }
});

router.post('/auth/register', async (req, res) => {
  const { role, name, email, phone, specialty, dateOfBirth, gender } = req.body;
  if (!role || !name || !email || !phone) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    if (role === 'Doctor') {
      if (!specialty) {
        return res.status(400).json({ error: 'Specialty is required for doctors' });
      }
      const existingDoctor = await Doctor.findOne({ email });
      if (existingDoctor) {
        return res.status(400).json({ error: 'Doctor with this email already exists' });
      }

      const doctor = new Doctor({ name, email, phone, specialty, availability: [] });
      await doctor.save();
      return res.status(201).json({
        role: 'Doctor',
        id: doctor._id,
        name: doctor.name,
        email: doctor.email
      });
    } else if (role === 'Patient') {
      if (!dateOfBirth || !gender) {
        return res.status(400).json({ error: 'Date of birth and gender are required for patients' });
      }
      const existingPatient = await Patient.findOne({ email });
      if (existingPatient) {
        return res.status(400).json({ error: 'Patient with this email already exists' });
      }

      const patient = new Patient({ name, email, phone, dateOfBirth, gender });
      await patient.save();
      return res.status(201).json({
        role: 'Patient',
        id: patient._id,
        name: patient.name,
        email: patient.email
      });
    } else {
      return res.status(400).json({ error: 'Invalid role' });
    }
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
