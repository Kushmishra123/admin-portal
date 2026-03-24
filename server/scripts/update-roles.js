/**
 * One-time role migration script
 * Run: node scripts/update-roles.js
 * From the /server directory
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DATABASE_URL;

// ── Role assignments ──────────────────────────────────────────────────────────
// Format: { name (for display), employeeId OR nameMatch, role }
const roleAssignments = [
  // Super Admins
  { nameMatch: 'amit sharma',    role: 'superadmin' },
  { nameMatch: 'kush tester',    role: 'superadmin' },

  // Managers
  { nameMatch: 'jitendra',       role: 'manager' },
  { nameMatch: 'tarun',          role: 'manager' },

  // HR
  { nameMatch: 'hemant',         role: 'hr' },
];

async function run() {
  console.log('\n🔗 Connecting to MongoDB…');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected.\n');

  for (const { nameMatch, role } of roleAssignments) {
    // Case-insensitive name search
    const users = await User.find({ name: { $regex: nameMatch, $options: 'i' } });

    if (users.length === 0) {
      console.warn(`⚠️  No user found matching name: "${nameMatch}"`);
      continue;
    }

    for (const u of users) {
      const oldRole = u.role;
      u.role = role;
      await u.save();
      console.log(`✅ ${u.name} (${u.employeeId})  →  ${oldRole}  →  ${role}`);
    }
  }

  console.log('\n🎉 Done! All roles updated.\n');

  // Print current state
  const allUsers = await User.find({}, 'employeeId name role').sort({ employeeId: 1 });
  console.log('📋 Current roles in DB:');
  allUsers.forEach(u => console.log(`   ${u.employeeId}  ${u.name.padEnd(22)}  ${u.role}`));

  await mongoose.disconnect();
}

run().catch(err => {
  console.error('❌ Script failed:', err.message);
  process.exit(1);
});
