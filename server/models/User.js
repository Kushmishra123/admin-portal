const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'superadmin'],
    default: 'admin',
  },
  initials: {
    type: String,
  },
  policyStatus: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
