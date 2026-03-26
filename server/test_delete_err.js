const mongoose = require('mongoose');
const User = require('./models/User');
const EmployeeLeave = require('./models/EmployeeLeave');
require('dotenv').config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const Message = require('./models/Message');
    const Notification = require('./models/Notification');
    const user = await User.findOne({});
    if (!user) return console.log('No user');

    await EmployeeLeave.deleteMany({ userId: user._id });
    await Message.deleteMany({ $or: [{ senderId: user.employeeId }, { receiverId: user.employeeId }] });
    await Notification.deleteMany({ receiverId: user.employeeId });
    require('fs').writeFileSync('err.txt', 'SUCCESS');
  } catch (err) {
    require('fs').writeFileSync('err.txt', err.stack);
  } finally {
    mongoose.connection.close();
  }
}
run();
