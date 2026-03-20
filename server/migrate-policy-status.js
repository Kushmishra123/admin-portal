require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  const result = await User.updateMany(
    { policyStatus: { $exists: false } },   // only touch docs that DON'T have the field yet
    { $set: { policyStatus: false } }
  );

  console.log(`✅ Migration done — ${result.modifiedCount} user(s) updated with policyStatus: false`);
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
