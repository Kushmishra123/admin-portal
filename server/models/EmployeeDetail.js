const mongoose = require('mongoose');

const employeeDetailSchema = new mongoose.Schema(
  {
    // Reference to the users table
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    // Mirror the employeeId for quick lookup without joining
    employeeId: {
      type: String,
      required: true,
      unique: true,
    },
    // Work info
    designation: { type: String, default: '' },
    department:  { type: String, default: '' },
    gender:      { type: String, default: '' },
    dob:         { type: String, default: '' },
    joinDate:    { type: String, default: '' },
    status:      { type: String, default: 'Active' },
    // Shift info
    shiftType:   { type: String, default: 'Fixed' },
    shift:       { type: String, default: 'General' },
    offsPerWeek: { type: Number, default: 1 },
    duration:    { type: String, default: '' },
    startTime:   { type: String, default: '' },
    endTime:     { type: String, default: '' },
    // Assets & docs
    assets:      { type: String, default: '-' },
    docUrl:      { type: String, default: '' },
    document:    { type: Boolean, default: false },
    // Performance
    kra:         { type: String, default: '' },
    kpa:         { type: String, default: '' },
    // Display helpers
    color:       { type: String, default: '#0f2d1e' },
    phone:       { type: String, default: '' },
    email: { 
      type: String, 
      default: '', 
      validate: {
        validator: function(v) {
          return v === '' || /^\S+@\S+\.\S+$/.test(v);
        },
        message: 'Please enter a valid email address'
      }
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EmployeeDetail', employeeDetailSchema);
