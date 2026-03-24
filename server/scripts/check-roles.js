require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DATABASE_URL;

async function run() {
  await mongoose.connect(MONGO_URI);
  const users = await User.find({}, 'employeeId name role').sort({ employeeId: 1 });
  console.log('\n📋 Current roles:');
  users.forEach(u => {
    console.log(JSON.stringify({ id: u.employeeId, name: u.name, role: u.role }));
  });
  await mongoose.disconnect();
}
run().catch(console.error);
