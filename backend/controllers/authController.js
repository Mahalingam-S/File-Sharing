const User = require('../models/User');
const File = require('../models/File');
const Folder = require('../models/Folder');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const fs = require('fs');
const path = require('path');
const { deleteFromStorage } = require('../utils/storage');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// Helper to get user with stats
const getUserData = async (user) => {
  const userFiles = await File.find({ ownerId: user._id });
  const totalUsageBytes = userFiles.reduce((acc, file) => acc + file.sizeBytes, 0);
  const totalFiles = userFiles.length;

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    stats: {
      totalUsageBytes,
      totalFiles,
      formattedUsage: (totalUsageBytes / 1024 / 1024).toFixed(2) + ' MB'
    }
  };
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    let { name, email, password, role, department, rollNo } = req.body;
    email = email?.trim();
    password = password?.trim();

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please add all fields' });
    }

    // Security Check: Prevent anyone from registering as an admin via the public endpoint
    if (role === 'admin') {
      return res.status(403).json({ message: 'You cannot register as an admin.' });
    }

    const normalizedEmail = email.toLowerCase();

    // Domain Restrictions
    if (normalizedEmail === 's_mahalingam') {
      role = 'admin'; // Auto-promote the Master Admin
    } else if (role === 'faculty') {
      // Temporarily use @gmail.com. Later we need to use conditions like @cb.amrita.edu
      if (!normalizedEmail.endsWith('@gmail.com')) {
        return res.status(403).json({ message: 'Faculty must use a @gmail.com email address.' });
      }
      /* 
      if (!normalizedEmail.endsWith('@cb.amrita.edu')) {
        return res.status(403).json({ message: 'Faculty must use a @cb.amrita.edu email address.' });
      }
      */
    } else {
      // Default to student
      role = 'student';
      // Temporarily use @gmail.com. Later we need to use conditions like @cb.students.amrita.edu
      if (!normalizedEmail.endsWith('@gmail.com')) {
        return res.status(403).json({ message: 'Students must use a @gmail.com email address.' });
      }
      /*
      if (!normalizedEmail.endsWith('@cb.students.amrita.edu')) {
        return res.status(403).json({ message: 'Students must use a @cb.students.amrita.edu email address.' });
      }
      */
    }

    // Check if user exists
    const userExists = await User.findOne({ email: normalizedEmail });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const finalRoleValue = role || 'student';
    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      role: finalRoleValue,
      department: department || 'General',
      rollNo: rollNo || null,
      isApproved: !(finalRoleValue === 'faculty' || finalRoleValue === 'staff')
    });

    if (user) {
      if (!user.isApproved) {
        return res.status(403).json({ message: 'Registration successful! Your faculty/staff account is pending admin approval.' });
      }
      const userData = await getUserData(user);
      res.status(201).json({
        ...userData,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    let { email, password } = req.body;
    email = email?.trim();
    password = password?.trim();

    // Check for user email
    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (user && (await user.matchPassword(password))) {
      if (!user.isApproved) {
        return res.status(403).json({ message: 'Your account is pending admin approval.' });
      }
      const userData = await getUserData(user);
      res.json({
        ...userData,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const userFiles = await File.find({ ownerId: req.user._id });
    const totalUsageBytes = userFiles.reduce((acc, file) => acc + file.sizeBytes, 0);
    const totalFiles = userFiles.length;

    res.status(200).json({
      ...req.user.toObject(),
      stats: {
        totalUsageBytes,
        totalFiles,
        formattedUsage: (totalUsageBytes / 1024 / 1024).toFixed(2) + ' MB'
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate with Google
// @route   POST /api/auth/google
// @access  Public
const googleLogin = async (req, res) => {
  try {
    const { credential, role, department, providedName, rollNo } = req.body;
    if (!credential) {
      return res.status(400).json({ message: 'Google credential missing' });
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload.email.toLowerCase();
    const name = payload.name;

    // Check domain restrictions
    let finalRole = role;
    if (email === 's_mahalingam') {
      finalRole = 'admin';
    } else if (finalRole === 'faculty') {
      if (!email.endsWith('@gmail.com')) {
        return res.status(403).json({ message: 'Faculty must use a @gmail.com email address.' });
      }
    } else if (finalRole === 'staff') {
      if (!email.endsWith('@gmail.com')) {
        return res.status(403).json({ message: 'Staff must use a @gmail.com email address.' });
      }
    } else if (finalRole === 'student') {
      if (!email.endsWith('@gmail.com')) {
        return res.status(403).json({ message: 'Students must use a @gmail.com email address.' });
      }
    } else if (!finalRole) {
      // Allow passing without role initially for check
    }

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      if (!user.isApproved) {
        return res.status(403).json({ message: 'Your account is pending admin approval.' });
      }
      // User already exists, log them in
      const userData = await getUserData(user);
      return res.json({
        ...userData,
        token: generateToken(user._id)
      });
    } else {
      // New user
      if (!finalRole || !department) {
        // We need role and department from the user first
        return res.status(202).json({
          requireProfile: true,
          email,
          name,
          message: 'Please complete your profile to continue.'
        });
      }

      // Create user
      const finalRoleValue = finalRole || 'student';
      user = await User.create({
        name: providedName || name,
        email,
        password: 'google-oauth-dummy-password-' + Date.now(),
        role: finalRoleValue,
        department: department || 'General',
        rollNo: rollNo || null,
        isApproved: !(finalRoleValue === 'faculty' || finalRoleValue === 'staff')
      });

      if (!user.isApproved) {
        return res.status(403).json({ message: 'Profile completed! Your faculty/staff account is pending admin approval.' });
      }

      const userData = await getUserData(user);
      return res.status(201).json({
        ...userData,
        token: generateToken(user._id)
      });
    }
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ message: 'Failed to authenticate with Google' });
  }
};

// @desc    Delete current user account
// @route   DELETE /api/auth/me
// @access  Private
const deleteMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Prevent admins from deleting themselves this way to avoid locking out the system
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Admin accounts cannot be deleted via this endpoint.' });
    }

    // Physical file deletion
    const files = await File.find({ ownerId: user._id });
    for (const file of files) {
      await deleteFromStorage(file.storageName);
    }

    // Log the deletion with the reason
    const { reason } = req.body;
    const AuditLog = require('../models/AuditLog');
    await AuditLog.create({
      userId: user._id,
      action: 'delete_account',
      entityType: 'user',
      entityId: user._id,
      details: reason ? `Reason: ${reason}` : 'No reason provided'
    });

    // Delete DB records
    await File.deleteMany({ ownerId: user._id });
    await Folder.deleteMany({ ownerId: user._id });
    await User.findByIdAndDelete(req.user._id);

    res.status(200).json({ message: 'Account and all associated data deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get students in the same department
// @route   GET /api/auth/students
// @access  Private (Faculty/Staff only)
const getDepartmentStudents = async (req, res) => {
  try {
    if (req.user.role !== 'faculty' && req.user.role !== 'staff' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view students' });
    }

    // Only fetch students from the same department
    const students = await User.find({
      role: 'student',
      department: req.user.department
    }).select('-password').sort({ name: 1 });

    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  googleLogin,
  getMe,
  deleteMe,
  getDepartmentStudents
};
