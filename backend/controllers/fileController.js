const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const File = require('../models/File');
const Folder = require('../models/Folder');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const nodemailer = require('nodemailer');
const { classifyFile } = require('../utils/classifier');
const { uploadToStorage, downloadFromStorage, deleteFromStorage } = require('../utils/storage');

// @desc    Upload a new file
// @route   POST /api/files
// @access  Private
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    const { folderId, shareToken } = req.body;

    let targetFolderId = folderId && folderId !== 'root' ? folderId : null;
    
    // If a share token is provided, this is a Drop Folder upload
    if (shareToken) {
      const dropFolder = await Folder.findOne({ shareToken, isDropFolder: true });
      if (!dropFolder) return res.status(404).json({ message: 'Invalid or expired Drop Folder link' });
      targetFolderId = dropFolder._id;
    }

    const documentCategory = classifyFile(req.file.originalname, req.file.mimetype);
    const storageName = `${crypto.randomUUID()}${path.extname(req.file.originalname)}`;

    // Upload to our storage service (cloud or local fallback)
    await uploadToStorage(req.file.buffer, storageName, req.file.mimetype);

    const newFile = await File.create({
      originalName: req.file.originalname,
      storageName: storageName,
      folderId: targetFolderId,
      ownerId: req.user._id,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      category: documentCategory,
      department: req.user.department || 'General',
      isPublicToDepartment: req.body.isPublicToDepartment === true || req.body.isPublicToDepartment === 'true'
    });

    // Create Audit Log
    await AuditLog.create({
      userId: req.user._id,
      action: 'upload',
      entityType: 'file',
      entityId: newFile._id
    });

    res.status(201).json(newFile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Download a file securely
// @route   GET /api/files/download/:id
// @access  Private
const downloadFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Access control check: allow if owner, admin, or same department and isPublicToDepartment (fallback to 'General' to prevent leak if undefined)
    const isOwner = file.ownerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    const isDeptAllowed = file.isPublicToDepartment && file.department === (req.user.department || 'General');

    let isFolderAccessAllowed = false;
    if (file.folderId) {
      const parentFolder = await Folder.findById(file.folderId);
      if (parentFolder) {
        const isFolderOwner = parentFolder.ownerId.toString() === req.user._id.toString();
        const isStaffOrFaculty = req.user.role === 'faculty' || req.user.role === 'staff';
        
        // Folder owner, admins, and faculty/staff have access to files inside the folder
        if (isFolderOwner || isAdmin || isStaffOrFaculty) {
          isFolderAccessAllowed = true;
        }
      }
    }

    if (!isOwner && !isAdmin && !isDeptAllowed && !isFolderAccessAllowed) {
       return res.status(403).json({ message: 'Not authorized to download this file' });
    }

    // Create Audit Log
    await AuditLog.create({
      userId: req.user._id,
      action: 'download',
      entityType: 'file',
      entityId: file._id
    });

    await downloadFromStorage(file.storageName, res, file.originalName);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Generate a File share link
// @route   POST /api/files/share/:id
// @access  Private
const generateFileShareLink = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found' });
    
    let isShareAuthorized = file.ownerId.toString() === req.user._id.toString() || req.user.role === 'admin';
    if (!isShareAuthorized && file.folderId) {
      const parentFolder = await Folder.findById(file.folderId);
      if (parentFolder && parentFolder.ownerId.toString() === req.user._id.toString()) {
        isShareAuthorized = true;
      }
    }

    if (!isShareAuthorized) {
      return res.status(403).json({ message: 'User not authorized' });
    }

    const { expiresHours, downloadLimit } = req.body;

    if (!file.shareToken) {
      file.shareToken = crypto.randomBytes(16).toString('hex');
    }

    if (expiresHours) {
      file.shareExpiresAt = new Date(Date.now() + expiresHours * 60 * 60 * 1000);
    } else {
      file.shareExpiresAt = null;
    }

    if (downloadLimit) {
      file.shareDownloadLimit = parseInt(downloadLimit);
      file.shareDownloadCount = 0;
    } else {
      file.shareDownloadLimit = null;
    }

    await file.save();

    res.status(200).json({ shareToken: file.shareToken });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const downloadSharedFile = async (req, res) => {
  try {
    const file = await File.findOne({ shareToken: req.params.token });
    if (!file) return res.status(404).json({ message: 'Invalid or expired link' });

    // Check expiry
    if (file.shareExpiresAt && new Date() > file.shareExpiresAt) {
      return res.status(403).json({ message: 'This link has expired' });
    }

    // Check download limit
    if (file.shareDownloadLimit && file.shareDownloadCount >= file.shareDownloadLimit) {
      return res.status(403).json({ message: 'Download limit reached for this link' });
    }

    // Increment download count
    file.shareDownloadCount += 1;
    await file.save();

    await downloadFromStorage(file.storageName, res, file.originalName);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get shared file info publicly
// @route   GET /api/files/shared/info/:token
// @access  Public
const getSharedFileInfo = async (req, res) => {
  try {
    const file = await File.findOne({ shareToken: req.params.token }).populate('ownerId', 'name');
    if (!file) return res.status(404).json({ message: 'Invalid or expired link' });

    // Check expiry
    if (file.shareExpiresAt && new Date() > file.shareExpiresAt) {
      return res.status(403).json({ message: 'This link has expired' });
    }

    // Check download limit
    if (file.shareDownloadLimit && file.shareDownloadCount >= file.shareDownloadLimit) {
      return res.status(403).json({ message: 'Download limit reached for this link' });
    }

    res.status(200).json({
      _id: file._id,
      originalName: file.originalName,
      sizeBytes: file.sizeBytes,
      mimeType: file.mimeType,
      isVerified: file.isVerified,
      ownerName: file.ownerId.name,
      createdAt: file.createdAt,
      expiresAt: file.shareExpiresAt,
      downloadLimit: file.shareDownloadLimit,
      downloadCount: file.shareDownloadCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a file
// @route   DELETE /api/files/:id
// @access  Private
const deleteFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found' });
    
    // Check ownership or folder owner/admin
    let isDeleteAuthorized = file.ownerId.toString() === req.user._id.toString() || req.user.role === 'admin';
    if (!isDeleteAuthorized && file.folderId) {
      const parentFolder = await Folder.findById(file.folderId);
      if (parentFolder && parentFolder.ownerId.toString() === req.user._id.toString()) {
        isDeleteAuthorized = true;
      }
    }

    if (!isDeleteAuthorized) {
      return res.status(403).json({ message: 'User not authorized' });
    }

    // Delete from storage (cloud or local fallback)
    await deleteFromStorage(file.storageName);

    await File.findByIdAndDelete(req.params.id);

    // Create Audit Log
    await AuditLog.create({
      userId: req.user._id,
      action: 'delete',
      entityType: 'file',
      entityId: file._id
    });

    res.status(200).json({ message: 'File deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle file publish status to department
// @route   PUT /api/files/:id/publish
// @access  Private
const toggleDepartmentPublish = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found' });
    
    if (file.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'User not authorized' });
    }

    file.isPublicToDepartment = !file.isPublicToDepartment;
    await file.save();

    res.status(200).json(file);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDepartmentFiles = async (req, res) => {
  try {
    const query = { isPublicToDepartment: true };
    // If not admin, restrict to user's department (fallback to 'General' to prevent leak if undefined)
    if (req.user.role !== 'admin') {
      query.department = req.user.department || 'General';
    }

    // Enforce root-level restrictions so nested files and folders don't leak into the root view
    const fileQuery = { ...query, folderId: null };
    const folderQuery = { ...query, parentId: null };

    const files = await File.find(fileQuery).populate('ownerId', 'name role department academicYear').sort({ createdAt: -1 });

    const folders = await Folder.find(folderQuery).populate('ownerId', 'name role department').sort({ name: 1 });

    res.status(200).json({ files, folders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get recent files for the user
// @route   GET /api/files/recent
// @access  Private
const getRecentFiles = async (req, res) => {
  try {
    const files = await File.find({ ownerId: req.user._id })
      .populate('ownerId', 'name role department academicYear')
      .sort({ createdAt: -1 })
      .limit(30);

    res.status(200).json(files);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get files shared by the user
// @route   GET /api/files/shared-by-me
// @access  Private
const getSharedByMeFiles = async (req, res) => {
  try {
    const files = await File.find({ ownerId: req.user._id, shareToken: { $ne: null } })
      .populate('ownerId', 'name role department academicYear')
      .sort({ createdAt: -1 });

    res.status(200).json(files);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Revoke a file share link
// @route   PUT /api/files/:id/revoke
// @access  Private
const revokeFileShareLink = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found' });
    
    if (file.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'User not authorized' });
    }

    await File.updateOne(
      { _id: req.params.id },
      { 
        $unset: { shareToken: "" }, 
        $set: {
          shareExpiresAt: null,
          shareDownloadLimit: null,
          shareDownloadCount: 0
        }
      }
    );

    const updatedFile = await File.findById(req.params.id);
    res.status(200).json(updatedFile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Notify users about a shared file
// @route   POST /api/files/:id/notify
// @access  Private
const notifyUsers = async (req, res) => {
  try {
    const { target } = req.body; // 'department' or 'all'
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found' });
    
    if (file.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'User not authorized' });
    }

    let usersToNotify = [];
    if (target === 'department') {
      usersToNotify = await User.find({ department: req.user.department });
    } else if (target === 'all') {
      usersToNotify = await User.find({});
    }

    // Filter out the uploader
    usersToNotify = usersToNotify.filter(u => u._id.toString() !== req.user._id.toString());
    const emails = usersToNotify.map(u => u.email);

    if (emails.length === 0) {
      return res.status(200).json({ message: 'No other users found to notify.' });
    }

    const mailOptions = {
      from: process.env.EMAIL_USER || 'no-reply@campusdrive.com',
      to: emails,
      subject: `New Document Shared: ${file.originalName}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #3b82f6;">Campus Drive Notification</h2>
          <p>Hello,</p>
          <p>A new document has been shared with you by <strong>${req.user.name}</strong> (${req.user.role}, ${req.user.department} Dept).</p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
            <p style="margin: 0;"><strong>File Name:</strong> ${file.originalName}</p>
            <p style="margin: 5px 0 0 0;"><strong>Target Audience:</strong> ${target === 'all' ? 'All Departments' : 'Your Department'}</p>
          </div>
          <p>Please log in to your Campus Drive to view or download this document.</p>
          <br/>
          <p style="font-size: 12px; color: #64748b;">This is an automated message from the Campus File-Sharing System.</p>
        </div>
      `
    };

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('================ EMAIL SIMULATION ================');
      console.log('To:', emails.join(', '));
      console.log('Subject:', mailOptions.subject);
      console.log('Note: To send real emails, please configure EMAIL_USER and EMAIL_PASS in your .env file.');
      console.log('==================================================');
      return res.status(200).json({ message: `Simulated email sent to ${emails.length} users. Add EMAIL_USER to .env for real emails.` });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: `Email successfully sent to ${emails.length} users.` });

  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ message: 'Failed to send notification email.' });
  }
};

module.exports = {
  uploadFile,
  downloadFile,
  generateFileShareLink,
  downloadSharedFile,
  getSharedFileInfo,
  deleteFile,
  toggleDepartmentPublish,
  getDepartmentFiles,
  getRecentFiles,
  getSharedByMeFiles,
  revokeFileShareLink,
  notifyUsers
};
