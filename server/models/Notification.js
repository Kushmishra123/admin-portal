const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  receiverId: {
    type: String, // employeeId of the person receiving the notification
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['policy', 'system', 'leave'],
    default: 'system',
  },
  read: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
