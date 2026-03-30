const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    workType: {
      type: String,
      default: 'Fixed',
      enum: ['Rotational (24/7)', 'Fixed'],
    },
    offsPerWeek: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Department', departmentSchema);
