const mongoose = require('mongoose');

// ─── Sub-schema: a single leave request entry ─────────────────────────────────
const leaveRequestSchema = new mongoose.Schema(
  {
    leaveType: {
      type: String,
      required: true,
      enum: ['Casual Leave', 'Sick Leave', 'Annual Leave', 'Emergency Leave'],
    },
    from: { type: String, required: true },  // "YYYY-MM-DD"
    to: { type: String, required: true },  // "YYYY-MM-DD"
    days: { type: Number, required: true },
    reason: { type: String, default: '' },
    status: {
      type: String,
      default: 'Pending',
      enum: ['Pending', 'Approved', 'Rejected'],
    },
    processedBy: { type: String, default: '' },     // superadmin employeeId
    processedAt: { type: Date },
  },
  { timestamps: true }   // gives each request its own createdAt / updatedAt
);

// ─── Main schema: one document per employee ───────────────────────────────────
const employeeLeaveSchema = new mongoose.Schema(
  {
    // ── Reference to the users table ──────────────────────────────────────────
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    // Mirror employeeId for quick lookup without populate
    employeeId: { type: String, required: true, unique: true },
    employeeName: { type: String, default: '' },
    dob: { type: String, default: '' },

    // ── Leave balance ──────────────────────────────────────────────────────────
    balance: {
      casual: { total: { type: Number, default: 8 }, used: { type: Number, default: 0 } },
      sick: { total: { type: Number, default: 10 }, used: { type: Number, default: 0 } },
      annual: { total: { type: Number, default: 15 }, used: { type: Number, default: 0 } },
      emergency: { total: { type: Number, default: 3 }, used: { type: Number, default: 0 } },
    },

    // ── All leave requests for this employee (embedded array) ─────────────────
    requests: [leaveRequestSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('EmployeeLeave', employeeLeaveSchema);
