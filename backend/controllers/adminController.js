const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const File = require('../models/File');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const sendAccountStatusEmail = async (user, status) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`[Email Simulation] To: ${user.email} | Subject: Account ${status} | Note: Add EMAIL_USER to .env for real emails.`);
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const subject = status === 'approved' 
    ? 'Your Campus Drive Account has been Approved'
    : 'Your Campus Drive Account Request was Rejected';

  const htmlContent = status === 'approved'
    ? `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #10b981;">Account Approved</h2>
        <p>Hello ${user.name},</p>
        <p>Good news! Your request for a <strong>${user.role}</strong> account in the <strong>${user.department}</strong> department has been approved by the admin.</p>
        <p>You can now log in to Campus Drive and access your workspace.</p>
        <br/>
        <p style="font-size: 12px; color: #64748b;">Automated message from Campus Drive.</p>
      </div>`
    : `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #ef4444;">Account Request Rejected</h2>
        <p>Hello ${user.name},</p>
        <p>We're sorry to inform you that your request for a <strong>${user.role}</strong> account has been rejected by the admin.</p>
        <p>If you believe this is a mistake, please contact the IT administration.</p>
        <br/>
        <p style="font-size: 12px; color: #64748b;">Automated message from Campus Drive.</p>
      </div>`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: subject,
    html: htmlContent
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Failed to send status email:', error);
  }
};

// @desc    Get all audit logs (Admin only)
// @route   GET /api/admin/logs
// @access  Private/Admin
const getSystemLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find({})
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(100); // Get latest 100 activities

    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get system statistics (Admin only)
// @route   GET /api/admin/stats
// @access  Private/Admin
const getSystemStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: { $ne: 'admin' } });
    const totalFiles = await AuditLog.countDocuments({ action: 'upload', entityType: 'file' });
    
    // Calculate total storage used
    const files = await File.find({}, 'sizeBytes');
    const totalStorageBytes = files.reduce((acc, file) => acc + file.sizeBytes, 0);

    res.status(200).json({
      totalUsers,
      totalFiles,
      totalStorageBytes: (totalStorageBytes / 1024 / 1024).toFixed(2) + ' MB'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all registered users (Admin only)
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'admin' } }).select('-password').sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get files for a specific user (Admin only)
// @route   GET /api/admin/users/:id/files
// @access  Private/Admin
const getUserFiles = async (req, res) => {
  try {
    const files = await File.find({ ownerId: req.params.id }).sort({ createdAt: -1 });
    res.status(200).json(files);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Clear all audit logs (Admin only)
// @route   DELETE /api/admin/logs
// @access  Private/Admin
const clearLogs = async (req, res) => {
  try {
    await AuditLog.deleteMany({});
    res.status(200).json({ message: 'Audit logs cleared successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an individual audit log (Admin only)
// @route   DELETE /api/admin/logs/:id
// @access  Private/Admin
const deleteLog = async (req, res) => {
  try {
    await AuditLog.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Log deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a user's file (Admin only)
// @route   DELETE /api/admin/files/:id
// @access  Private/Admin
const deleteUserFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    const filePath = path.join(__dirname, '../storage', file.storageName);
    
    // Delete physical file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete database record
    await File.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify a file as an official document (Admin only)
// @route   PATCH /api/admin/files/:id/verify
// @access  Private/Admin
const verifyFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found' });

    file.isVerified = !file.isVerified; // Toggle verification
    await file.save();

    res.status(200).json({ message: `File ${file.isVerified ? 'verified' : 'unverified'} successfully`, file });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a user and all their data (Admin only)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Physical file deletion
    const files = await File.find({ ownerId: user._id });
    for (const file of files) {
      const filePath = path.join(__dirname, '../storage', file.storageName);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    // Delete DB records
    await File.deleteMany({ ownerId: user._id });
    const Folder = require('../models/Folder'); // Assuming not imported globally
    await Folder.deleteMany({ ownerId: user._id });
    
    const wasPending = !user.isApproved;
    await User.findByIdAndDelete(req.params.id);

    if (wasPending && (user.role === 'faculty' || user.role === 'staff')) {
      await sendAccountStatusEmail(user, 'rejected');
    }

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve a pending user (Admin only)
// @route   PATCH /api/admin/users/:id/approve
// @access  Private/Admin
const approveUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isApproved = true;
    await user.save();

    await sendAccountStatusEmail(user, 'approved');

    res.status(200).json({ message: 'User approved successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSystemLogs,
  getSystemStats,
  getAllUsers,
  getUserFiles,
  clearLogs,
  deleteLog,
  deleteUserFile,
  verifyFile,
  deleteUser,
  approveUser
};
