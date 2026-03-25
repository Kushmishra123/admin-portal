const mongoose = require('mongoose');

const ManagerDataSchema = new mongoose.Schema({
  managerId: { type: String, required: true, unique: true },
  managerName: { type: String, required: true },
  employees: [
    {
      employeeId: { type: String },
      employeeName: { type: String },
      email: { type: String },
      role: { type: String }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('ManagerData', ManagerDataSchema);
