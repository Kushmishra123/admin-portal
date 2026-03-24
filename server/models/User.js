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
  // ── RBAC Role ────────────────────────────────────────────────────────────────
  // superadmin: full access + leave approval
  // manager:    own team access, no leave approval
  // hr:         all employees, no leave approval
  // employee:   own data only
  // admin:      legacy alias for "employee" (backward compatible)
  role: {
    type: String,
    enum: ['superadmin', 'manager', 'hr', 'employee', 'admin'],
    default: 'employee',
  },
  initials: {
    type: String,
  },
  policyStatus: {
    type: Boolean,
    default: false,
  },
  // ── Hierarchy ────────────────────────────────────────────────────────────────
  // For employees: their manager's User._id
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  // For managers: array of assigned employee User._ids
  assignedEmployees: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    default: [],
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
