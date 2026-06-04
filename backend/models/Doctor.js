const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  specialty: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  availability: [{
    dayOfWeek: { type: Number, min: 0, max: 6 }, // 0 = Sunday, 1 = Monday...
    startTime: { type: String }, // e.g., '09:00'
    endTime: { type: String }    // e.g., '17:00'
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Doctor', DoctorSchema);
