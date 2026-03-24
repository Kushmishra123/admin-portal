/**
 * Targeted role fix — run once from /server directory:
 * node scripts/fix-roles-by-name.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DATABASE_URL;

// Exact name patterns → desired role
const fixes = [
  { match: /amit sharma/i,    role: 'superadmin' },
  { match: /kush tester/i,    role: 'superadmin' },
  { match: /jitendra/i,       role: 'manager' },
  { match: /tarun/i,          role: 'manager' },
  { match: /hemant/i,         role: 'hr' },
];

async function run() {
  await mongoose.connect(MONGO_URI);

  const allUsers = await User.find({});
  const results = [];

  for (const user of allUsers) {
    const match = fixes.find(f => f.match.test(user.name));
    if (match) {
      const prev = user.role;
      user.role = match.role;
      await user.save();
      results.push({ id: user.employeeId, name: user.name, prev, now: match.role });
    }
  }

  // Print clean summary
  results.forEach(r => {
    process.stdout.write(`UPDATED: ${r.id} | ${r.name} | ${r.prev} => ${r.now}\n`);
  });

  // Print all current roles
  const all = await User.find({}, 'employeeId name role').sort({ name: 1 });
  process.stdout.write('\n=== ALL ROLES ===\n');
  all.forEach(u => {
    process.stdout.write(`${u.employeeId} | ${u.name} | ${u.role}\n`);
  });

  await mongoose.disconnect();
}

run().catch(err => {
  process.stderr.write('ERR: ' + err.message + '\n');
  process.exit(1);
});
