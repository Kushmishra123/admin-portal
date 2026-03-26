const mongoose = require('mongoose');
const User = require('./models/User');
const EmployeeDetail = require('./models/EmployeeDetail');
const EmployeeLeave = require('./models/EmployeeLeave');
const ManagerData = require('./models/ManagerData');
require('dotenv').config({ path: '.env' });

async function testDelete(employeeId) {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to DB');

    const user = await User.findOne({ employeeId: employeeId.toUpperCase() });
    if (!user) {
      console.log('Employee not found');
      return;
    }

    const Message = require('./models/Message');
    const Notification = require('./models/Notification');

    await EmployeeLeave.deleteMany({ userId: user._id });
    await Message.deleteMany({ $or: [{ senderId: user.employeeId }, { receiverId: user.employeeId }] });
    await Notification.deleteMany({ receiverId: user.employeeId });
    // DONT ACTUALLY DELETE USER YET, JUST TESTING THE QUERIES!
    console.log('Test deletion queries run successfully!');
  } catch (err) {
    console.error('Error during deletion queries:', err);
  } finally {
    mongoose.connection.close();
  }
}

testDelete('QBL-E0004'); // Assuming this exists or returns not found
