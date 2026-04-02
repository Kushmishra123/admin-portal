const mongoose = require('mongoose');

const leaveTypeSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  leaveType: { type: String, required: true },
  yearlyQuota: { type: Number, default: 0 },
  used: { type: Number, default: 0 },
  remaining: { type: Number, default: 0 }
}, { timestamps: true, collection: 'leave_type' });

module.exports = mongoose.model('LeaveType', leaveTypeSchema);
