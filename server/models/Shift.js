const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    shiftCode: {
      type: String,
      default: '',
      trim: true,
    },
    startTime: {
      type: String,
      default: '',
    },
    endTime: {
      type: String,
      default: '',
    },
    duration: {
      type: String,
      default: '9 Hours',
    },
    overtime: {
      type: String,
      default: '0 hrs (Base)',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Shift', shiftSchema);
