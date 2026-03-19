require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const User = require('./models/User');

// Setup Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const allowedOrigins = [
  'https://admin-portal-navy-two.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

const corsOptions = {
  origin: function (origin, callback) {
    // If no origin (e.g. server-to-server) or origin is in our allowed list, allow it
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
};

const io = new Server(server, {
  cors: corsOptions
});

app.use(cors(corsOptions));
app.use(express.json());

// Connect to MongoDB
const uri = process.env.MONGO_URI
mongoose.connect(uri)
  .then(() => {
    console.log("✅ Connected to MongoDB – QB_Database");
  })
  .catch(err => {
    console.error("❌ MongoDB connection error:", err.message);
  });

// Seed Initial Superadmin and Admin Database
app.post('/api/auth/seed', async (req, res) => {
  try {
    const existingSuperAdmin = await User.findOne({ employeeId: 'QBL-E0018' });
    if (!existingSuperAdmin) {
      const hashedPassword = await bcrypt.hash('123456', 10);

      const seedUsers = [
        {
          employeeId: 'QBL-E0018',
          name: 'Hemant Yadav',
          email: 'hemant@quisitive.com',
          password: hashedPassword,
          role: 'superadmin',
          initials: 'HY'
        },
        {
          employeeId: 'QBL-M0001',
          name: 'Admin User',
          email: 'admin@quisitive.com',
          password: hashedPassword,
          role: 'superadmin',
          initials: 'AU'
        }
      ];

      await User.insertMany(seedUsers);
      return res.status(200).json({ message: "Seed data inserted successfully" });
    }
    return res.status(200).json({ message: "Seed data already exists" });
  } catch (error) {
    console.error("Seed Error:", error);
    res.status(500).json({ message: "Error seeding data", error: error.message, stack: error.stack });
  }
});

// Signup Route
app.post('/api/auth/signup', async (req, res) => {
  const { employeeId, name, email, password, role, initials } = req.body;

  // ✅ LOG: Raw data received from the frontend
  console.log('\n📩 [SIGNUP] Raw data received from frontend:');
  console.log({
    employeeId,
    name,
    email,
    password: password ? '***hidden***' : undefined,
    role,
    initials
  });

  if (!employeeId || !password || !name) return res.status(400).json({ message: "Please provide employeeId, name and password" });

  try {
    const existingUser = await User.findOne({ employeeId });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      employeeId: employeeId.toUpperCase(),
      name,
      email: email || `${employeeId}@quisitive.com`,
      password: hashedPassword,
      role: role || 'admin',
      initials: initials || name.substring(0, 2).toUpperCase()
    });

    // ✅ LOG: Exact document being sent to MongoDB (before save)
    console.log('\n🗃️  [SIGNUP] Document being saved to MongoDB:');
    console.log({
      employeeId: newUser.employeeId,
      name: newUser.name,
      email: newUser.email,
      password: '[bcrypt hashed]',
      role: newUser.role,
      initials: newUser.initials
    });

    await newUser.save();

    res.status(201).json({
      message: "User created successfully",
      user: {
        employeeId: newUser.employeeId,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        initials: newUser.initials
      }
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error during signup" });
  }
});

// Login Route
app.post('/api/auth/login', async (req, res) => {
  const { employeeId, password } = req.body;
  if (!employeeId || !password) return res.status(400).json({ message: "Employee ID and password are required" });

  try {
    const user = await User.findOne({ employeeId: employeeId.toUpperCase() });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    res.status(200).json({
      message: "Login successful",
      user: {
        employeeId: user.employeeId,
        name: user.name,
        email: user.email,
        role: user.role,
        initials: user.initials
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

// Reset Password Route (requires current password verification)
app.post('/api/auth/reset-password', async (req, res) => {
  const { employeeId, currentPassword, newPassword } = req.body;

  if (!employeeId || !currentPassword || !newPassword) {
    return res.status(400).json({ message: "Employee ID, current password, and new password are required." });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: "New password must be at least 6 characters." });
  }

  try {
    const user = await User.findOne({ employeeId: employeeId.toUpperCase() });

    if (!user) {
      return res.status(404).json({ message: "User not found. Please check your Employee ID." });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect." });
    }

    // Hash and save new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully! Please log in with your new password." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error during password reset." });
  }
});

// Super Admin Reset Password Route (no current password required)
app.post('/api/auth/admin-reset-password', async (req, res) => {
  const { adminEmployeeId, targetEmployeeId, newPassword } = req.body;

  if (!adminEmployeeId || !targetEmployeeId || !newPassword) {
    return res.status(400).json({ message: "Admin ID, target Employee ID, and new password are required." });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: "New password must be at least 6 characters." });
  }

  try {
    // Verify requester is a superadmin
    const adminUser = await User.findOne({ employeeId: adminEmployeeId.toUpperCase() });
    if (!adminUser || adminUser.role !== 'superadmin') {
      return res.status(403).json({ message: "Access denied. Super Admin privileges required." });
    }

    // Find target employee
    const targetUser = await User.findOne({ employeeId: targetEmployeeId.toUpperCase() });
    if (!targetUser) {
      return res.status(404).json({ message: "Target employee not found. Please check the Employee ID." });
    }

    // Hash and save new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    targetUser.password = hashedPassword;
    await targetUser.save();

    res.status(200).json({ message: `Password for ${targetUser.name} (${targetUser.employeeId}) has been reset successfully.` });
  } catch (error) {
    console.error("Admin reset password error:", error);
    res.status(500).json({ message: "Server error during admin password reset." });
  }
});
// Update Own Profile Route 
app.put('/api/auth/update', async (req, res) => {
  const { employeeId, email } = req.body;
  if (!employeeId) return res.status(400).json({ message: "Employee ID is required." });

  // Basic Regex validation
  if (email && !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ message: "Invalid email format." });
  }

  try {
    const user = await User.findOne({ employeeId: employeeId.toUpperCase() });
    if (!user) return res.status(404).json({ message: "User not found." });

    if (email) user.email = email;

    await user.save();

    // Also update EmployeeDetail if it exists
    await EmployeeDetail.findOneAndUpdate(
      { userId: user._id },
      { email }
    );

    res.status(200).json({
      message: "Profile updated successfully.",
      user: {
        employeeId: user.employeeId,
        name: user.name,
        email: user.email,
        role: user.role,
        initials: user.initials
      }
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Server error during profile update." });
  }
});
// ─── ADMIN RESET PASSWORD (RESTful, with activity log) ───────────────────────
// POST /api/admin/reset-password/:employeeId
// Body: { adminEmployeeId, newPassword }
// Only accessible by superadmin. Logs who reset whose password.
app.post('/api/admin/reset-password/:employeeId', async (req, res) => {
  const { employeeId } = req.params;
  const { adminEmployeeId, newPassword } = req.body;

  if (!adminEmployeeId || !newPassword) {
    return res.status(400).json({ message: 'Admin Employee ID and new password are required.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters.' });
  }

  try {
    // ── Step 1: Verify requester is superadmin ──
    const adminUser = await User.findOne({ employeeId: adminEmployeeId.toUpperCase() });
    if (!adminUser || adminUser.role !== 'superadmin') {
      console.warn(`🚫 [ADMIN-RESET] Unauthorised attempt by ${adminEmployeeId} to reset ${employeeId}`);
      return res.status(403).json({ message: 'Access denied. Super Admin privileges required.' });
    }

    // ── Step 2: Find target employee ──
    const targetUser = await User.findOne({ employeeId: employeeId.toUpperCase() });
    if (!targetUser) {
      return res.status(404).json({ message: `Employee ${employeeId.toUpperCase()} not found.` });
    }

    // ── Step 3: Hash & save new password ──
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    targetUser.password = hashedPassword;
    await targetUser.save();

    // ── Step 4: Activity log (console — extend to DB later) ──
    const timestamp = new Date().toISOString();
    console.log(`\n🔑 [ADMIN-RESET] Password Reset Activity Log`);
    console.log(`   Admin   : ${adminUser.name} (${adminUser.employeeId})`);
    console.log(`   Target  : ${targetUser.name} (${targetUser.employeeId})`);
    console.log(`   Time    : ${timestamp}`);
    console.log(`   Status  : SUCCESS`);

    res.status(200).json({
      message: `Password for ${targetUser.name} (${targetUser.employeeId}) has been reset successfully.`,
      resetBy: adminUser.name,
      resetAt: timestamp,
      targetEmployee: {
        employeeId: targetUser.employeeId,
        name: targetUser.name,
        email: targetUser.email
      }
      // ❌ Password is NEVER returned in response
    });
  } catch (error) {
    console.error('❌ [ADMIN-RESET] Error:', error.message);
    res.status(500).json({ message: 'Server error during password reset.' });
  }
});

// ─── GET ALL USERS (FOR CHAT) ────────────────────────────────────────────────
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    const formattedUsers = users.map(u => ({
      id: u.employeeId,
      name: u.name,
      email: u.email,
      role: u.role,
      initials: u.initials
    }));
    res.status(200).json(formattedUsers);
  } catch (error) {
    console.error('❌ [GET-USERS] Error:', error.message);
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
});

const EmployeeDetail = require('./models/EmployeeDetail');
const EmployeeLeave = require('./models/EmployeeLeave');

// ─── ADD EMPLOYEE ROUTE ───────────────────────────────────────────────────────
// Saves to TWO tables:
//   1. users          → employeeId, name, email, password (hashed), role, initials
//   2. employeedetails → everything else, linked to users via userId

app.post('/api/employees/add-employee', async (req, res) => {
  const {
    employeeCode, fullName, email, password,
    designation, department, gender, dob, joinDate,
    assets, docUrl, shiftType, shift, offsPerWeek,
    duration, startTime, endTime, kra, kpa, phone, color
  } = req.body;

  // ── Validation ──
  if (!employeeCode || !fullName || !password) {
    return res.status(400).json({ message: 'employeeCode, fullName and password are required' });
  }

  console.log('\n👤 [ADD-EMPLOYEE] Incoming request:');
  console.log({
    employeeCode, fullName, email,
    password: '***hidden***',
    designation, department, gender, joinDate
  });

  try {
    // ── Step 1: Check if user already exists ──
    const existing = await User.findOne({ employeeId: employeeCode.toUpperCase() });
    if (existing) {
      return res.status(400).json({ message: `Employee with ID ${employeeCode} already exists` });
    }

    // ── Step 2: Hash password ──
    const hashedPassword = await bcrypt.hash(password, 10);
    const initials = fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'EE';
    const resolvedEmail = email || `${fullName.split(' ')[0].toLowerCase()}@quisitive.com`;

    // ── Step 3: Save to USERS table ──
    const newUser = new User({
      employeeId: employeeCode.toUpperCase(),
      name: fullName,
      email: resolvedEmail,
      password: hashedPassword,
      role: 'admin',          // all employees added via portal get 'admin' role
      initials,
    });

    console.log('\n🗃️  [ADD-EMPLOYEE] Saving to USERS table:');
    console.log({
      employeeId: newUser.employeeId,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      initials: newUser.initials,
      password: '[bcrypt hashed]'
    });

    await newUser.save();

    // ── Step 4: Save to EMPLOYEE_DETAILS table (referencing userId) ──
    const bgColors = ['#0f2d1e', '#2d0f1e', '#0f1e2d', '#2d1e0f'];
    const newDetail = new EmployeeDetail({
      userId: newUser._id,
      employeeId: newUser.employeeId,
      designation: designation || '',
      department: department || '',
      gender: gender || '',
      dob: dob || '',
      joinDate: joinDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'Active',
      shiftType: shiftType || 'Fixed',
      shift: shift || 'General',
      offsPerWeek: parseInt(offsPerWeek) || 1,
      duration: duration || '',
      startTime: startTime || '',
      endTime: endTime || '',
      assets: assets || '-',
      docUrl: docUrl || '',
      document: !!docUrl,
      kra: kra || '',
      kpa: kpa || '',
      color: color || bgColors[Math.floor(Math.random() * bgColors.length)],
      phone: phone || '',
    });

    console.log('\n📋 [ADD-EMPLOYEE] Saving to EMPLOYEE_DETAILS table:');
    console.log({
      userId: newDetail.userId,
      employeeId: newDetail.employeeId,
      designation: newDetail.designation,
      department: newDetail.department,
      joinDate: newDetail.joinDate,
      shiftType: newDetail.shiftType,
      shift: newDetail.shift,
    });

    await newDetail.save();

    // ── Step 5: Initialize LEAVE record ──
    try {
      await EmployeeLeave.create({
        userId: newUser._id,
        employeeId: newUser.employeeId,
        employeeName: newUser.name,
        dob: dob || '',
      });
      console.log('📅 [ADD-EMPLOYEE] Initialized LEAVE record');
    } catch (lvErr) {
      console.error('⚠️ [ADD-EMPLOYEE] Failed to init leave record:', lvErr.message);
      // Don't fail the whole request, as the user is already created
    }

    // ── Step 6: Respond ──
    res.status(201).json({
      message: 'Employee added successfully',
      user: {
        _id: newUser._id,
        employeeId: newUser.employeeId,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        initials: newUser.initials,
      },
      details: {
        _id: newDetail._id,
        userId: newDetail.userId,
        employeeId: newDetail.employeeId,
        department: newDetail.department,
        designation: newDetail.designation,
        joinDate: newDetail.joinDate,
        status: newDetail.status,
        shiftType: newDetail.shiftType,
        shift: newDetail.shift,
        assets: newDetail.assets,
      }
    });

  } catch (error) {
    console.error('❌ [ADD-EMPLOYEE] Error:', error.message);

    // Rollback: if user was created but detail failed, remove the user
    try {
      await User.deleteOne({ employeeId: employeeCode.toUpperCase() });
      console.log('🔄 [ADD-EMPLOYEE] Rolled back user creation after detail save failure');
    } catch (rollbackErr) {
      console.error('❌ [ADD-EMPLOYEE] Rollback failed:', rollbackErr.message);
    }

    res.status(500).json({ message: 'Failed to add employee', error: error.message });
  }
});

// ─── GET ALL EMPLOYEES ────────────────────────────────────────────────────────
app.get('/api/employees', async (req, res) => {
  try {
    // Get all employee details, then join with users for name/email/initials
    const details = await EmployeeDetail.find({});
    const userIds = details.map(d => d.userId);
    const users = await User.find({ _id: { $in: userIds } }, '-password');

    // Build a map of userId → user
    const userMap = {};
    users.forEach(u => { userMap[u._id.toString()] = u; });

    const employees = details.map(d => {
      const u = userMap[d.userId.toString()] || {};
      return {
        id: d.employeeId,
        name: u.name || '',
        email: d.email || u.email || '',
        initials: u.initials || '',
        role: u.role || 'admin',
        designation: d.designation,
        department: d.department,
        gender: d.gender,
        dob: d.dob,
        joinDate: d.joinDate,
        status: d.status,
        shiftType: d.shiftType,
        shift: d.shift,
        offs: d.offsPerWeek,
        duration: d.duration,
        startTime: d.startTime,
        endTime: d.endTime,
        assets: d.assets,
        docUrl: d.docUrl,
        document: d.document,
        kra: d.kra,
        kpa: d.kpa,
        color: d.color,
        phone: d.phone,
      };
    });

    res.status(200).json({ employees });
  } catch (error) {
    console.error('❌ [GET-EMPLOYEES] Error:', error.message);
    res.status(500).json({ message: 'Failed to fetch employees', error: error.message });
  }
});

// ─── DELETE EMPLOYEE ─────────────────────────────────────────────────────────
app.delete('/api/employees/:employeeId', async (req, res) => {
  const { employeeId } = req.params;
  try {
    const user = await User.findOne({ employeeId: employeeId.toUpperCase() });
    if (!user) return res.status(404).json({ message: 'Employee not found' });

    await EmployeeDetail.deleteOne({ userId: user._id });
    await User.deleteOne({ _id: user._id });

    res.status(200).json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('❌ [DELETE-EMPLOYEE] Error:', error.message);
    res.status(500).json({ message: 'Failed to delete employee', error: error.message });
  }
});

// ─── UPDATE EMPLOYEE ─────────────────────────────────────────────────────────
app.put('/api/employees/:employeeId', async (req, res) => {
  const { employeeId } = req.params;
  const updateData = req.body;

  try {
    const user = await User.findOne({ employeeId: employeeId.toUpperCase() });
    if (!user) return res.status(404).json({ message: 'Employee not found' });

    // Update User model (name only for now, as it's common to change)
    if (updateData.name) {
      user.name = updateData.name;
      await user.save();
    }

    // Update EmployeeDetail model
    const detailUpdate = {
      designation: updateData.designation,
      department: updateData.department,
      gender: updateData.gender,
      dob: updateData.dob,
      joinDate: updateData.joinDate,
      assets: updateData.assets,
      kra: updateData.kra,
      kpa: updateData.kpa,
      shift: updateData.shift,
      offsPerWeek: updateData.offsPerWeek,
      duration: updateData.duration,
      startTime: updateData.startTime,
      endTime: updateData.endTime,
      docUrl: updateData.docUrl,
      phone: updateData.phone,
      email: updateData.email
    };

    // Remove undefined fields
    Object.keys(detailUpdate).forEach(key => detailUpdate[key] === undefined && delete detailUpdate[key]);

    await EmployeeDetail.findOneAndUpdate({ userId: user._id }, detailUpdate);

    // Update EmployeeLeave model
    await EmployeeLeave.findOneAndUpdate(
      { userId: user._id },
      {
        employeeName: updateData.name,
        dob: updateData.dob
      }
    );

    res.status(200).json({ message: 'Employee updated successfully' });
  } catch (error) {
    console.error('❌ [UPDATE-EMPLOYEE] Error:', error.message);
    res.status(500).json({ message: 'Failed to update employee', error: error.message });
  }
});


// ═══════════════════════════════════════════════════════════════════════════════
// LEAVE ROUTES  (single employee_leave table, referenced to users)
// ═══════════════════════════════════════════════════════════════════════════════

// Helper: leaveType → path inside balance sub-doc
const leaveKey = (type) => ({
  'Casual Leave': 'casual',
  'Sick Leave': 'sick',
  'Annual Leave': 'annual',
  'Emergency Leave': 'emergency',
}[type] || null);

// Helper: get-or-create the employee_leave doc (links to users via userId)
async function getOrCreateLeaveDoc(empId) {
  const user = await User.findOne({ employeeId: empId }, '_id name');
  if (!user) throw new Error(`User ${empId} not found in users table`);

  let doc = await EmployeeLeave.findOne({ employeeId: empId });
  if (!doc) {
    const detail = await EmployeeDetail.findOne({ userId: user._id });
    doc = await EmployeeLeave.create({
      userId: user._id,
      employeeId: empId,
      employeeName: user.name,
      dob: detail ? detail.dob : '',
    });
  }
  return doc;
}

// ── GET /api/leaves/balance/:employeeId ───────────────────────────────────────
// Returns balance section of the employee_leave doc
app.get('/api/leaves/balance/:employeeId', async (req, res) => {
  try {
    const doc = await getOrCreateLeaveDoc(req.params.employeeId.toUpperCase());
    res.status(200).json({ balance: doc.balance, employeeId: doc.employeeId });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch balance', error: err.message });
  }
});

// ── POST /api/leaves/apply ────────────────────────────────────────────────────
// Employee submits a leave request; pushes into requests[] array
app.post('/api/leaves/apply', async (req, res) => {
  const { employeeId, leaveType, from, to, days, reason } = req.body;
  if (!employeeId || !leaveType || !from || !to || !days) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  try {
    const empId = employeeId.toUpperCase();
    const doc = await getOrCreateLeaveDoc(empId);
    const key = leaveKey(leaveType);

    // Validate remaining balance
    if (key) {
      const remaining = doc.balance[key].total - doc.balance[key].used;
      if (Number(days) > remaining) {
        return res.status(400).json({
          message: `Insufficient ${leaveType} balance. Remaining: ${remaining} day(s).`
        });
      }
    }

    // Push the new request into the embedded array
    doc.requests.push({ leaveType, from, to, days: Number(days), reason: reason || '', status: 'Pending' });
    await doc.save();

    const newRequest = doc.requests[doc.requests.length - 1];
    res.status(201).json({ message: 'Leave request submitted', request: newRequest, employeeLeaveId: doc._id });
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit leave', error: err.message });
  }
});

// ── GET /api/leaves/my/:employeeId ───────────────────────────────────────────
// Returns all requests for a single employee (with balance)
app.get('/api/leaves/my/:employeeId', async (req, res) => {
  try {
    const doc = await getOrCreateLeaveDoc(req.params.employeeId.toUpperCase());
    // Sort requests newest first
    const requests = [...doc.requests].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.status(200).json({ requests, balance: doc.balance, employeeName: doc.employeeName });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch leaves', error: err.message });
  }
});

// ── GET /api/leaves/all ───────────────────────────────────────────────────────
// Superadmin: returns ALL requests from ALL employees, flattened
app.get('/api/leaves/all', async (req, res) => {
  try {
    const docs = await EmployeeLeave.find({}).populate('userId', 'name email role');
    // Flatten all embedded requests into a single array
    const allRequests = [];
    docs.forEach(doc => {
      doc.requests.forEach(r => {
        allRequests.push({
          _id: r._id,
          employeeLeaveId: doc._id,   // parent doc id (needed for update)
          employeeId: doc.employeeId,
          employeeName: doc.employeeName,
          leaveType: r.leaveType,
          from: r.from,
          to: r.to,
          days: r.days,
          reason: r.reason,
          status: r.status,
          processedBy: r.processedBy,
          processedAt: r.processedAt,
          createdAt: r.createdAt,
        });
      });
    });
    // Sort newest first
    allRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.status(200).json({ leaves: allRequests });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch all leaves', error: err.message });
  }
});

// ── PATCH /api/leaves/:employeeLeaveId/request/:requestId/status ──────────────
// Superadmin approves or rejects a specific request inside employee_leave doc
app.patch('/api/leaves/:employeeLeaveId/request/:requestId/status', async (req, res) => {
  const { status, processedBy } = req.body;
  if (!['Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ message: 'Status must be Approved or Rejected' });
  }
  try {
    const doc = await EmployeeLeave.findById(req.params.employeeLeaveId);
    if (!doc) return res.status(404).json({ message: 'Employee leave record not found' });

    const request = doc.requests.id(req.params.requestId);
    if (!request) return res.status(404).json({ message: 'Leave request not found' });
    if (request.status !== 'Pending') {
      return res.status(400).json({ message: 'Leave already processed' });
    }

    // If Approved → deduct balance
    if (status === 'Approved') {
      const key = leaveKey(request.leaveType);
      if (key) {
        const remaining = doc.balance[key].total - doc.balance[key].used;
        if (request.days > remaining) {
          return res.status(400).json({
            message: `Cannot approve — employee has only ${remaining} ${request.leaveType} day(s) remaining.`
          });
        }
        doc.balance[key].used += request.days;
      }
    }

    request.status = status;
    request.processedBy = processedBy || '';
    request.processedAt = new Date();
    await doc.save();

    res.status(200).json({ message: `Leave ${status}`, request, balance: doc.balance });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update leave status', error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// CHAT & WEBSOCKET  (Messages)
// ═══════════════════════════════════════════════════════════════════════════════
const Message = require('./models/Message');

const userSocketMap = {}; // Map: employeeId -> socket.id

io.on('connection', (socket) => {
  const employeeId = socket.handshake.query.employeeId;
  if (employeeId) {
    userSocketMap[employeeId] = socket.id;
    io.emit('onlineUsers', Object.keys(userSocketMap)); // Notify everyone who's online
  }

  socket.on('sendMessage', async (data) => {
    try {
      console.log('\n💬 [CHAT] Received sendMessage event:', data);
      const { senderId, receiverId, text } = data;

      const newMessage = new Message({ senderId, receiverId, text });
      console.log('🗃️  [CHAT] Saving message to MongoDB:', { senderId, receiverId, text });
      await newMessage.save();
      console.log('✅ [CHAT] Message saved successfully to DB.');

      const receiverSocketId = userSocketMap[receiverId];
      if (receiverSocketId) {
        console.log(`➡️  [CHAT] Emitting message to receiver socket: ${receiverSocketId}`);
        io.to(receiverSocketId).emit('receiveMessage', newMessage);
      } else {
        console.log(`⚠️  [CHAT] Receiver ${receiverId} is offline.`);
      }

      // Emit back to the sender so it appears on their screen right away
      socket.emit('receiveMessage', newMessage);

      const senderSocketId = userSocketMap[senderId];
      if (senderSocketId && senderSocketId !== socket.id) {
        io.to(senderSocketId).emit('receiveMessage', newMessage);
      }
    } catch (error) {
      console.error('❌ [CHAT] Socket message error:', error);
    }
  });

  socket.on('disconnect', () => {
    if (employeeId) {
      delete userSocketMap[employeeId];
      io.emit('onlineUsers', Object.keys(userSocketMap));
    }
  });
});

app.get('/api/messages/:user1/:user2', async (req, res) => {
  try {
    const { user1, user2 } = req.params;
    console.log(`\n💬 [CHAT] Fetching messages between ${user1} and ${user2}`);

    const messages = await Message.find({
      $or: [
        { senderId: user1, receiverId: user2 },
        { senderId: user2, receiverId: user1 }
      ]
    }).sort({ createdAt: 1 });

    console.log(`✅ [CHAT] Found ${messages.length} messages.`);
    res.status(200).json(messages);
  } catch (error) {
    console.error('❌ [CHAT] Fetch messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.delete('/api/messages/:user1/:user2', async (req, res) => {
  try {
    const { user1, user2 } = req.params;
    const { requesterId, requesterRole } = req.query;

    console.log(`\n💬 [CHAT] Deleting messages between ${user1} and ${user2} (Requested by: ${requesterId}, Role: ${requesterRole})`);

    // Basic Authorization Check
    // A user can delete their own chat, but admins/superadmins can delete any.
    if (!requesterId) {
      return res.status(401).json({ error: 'Unauthorized: No requester ID provided.' });
    }

    if (requesterId !== user1 && requesterId !== user2 && requesterRole !== 'superadmin' && requesterRole !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to delete this chat history.' });
    }

    await Message.deleteMany({
      $or: [
        { senderId: user1, receiverId: user2 },
        { senderId: user2, receiverId: user1 }
      ]
    });

    console.log(`✅ [CHAT] Messages deleted successfully between ${user1} and ${user2}.`);
    res.status(200).json({ message: 'Chat history deleted successfully' });
  } catch (error) {
    console.error('❌ [CHAT] Delete messages error:', error);
    res.status(500).json({ error: 'Failed to delete messages' });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
