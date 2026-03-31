require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
// const nodemailer = require('nodemailer');
const User = require('./models/User');
const Message = require('./models/Message');
const Notification = require('./models/Notification');

const userSocketMap = {}; // Map: employeeId -> socket.id

// Setup Nodemailer transporter
// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS
//   }
// });

const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const allowedOrigins = [
  'https://admin-portal-eg7oz07sb-kushmishra123s-projects.vercel.app',
  'https://admin-portal-navy-two.vercel.app',
  'https://admin-portal-xzc3.onrender.com',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

const corsOptions = {
  origin: function (origin, callback) {
    // If no origin (e.g. server-to-server) or origin is in our allowed list, allow it
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

// ── RBAC Helpers ─────────────────────────────────────────────────────────────
// Normalize legacy 'admin' role to 'employee'
const normalizeRole = (role) => role === 'admin' ? 'employee' : (role || 'employee');

// Roles that have elevated privileges
const isElevated = (role) => ['superadmin', 'manager', 'hr'].includes(normalizeRole(role));

// Middleware: require caller's employeeId passed as query param ?callerId=
// (lightweight, no JWT — consistent with existing pattern)
const requireRole = (...roles) => async (req, res, next) => {
  const callerId = req.query.callerId || req.body.callerId;
  if (!callerId) return res.status(401).json({ message: 'Unauthorized: callerId required' });
  try {
    const caller = await User.findOne({ employeeId: callerId.toUpperCase() });
    if (!caller) return res.status(401).json({ message: 'Unauthorized: caller not found' });
    const callerRole = normalizeRole(caller.role);
    if (!roles.includes(callerRole)) {
      return res.status(403).json({ message: `Forbidden: requires role(s): ${roles.join(', ')}` });
    }
    req.caller = caller;
    req.callerRole = callerRole;
    next();
  } catch (err) {
    res.status(500).json({ message: 'Auth error', error: err.message });
  }
};

// Login Route
app.post('/api/auth/login', async (req, res) => {
  const { employeeId, password } = req.body;
  if (!employeeId || !password) return res.status(400).json({ message: "Employee ID and password are required" });

  try {
    const user = await User.findOne({ employeeId: employeeId.toUpperCase() });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const role = normalizeRole(user.role);

    res.status(200).json({
      message: "Login successful",
      user: {
        employeeId: user.employeeId,
        name: user.name,
        email: user.email,
        role,                              // normalized
        initials: user.initials,
        profileImage: user.profileImage || '',
        policyStatus: user.policyStatus ?? false,
        managerId: user.managerId || null,
        assignedEmployees: user.assignedEmployees || [],
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

// ─── GET Policy Status ─────────────────────────────────────────────────────
app.get('/api/auth/policy-status/:employeeId', async (req, res) => {
  try {
    const user = await User.findOne({ employeeId: req.params.employeeId.toUpperCase() });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ policyStatus: user.policyStatus ?? false });
  } catch (error) {
    console.error('Policy status fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── PATCH Policy Status ───────────────────────────────────────────────────
app.patch('/api/auth/policy-status/:employeeId', async (req, res) => {
  const { policyStatus } = req.body;
  try {
    const user = await User.findOne({ employeeId: req.params.employeeId.toUpperCase() });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Check if transitioning to true
    if (!user.policyStatus && policyStatus === true && req.body.policyStatus) {
      // Find all superadmins to notify
      const superadmins = await User.find({ role: 'superadmin' });
      const messageText = `This employee has read the policy. Name: ${user.name}, Email: ${user.email}`;

      for (const sa of superadmins) {
        // Original chat message code
        const newMessage = new Message({
          senderId: user.employeeId,
          receiverId: sa.employeeId,
          text: messageText,
        });
        await newMessage.save();

        // New system notification code
        const newNotification = new Notification({
          receiverId: sa.employeeId,
          title: 'Policy Acknowledgment',
          message: messageText,
          type: 'policy'
        });
        await newNotification.save();

        // Emit to the superadmin if they are online
        const receiverSocketId = userSocketMap[sa.employeeId];
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('receiveMessage', newMessage);
          io.to(receiverSocketId).emit('newNotification', newNotification);
        }
      }
    }

    user.policyStatus = policyStatus;
    await user.save();
    console.log(`✅ [POLICY] ${user.name} (${user.employeeId}) acknowledged policy: ${policyStatus}`);
    res.status(200).json({ message: 'Policy status updated', policyStatus: user.policyStatus });
  } catch (error) {
    console.error('Policy status update error:', error);
    res.status(500).json({ message: 'Server error' });
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
    // Verify requester is a superadmin or HR
    const adminUser = await User.findOne({ employeeId: adminEmployeeId.toUpperCase() });
    if (!adminUser || (adminUser.role !== 'superadmin' && adminUser.role !== 'hr')) {
      return res.status(403).json({ message: "Access denied. Super Admin or HR privileges required." });
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
// Only accessible by superadmin or hr. Logs who reset whose password.
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
    // ── Step 1: Verify requester is superadmin or hr ──
    const adminUser = await User.findOne({ employeeId: adminEmployeeId.toUpperCase() });
    if (!adminUser || (adminUser.role !== 'superadmin' && adminUser.role !== 'hr')) {
      console.warn(`🚫 [ADMIN-RESET] Unauthorised attempt by ${adminEmployeeId} to reset ${employeeId}`);
      return res.status(403).json({ message: 'Access denied. Super Admin or HR privileges required.' });
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
const ManagerData = require('./models/ManagerData');
const Department = require('./models/Department');
const Shift = require('./models/Shift');

// ─── RECONCILE MANAGER DATA ───────────────────────────────────────────────────
// Removes orphaned employee entries from managerdatas and stale manager entries.
// Called automatically on every GET /api/employees and on-demand via /api/admin/sync-db
async function reconcileManagerData() {
  try {
    const allManagerDocs = await ManagerData.find({});
    for (const mdoc of allManagerDocs) {
      // 1. Check if this manager still exists and is still a manager
      const managerUser = await User.findOne({ employeeId: mdoc.managerId });
      if (!managerUser || normalizeRole(managerUser.role) !== 'manager') {
        await ManagerData.deleteOne({ _id: mdoc._id });
        console.log(`🧹 [SYNC] Removed stale ManagerData entry for ${mdoc.managerId} (no longer a manager or deleted)`);
        continue;
      }

      // 2. Filter out employees who no longer exist or belong to another manager
      const validEmployees = [];
      for (const emp of mdoc.employees) {
        const exists = await User.findOne({ employeeId: emp.employeeId });
        // Employee must exist AND have this manager as their managerId
        if (exists && exists.managerId && exists.managerId.toString() === managerUser._id.toString()) {
          validEmployees.push(emp);
        } else {
          console.log(`🧹 [SYNC] Removing reassigned or orphaned employee ${emp.employeeId} from manager ${mdoc.managerId}'s ManagerData`);
        }
      }

      if (validEmployees.length !== mdoc.employees.length) {
        // ✅ Use updateOne with $set to bypass Mongoose validation on stale docs
        // that may have missing required fields (e.g. managerName) in MongoDB.
        await ManagerData.updateOne(
          { _id: mdoc._id },
          {
            $set: {
              employees: validEmployees,
              managerName: managerUser.name || mdoc.managerName || 'Unknown Manager'
            }
          }
        );
      }

      // 3. Also fix the manager's assignedEmployees array in users collection
      const validUserIds = [];
      for (const emp of validEmployees) {
        const u = await User.findOne({ employeeId: emp.employeeId });
        if (u) validUserIds.push(u._id);
      }
      await User.updateOne({ _id: managerUser._id }, { $set: { assignedEmployees: validUserIds } });
    }
  } catch (err) {
    console.error('⚠️ [SYNC] reconcileManagerData error:', err.message);
  }
}

// ─── POST /api/admin/sync-db ────────────────────�// ─── ASSIGN EMPLOYEES TO MANAGER ─────────────────────────────────────────────
// POST /api/managers/:managerId/assign
// Body: { employeeIds: ['QBL-E0001', ...], callerId: 'QBL-E0018' }
app.post('/api/managers/:managerId/assign', async (req, res) => {
  const { managerId } = req.params;
  const { employeeIds = [], callerId } = req.body;

  // Only superadmin or hr can assign
  if (!callerId) return res.status(401).json({ message: 'callerId required' });
  try {
    const caller = await User.findOne({ employeeId: callerId.toUpperCase() });
    if (!caller || !['superadmin', 'hr'].includes(normalizeRole(caller.role))) {
      return res.status(403).json({ message: 'Forbidden: superadmin or hr required' });
    }

    const manager = await User.findOne({ employeeId: managerId.toUpperCase() });
    if (!manager || normalizeRole(manager.role) !== 'manager') {
      return res.status(400).json({ message: 'Target must be a manager' });
    }

    // Resolve employee DB ObjectIds for the NEW assignment
    const empUsers = await User.find({ employeeId: { $in: employeeIds.map(e => e.toUpperCase()) } });
    const empObjectIds = empUsers.map(u => u._id);

    // ── Step 1: For each employee being assigned, remove them from their PREVIOUS manager ──
    // Find employees that already have a managerId different from this manager
    const employeesWithOtherManager = empUsers.filter(u =>
      u.managerId && u.managerId.toString() !== manager._id.toString()
    );

    for (const emp of employeesWithOtherManager) {
      const prevManager = await User.findById(emp.managerId);
      if (prevManager) {
        // Remove from previous manager's assignedEmployees
        await User.updateOne(
          { _id: prevManager._id },
          { $pull: { assignedEmployees: emp._id } }
        );
        // Remove from previous manager's ManagerData employees array
        await ManagerData.updateOne(
          { managerId: prevManager.employeeId },
          { $pull: { employees: { employeeId: emp.employeeId } } }
        );
        console.log(`🔄 [ASSIGN] Moved ${emp.employeeId} from manager ${prevManager.employeeId} → ${managerId}`);
      }
    }

    // ── Pre-Step 2: Clear managerId for employees being unassigned ──
    const newlyUnassignedObjectIds = (manager.assignedEmployees || [])
      .filter(oldId => !empObjectIds.some(newId => newId.toString() === oldId.toString()));
    if (newlyUnassignedObjectIds.length > 0) {
      await User.updateMany(
        { _id: { $in: newlyUnassignedObjectIds } },
        { $unset: { managerId: 1 } }
      );
    }

    // ── Step 2: Update this manager's assignedEmployees (full replace) ──
    manager.assignedEmployees = empObjectIds;
    await manager.save();

    // ── Step 3: Set managerId on all newly assigned employees ──
    await User.updateMany(
      { _id: { $in: empObjectIds } },
      { $set: { managerId: manager._id } }
    );

    // ── Step 4: REPLACE (not append) ManagerData employees list ──
    const newEmployeesData = empUsers.map(u => ({
      employeeId: u.employeeId,
      employeeName: u.name,
      email: u.email,
      role: u.role
    }));
    await ManagerData.findOneAndUpdate(
      { managerId: manager.employeeId },
      { $set: { employees: newEmployeesData, managerName: manager.name } },
      { upsert: true }
    );

    console.log(`✅ [ASSIGN] ${empObjectIds.length} employee(s) assigned to manager ${managerId}`);
    res.status(200).json({ message: 'Employees assigned to manager', managerId, count: empObjectIds.length });
  } catch (err) {
    console.error('❌ [ASSIGN-MANAGER] Error:', err.message);
    res.status(500).json({ message: 'Failed to assign employees', error: err.message });
  }
});
// ─── GET MANAGERS LIST ────────────────────────────────────────────────────────
app.get('/api/managers', async (req, res) => {
  try {
    const managers = await User.find({ role: 'manager' }, '-password').populate('assignedEmployees', 'employeeId name');
    res.status(200).json({
      managers: managers.map(m => ({
        id: m.employeeId,
        name: m.name,
        email: m.email,
        initials: m.initials,
        assignedEmployees: (m.assignedEmployees || []).map(e => ({ id: e.employeeId, name: e.name })),
      }))
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch managers', error: err.message });
  }
});

// ─── UPDATE USER ROLE ─────────────────────────────────────────────────────────
// POST /api/auth/update-role
// Body: { callerId, targetEmployeeId, role }
app.post('/api/auth/update-role', async (req, res) => {
  const { callerId, targetEmployeeId, role } = req.body;
  const validRoles = ['superadmin', 'manager', 'hr', 'employee'];
  if (!callerId || !targetEmployeeId || !role) return res.status(400).json({ message: 'callerId, targetEmployeeId, role required' });
  if (!validRoles.includes(role)) return res.status(400).json({ message: `role must be one of: ${validRoles.join(', ')}` });
  try {
    const caller = await User.findOne({ employeeId: callerId.toUpperCase() });
    if (!caller || normalizeRole(caller.role) !== 'superadmin') {
      return res.status(403).json({ message: 'Forbidden: superadmin required' });
    }
    const target = await User.findOne({ employeeId: targetEmployeeId.toUpperCase() });
    if (!target) return res.status(404).json({ message: 'Target employee not found' });
    target.role = role;
    await target.save();
    res.status(200).json({ message: `Role updated to ${role} for ${target.name}`, employeeId: target.employeeId, role });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update role', error: err.message });
  }
});

app.post('/api/employees/add-employee', async (req, res) => {
  const {
    employeeCode, fullName, email, password,
    designation, department, gender, dob, joinDate,
    assets, docUrl, shiftType, shift, offsPerWeek,
    duration, startTime, endTime, kra, kpa, phone, color,
    role: assignedRole, managerId: assignedManagerId, profileImage
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
    // ── Step 1: Check if user or detail already exists ──
    const [existingUser, existingDetail] = await Promise.all([
      User.findOne({ employeeId: employeeCode.toUpperCase() }),
      EmployeeDetail.findOne({ employeeId: employeeCode.toUpperCase() })
    ]);

    if (existingUser || existingDetail) {
      const coll = existingUser ? 'System (User)' : 'Database (Detail)';
      return res.status(400).json({
        message: `Employee Code ${employeeCode} is already assigned in ${coll}.`,
        error: `Duplicate Key in ${coll}`
      });
    }

    // ── Step 2: Hash password ──
    const hashedPassword = await bcrypt.hash(password, 10);
    const initials = fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'EE';
    // Use employeeCode in default email to ensure uniqueness
    const resolvedEmail = email || `${fullName.split(' ')[0].toLowerCase()}.${employeeCode.toLowerCase()}@quisitive.com`;

    // ── Step 3: Save to USERS table ──
    // Determine role: use explicit assignedRole if provided, else default to 'employee'
    const validRoles = ['superadmin', 'manager', 'hr', 'employee'];
    const finalRole = validRoles.includes(assignedRole) ? assignedRole : 'employee';

    // Resolve managerId ObjectId if provided
    let managerUser = null;
    let managerObjectId = null;
    if (assignedManagerId) {
      managerUser = await User.findOne({ employeeId: assignedManagerId.toUpperCase() });
      if (managerUser && (normalizeRole(managerUser.role) === 'manager' || managerUser.role === 'superadmin')) {
        managerObjectId = managerUser._id;
      }
    }

    const newUser = new User({
      employeeId: employeeCode.toUpperCase(),
      name: fullName,
      email: resolvedEmail,
      password: hashedPassword,
      role: finalRole,
      initials,
      managerId: managerObjectId,
      profileImage: profileImage || '',
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

    // If role is manager, create an entry in ManagerData
    if (finalRole === 'manager') {
      try {
        await ManagerData.create({
          managerId: newUser.employeeId,
          managerName: newUser.name,
          employees: []
        });
        console.log(`📁 [ADD-EMPLOYEE] Internal ManagerData record created for ${newUser.employeeId}`);
      } catch (mdErr) {
        console.error('⚠️ [ADD-EMPLOYEE] Failed to create ManagerData:', mdErr.message);
      }
    }

    // If assigned to a manager, update the manager's assignedEmployees array
    if (managerObjectId && managerUser) {
      if (!managerUser.assignedEmployees) managerUser.assignedEmployees = [];
      const alreadyAssigned = managerUser.assignedEmployees.some(id => id.toString() === newUser._id.toString());
      if (!alreadyAssigned) {
        managerUser.assignedEmployees.push(newUser._id);
        await managerUser.save();
        console.log(`🔗 [ADD-EMPLOYEE] Linked ${newUser.employeeId} to manager ${managerUser.employeeId}`);

        // Sync with ManagerData collection
        try {
          await ManagerData.findOneAndUpdate(
            { managerId: managerUser.employeeId },
            {
              $push: {
                employees: {
                  employeeId: newUser.employeeId,
                  employeeName: newUser.name,
                  email: newUser.email,
                  role: newUser.role
                }
              }
            },
            { upsert: true }
          );
        } catch (syncErr) {
          console.error('⚠️ [ADD-EMPLOYEE] Failed to sync ManagerData:', syncErr.message);
        }
      }
    }

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

    // (Redundant check removed as it's handled above during initial save block)
    if (false && managerObjectId) {
      // Logic moved to Step 3 block
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

// ─── GET ALL EMPLOYEES (RBAC-scoped) ─────────────────────────────────────────
// Query param: ?callerId=QBL-E0018  (required for non-public context)
// superadmin → all employees
// hr         → all employees
// manager    → only their assignedEmployees
// employee   → only themselves
app.get('/api/employees', async (req, res) => {
  try {
    const callerId = req.query.callerId;

    // Auto-reconcile stale ManagerData entries (fire-and-forget, non-blocking)
    reconcileManagerData().catch(e => console.error('⚠️ [SYNC] Background reconcile failed:', e.message));

    // Determine scope filter
    let scope = null; // null = fetch all
    if (callerId) {
      const caller = await User.findOne({ employeeId: callerId.toUpperCase() });
      if (caller) {
        const callerRole = normalizeRole(caller.role);
        if (callerRole === 'manager') {
          // Only assigned employees
          const assignedIds = caller.assignedEmployees || [];
          scope = { userId: { $in: assignedIds } };
        } else if (callerRole === 'employee') {
          // Only themselves
          scope = { userId: caller._id };
        }
        // superadmin and hr: no filter (all employees)
      }
    }

    // Get employee details (scoped)
    const details = await EmployeeDetail.find(scope || {});
    const userIds = details.map(d => d.userId);
    const users = await User.find({ _id: { $in: userIds } }, '-password');

    // Build a map of userId → user
    const userMap = {};
    users.forEach(u => { userMap[u._id.toString()] = u; });

    // Build a map of manager ObjectId → manager employeeId string (for the managerEmployeeId field)
    const managerObjectIds = [...new Set(users.filter(u => u.managerId).map(u => u.managerId.toString()))];
    const managerUsers = await User.find({ _id: { $in: managerObjectIds } }, 'employeeId');
    const managerIdMap = {}; // ObjectId string → employeeId string
    managerUsers.forEach(m => { managerIdMap[m._id.toString()] = m.employeeId; });

    const employees = details.map(d => {
      const u = userMap[d.userId.toString()] || {};
      const managerObjId = u.managerId ? u.managerId.toString() : null;
      return {
        id: d.employeeId,
        name: u.name || '',
        email: d.email || u.email || '',
        initials: u.initials || '',
        profileImage: u.profileImage || '',
        role: normalizeRole(u.role),
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
        managerId: u.managerId || null,
        managerEmployeeId: managerObjId ? (managerIdMap[managerObjId] || null) : null,
      };
    });

    res.status(200).json({ employees });
  } catch (error) {
    console.error('❌ [GET-EMPLOYEES] Error:', error.message);
    res.status(500).json({ message: 'Failed to fetch employees', error: error.message });
  }
});

// ─── GET COMPANY-WIDE BIRTHDAYS ──────────────────────────────────────────────
app.get('/api/birthdays', async (req, res) => {
  try {
    const details = await EmployeeDetail.find({ status: { $ne: 'Inactive' } }, 'userId employeeId dob color');
    const userIds = details.map(d => d.userId);
    const users = await User.find({ _id: { $in: userIds } }, 'name initials profileImage employeeId role _id');

    const userMap = {};
    users.forEach(u => { userMap[u._id.toString()] = u; });

    const birthdays = details.map(d => {
      const u = userMap[d.userId.toString()] || {};
      return {
        _id: u._id,
        id: d.employeeId,
        employeeId: d.employeeId,
        name: u.name,
        dob: d.dob,
        initials: u.initials,
        profileImage: u.profileImage,
        color: d.color,
        role: u.role ? String(u.role).toLowerCase() : 'employee',
        status: 'Active'
      };
    }).filter(b => b.dob && b.name);

    res.status(200).json({ birthdays });
  } catch (err) {
    console.error('❌ [GET-BIRTHDAYS] Error:', err.message);
    res.status(500).json({ message: 'Failed to fetch birthdays', error: err.message });
  }
});

// ─── DELETE EMPLOYEE ─────────────────────────────────────────────────────────
app.delete('/api/employees/:employeeId', async (req, res) => {
  const { employeeId } = req.params;
  const empIdUpper = employeeId.toUpperCase();
  try {
    const user = await User.findOne({ employeeId: empIdUpper });

    // ── Handle orphaned EmployeeDetail (User deleted but Detail remains) ──
    if (!user) {
      console.warn(`⚠️ [DELETE] User ${empIdUpper} not in users collection — cleaning up orphaned records`);
      const detail = await EmployeeDetail.findOne({ employeeId: empIdUpper });
      if (!detail) {
        return res.status(404).json({ message: 'Employee not found in any collection' });
      }
      // Clean up orphaned EmployeeDetail and leave records
      await EmployeeLeave.deleteMany({ employeeId: empIdUpper });
      await Message.deleteMany({ $or: [{ senderId: empIdUpper }, { receiverId: empIdUpper }] });
      await Notification.deleteMany({ receiverId: empIdUpper });
      // Remove from any ManagerData
      await ManagerData.updateMany({}, { $pull: { employees: { employeeId: empIdUpper } } });
      await EmployeeDetail.deleteOne({ employeeId: empIdUpper });
      console.log(`✅ [DELETE] Orphaned records for ${empIdUpper} fully cleaned`);
      return res.status(200).json({ message: 'Employee deleted successfully' });
    }

    const role = normalizeRole(user.role);

    // ── If deleting a MANAGER: clean up their ManagerData + clear managerId on their team ──
    if (role === 'manager') {
      await ManagerData.deleteOne({ managerId: user.employeeId });
      console.log(`🧹 [DELETE] Removed ManagerData for manager ${user.employeeId}`);
      await User.updateMany(
        { managerId: user._id },
        { $unset: { managerId: '' } }
      );
      console.log(`🧹 [DELETE] Cleared managerId references from employees under ${user.employeeId}`);
    }

    // ── If this employee was assigned to a manager: remove from manager's assignedEmployees + ManagerData ──
    if (user.managerId) {
      await User.updateOne(
        { _id: user.managerId },
        { $pull: { assignedEmployees: user._id } }
      );
      const managerUser = await User.findById(user.managerId);
      if (managerUser) {
        await ManagerData.updateOne(
          { managerId: managerUser.employeeId },
          { $pull: { employees: { employeeId: user.employeeId } } }
        );
      }
      console.log(`🧹 [DELETE] Removed ${user.employeeId} from their manager's team`);
    }

    // ── Delete all associated records ──
    await EmployeeLeave.deleteMany({ userId: user._id });
    await Message.deleteMany({ $or: [{ senderId: user.employeeId }, { receiverId: user.employeeId }] });
    await Notification.deleteMany({ receiverId: user.employeeId });
    await EmployeeDetail.deleteOne({ userId: user._id });
    await User.deleteOne({ _id: user._id });

    console.log(`✅ [DELETE] Employee ${user.employeeId} (${user.name}) fully removed`);
    res.status(200).json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('❌ [DELETE-EMPLOYEE] Error:', error.message, error.stack);
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

    // Update User model fields
    if (updateData.name) {
      user.name = updateData.name;
      // Keep initials in sync
      user.initials = updateData.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }
    if (updateData.email) {
      user.email = updateData.email;
    }
    if (updateData.profileImage !== undefined) {
      user.profileImage = updateData.profileImage;
    }
    await user.save();
    console.log(`✅ [UPDATE-EMPLOYEE] User record updated: ${user.employeeId} (email: ${user.email})`);

    // Update EmployeeDetail model
    const detailUpdate = {
      designation: updateData.designation,
      department: updateData.department,
      gender: updateData.gender,
      dob: updateData.dob !== undefined ? updateData.dob : undefined,
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

    // Update EmployeeLeave model — only update fields that were actually provided
    const leaveUpdate = {};
    if (updateData.name !== undefined) leaveUpdate.employeeName = updateData.name;
    if (updateData.dob  !== undefined) leaveUpdate.dob          = updateData.dob;
    if (Object.keys(leaveUpdate).length > 0) {
      await EmployeeLeave.findOneAndUpdate({ userId: user._id }, leaveUpdate);
    }

    res.status(200).json({
      message: 'Employee updated successfully',
      updatedUser: {
        employeeId: user.employeeId,
        name: user.name,
        email: user.email,
        initials: user.initials,
        profileImage: user.profileImage,
      }
    });
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
// superadmin / hr → ALL employees' requests
// manager         → only assigned employees' requests
// Query param: ?callerId=QBL-E0018
app.get('/api/leaves/all', async (req, res) => {
  try {
    const callerId = req.query.callerId;
    let docs;

    if (callerId) {
      const caller = await User.findOne({ employeeId: callerId.toUpperCase() });
      if (caller && normalizeRole(caller.role) === 'manager') {
        // Manager: only their team's leave docs
        const assignedIds = caller.assignedEmployees || [];
        docs = await EmployeeLeave.find({ userId: { $in: assignedIds } }).populate('userId', 'name email role');
      } else {
        docs = await EmployeeLeave.find({}).populate('userId', 'name email role');
      }
    } else {
      docs = await EmployeeLeave.find({}).populate('userId', 'name email role');
    }

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
// ONLY superadmin can approve or reject — manager/hr/employee are blocked
app.patch('/api/leaves/:employeeLeaveId/request/:requestId/status', async (req, res) => {
  const { status, processedBy } = req.body;
  if (!['Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ message: 'Status must be Approved or Rejected' });
  }
  // Role check: only superadmin may approve/reject
  if (processedBy) {
    try {
      const processor = await User.findOne({ employeeId: processedBy.toUpperCase() });
      if (!processor || normalizeRole(processor.role) !== 'superadmin') {
        return res.status(403).json({ message: 'Forbidden: Only Super Admin can approve or reject leave requests.' });
      }
    } catch (err) {
      return res.status(500).json({ message: 'Auth check failed', error: err.message });
    }
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
// NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════════
app.get('/api/notifications/:employeeId', async (req, res) => {
  try {
    const notifications = await Notification.find({ receiverId: req.params.employeeId.toUpperCase() })
      .sort({ createdAt: -1 })
      .limit(50);
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

app.patch('/api/notifications/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ error: 'Notification not found' });
    notification.read = true;
    await notification.save();
    res.status(200).json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

app.patch('/api/notifications/user/:employeeId/readAll', async (req, res) => {
  try {
    await Notification.updateMany({ receiverId: req.params.employeeId.toUpperCase(), read: false }, { read: true });
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear notifications' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// CHAT & WEBSOCKET  (Messages)
// ═══════════════════════════════════════════════════════════════════════════════

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


// ═══════════════════════════════════════════════════════════════════════════════
// DEPARTMENT ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// ─── GET all departments ──────────────────────────────────────────────────────
app.get('/api/departments', async (req, res) => {
  try {
    const departments = await Department.find({}).sort({ name: 1 });
    res.status(200).json({ departments });
  } catch (err) {
    console.error('❌ [DEPT] Fetch error:', err.message);
    res.status(500).json({ message: 'Failed to fetch departments', error: err.message });
  }
});

// ─── POST add department (hr / superadmin only) ───────────────────────────────
app.post('/api/departments', async (req, res) => {
  const { name, workType, offsPerWeek, callerId } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ message: 'Department name is required' });

  try {
    // Auth check
    if (callerId) {
      const caller = await User.findOne({ employeeId: callerId.toUpperCase() });
      if (!caller || !['hr', 'superadmin'].includes(normalizeRole(caller.role))) {
        return res.status(403).json({ message: 'Forbidden: HR or Super Admin required' });
      }
    }

    const existing = await Department.findOne({ name: name.trim() });
    if (existing) return res.status(400).json({ message: `Department "${name.trim()}" already exists` });

    const dept = await Department.create({
      name: name.trim(),
      workType: workType || 'Fixed',
      offsPerWeek: parseInt(offsPerWeek) || 1,
    });

    console.log(`✅ [DEPT] Created: ${dept.name}`);
    res.status(201).json({ message: 'Department added successfully', department: dept });
  } catch (err) {
    console.error('❌ [DEPT] Create error:', err.message);
    res.status(500).json({ message: 'Failed to add department', error: err.message });
  }
});

// ─── DELETE department ────────────────────────────────────────────────────────
app.delete('/api/departments/:id', async (req, res) => {
  try {
    const dept = await Department.findByIdAndDelete(req.params.id);
    if (!dept) return res.status(404).json({ message: 'Department not found' });
    console.log(`🗑️  [DEPT] Deleted: ${dept.name}`);
    res.status(200).json({ message: 'Department deleted successfully' });
  } catch (err) {
    console.error('❌ [DEPT] Delete error:', err.message);
    res.status(500).json({ message: 'Failed to delete department', error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SHIFT ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// ─── GET all shifts ───────────────────────────────────────────────────────────
app.get('/api/shifts', async (req, res) => {
  try {
    const shifts = await Shift.find({}).sort({ name: 1 });
    res.status(200).json({ shifts });
  } catch (err) {
    console.error('❌ [SHIFT] Fetch error:', err.message);
    res.status(500).json({ message: 'Failed to fetch shifts', error: err.message });
  }
});

// ─── POST add shift (hr / superadmin only) ────────────────────────────────────
app.post('/api/shifts', async (req, res) => {
  const { name, shiftCode, startTime, endTime, duration, overtime, callerId } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ message: 'Shift name is required' });

  try {
    // Auth check
    if (callerId) {
      const caller = await User.findOne({ employeeId: callerId.toUpperCase() });
      if (!caller || !['hr', 'superadmin'].includes(normalizeRole(caller.role))) {
        return res.status(403).json({ message: 'Forbidden: HR or Super Admin required' });
      }
    }

    const existing = await Shift.findOne({ name: name.trim() });
    if (existing) return res.status(400).json({ message: `Shift "${name.trim()}" already exists` });

    const shift = await Shift.create({
      name: name.trim(),
      shiftCode: shiftCode || '',
      startTime: startTime || '',
      endTime: endTime || '',
      duration: duration || '9 Hours',
      overtime: overtime || '0 hrs (Base)',
    });

    console.log(`✅ [SHIFT] Created: ${shift.name}`);
    res.status(201).json({ message: 'Shift added successfully', shift });
  } catch (err) {
    console.error('❌ [SHIFT] Create error:', err.message);
    res.status(500).json({ message: 'Failed to add shift', error: err.message });
  }
});

// ─── DELETE shift ─────────────────────────────────────────────────────────────
app.delete('/api/shifts/:id', async (req, res) => {
  try {
    const shift = await Shift.findByIdAndDelete(req.params.id);
    if (!shift) return res.status(404).json({ message: 'Shift not found' });
    console.log(`🗑️  [SHIFT] Deleted: ${shift.name}`);
    res.status(200).json({ message: 'Shift deleted successfully' });
  } catch (err) {
    console.error('❌ [SHIFT] Delete error:', err.message);
    res.status(500).json({ message: 'Failed to delete shift', error: err.message });
  }
});

// ─── Seed initial departments & shifts ────────────────────────────────────────
// POST /api/admin/seed-departments-shifts
// Idempotent — skips entries that already exist
app.post('/api/admin/seed-departments-shifts', async (req, res) => {
  const defaultDepartments = [
    { name: 'ADMIN (1 offs/wk)', workType: 'Fixed', offsPerWeek: 1 },
    { name: 'Security',          workType: 'Rotational (24/7)', offsPerWeek: 1 },
    { name: 'HR',                workType: 'Fixed', offsPerWeek: 2 },
    { name: 'Design',            workType: 'Fixed', offsPerWeek: 2 },
    { name: 'Quality',           workType: 'Fixed', offsPerWeek: 2 },
    { name: 'Sales',             workType: 'Fixed', offsPerWeek: 2 },
    { name: 'SOC',               workType: 'Rotational (24/7)', offsPerWeek: 1 },
    { name: 'NOC',               workType: 'Rotational (24/7)', offsPerWeek: 1 },
    { name: 'FMS',               workType: 'Rotational (24/7)', offsPerWeek: 1 },
    { name: 'Operations',        workType: 'Fixed', offsPerWeek: 1 },
    { name: 'Marketing',         workType: 'Fixed', offsPerWeek: 2 },
    { name: 'Compliance',        workType: 'Fixed', offsPerWeek: 2 },
    { name: 'CXO',               workType: 'Fixed', offsPerWeek: 2 },
    { name: 'Directorship',      workType: 'Fixed', offsPerWeek: 2 },
  ];

  const defaultShifts = [
    { name: 'None',          shiftCode: 'N',  startTime: '',      endTime: '',      duration: '0 Hours',  overtime: '0 hrs (Base)' },
    { name: 'Morning Shift', shiftCode: 'M',  startTime: '06:00', endTime: '14:00', duration: '8 Hours',  overtime: '0 hrs (Base)' },
    { name: 'Night Shift',   shiftCode: 'NS', startTime: '22:00', endTime: '06:00', duration: '8 Hours',  overtime: '0 hrs (Base)' },
    { name: 'General',       shiftCode: 'G',  startTime: '09:00', endTime: '18:00', duration: '9 Hours',  overtime: '0 hrs (Base)' },
  ];

  try {
    let deptAdded = 0, shiftAdded = 0;

    for (const d of defaultDepartments) {
      const exists = await Department.findOne({ name: d.name });
      if (!exists) { await Department.create(d); deptAdded++; }
    }
    for (const s of defaultShifts) {
      const exists = await Shift.findOne({ name: s.name });
      if (!exists) { await Shift.create(s); shiftAdded++; }
    }

    console.log(`✅ [SEED] Departments added: ${deptAdded}, Shifts added: ${shiftAdded}`);
    res.status(200).json({
      message: `Seeded ${deptAdded} departments and ${shiftAdded} shifts`,
      deptAdded, shiftAdded
    });
  } catch (err) {
    console.error('❌ [SEED] Error:', err.message);
    res.status(500).json({ message: 'Seed failed', error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
