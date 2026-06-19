const Folder = require('../models/Folder');
const File = require('../models/File');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { deleteFromStorage } = require('../utils/storage');

// @desc    Get all folders and files for the current folder level
// @route   GET /api/folders/:parentId?
// @access  Private
const getFolderContents = async (req, res) => {
  try {
    const parentId = req.params.parentId === 'root' ? null : (req.params.parentId || null);

    let folderQuery = { parentId };
    if (!parentId) {
      // At the root level, only show folders owned by the current user (My Files)
      folderQuery.ownerId = req.user._id;
    } else {
      // Inside a subfolder, show folders owned by the user OR public to their department (fallback to 'General' to prevent leaks)
      folderQuery.$or = [
        { ownerId: req.user._id },
        { department: req.user.department || 'General', isPublicToDepartment: true }
      ];
    }

    const folders = await Folder.find(folderQuery).sort({ name: 1 });

    let fileQuery = { folderId: parentId };
    if (!parentId) {
      // At the root level, only show files owned by the current user (My Files)
      fileQuery.ownerId = req.user._id;
    } else {
      // Inside a subfolder, show files owned by the user OR public to their department (fallback to 'General' to prevent leaks)
      fileQuery.$or = [
        { ownerId: req.user._id },
        { department: req.user.department || 'General', isPublicToDepartment: true }
      ];
    }

    const files = await File.find(fileQuery).populate('ownerId', 'name role department academicYear').sort({ originalName: 1 });

    let parentFolder = null;
    if (parentId) {
      parentFolder = await Folder.findById(parentId);
      if (!parentFolder) {
        return res.status(404).json({ message: 'Folder not found' });
      }

      // Access control check: allow if owner, admin, or same department and isPublicToDepartment (fallback to 'General' to prevent leaks)
      const isOwner = parentFolder.ownerId.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';
      const isDeptAllowed = parentFolder.isPublicToDepartment && parentFolder.department === (req.user.department || 'General');

      if (!isOwner && !isAdmin && !isDeptAllowed) {
        return res.status(403).json({ message: 'Not authorized to view this folder' });
      }
    }

    res.status(200).json({ folders, files, currentFolder: parentFolder });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new folder
// @route   POST /api/folders
// @access  Private
const createFolder = async (req, res) => {
  try {
    const { name, parentId, deadline } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Folder name is required' });
    }

    const folder = await Folder.create({
      name,
      parentId: parentId || null,
      ownerId: req.user._id,
      deadline: deadline || null,
      department: req.user.department || 'General',
      isPublicToDepartment: req.body.isPublicToDepartment === true || req.body.isPublicToDepartment === 'true'
    });

    res.status(201).json(folder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteFolderRecursive = async (folderId) => {
  // 1. Find and delete all files in this folder level
  const files = await File.find({ folderId });
  for (const file of files) {
    await deleteFromStorage(file.storageName);
    await File.findByIdAndDelete(file._id);
  }

  // 2. Find all subfolders in this folder level
  const subfolders = await Folder.find({ parentId: folderId });
  for (const subfolder of subfolders) {
    await deleteFolderRecursive(subfolder._id);
  }

  // 3. Delete the folder itself
  await Folder.findByIdAndDelete(folderId);
};

// @desc    Delete a folder and its contents
// @route   DELETE /api/folders/:id
// @access  Private
const deleteFolder = async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id);

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    if (folder.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'User not authorized' });
    }

    // Recursively delete folder and all child contents (files & subfolders)
    await deleteFolderRecursive(req.params.id);

    res.status(200).json({ id: req.params.id, message: 'Folder and all contents deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Generate a Drop Folder share link
// @route   POST /api/folders/share/:id
// @access  Private
const generateDropFolderLink = async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id);
    if (!folder) return res.status(404).json({ message: 'Folder not found' });
    
    if (folder.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'User not authorized' });
    }

    // Generate token if not exists
    if (!folder.shareToken) {
      folder.shareToken = crypto.randomBytes(16).toString('hex');
      folder.isDropFolder = true;
      await folder.save();
    }

    res.status(200).json({ shareToken: folder.shareToken });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Drop Folder info publicly
// @route   GET /api/folders/drop/:token
// @access  Public
const getDropFolderInfo = async (req, res) => {
  try {
    const folder = await Folder.findOne({ shareToken: req.params.token, isDropFolder: true })
      .populate('ownerId', 'name');
      
    if (!folder) return res.status(404).json({ message: 'Invalid or expired link' });

    res.status(200).json({
      _id: folder._id,
      name: folder.name,
      ownerName: folder.ownerId.name
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Revoke a Drop Folder link
// @route   PUT /api/folders/:id/revoke
// @access  Private
const revokeDropFolderLink = async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id);
    if (!folder) return res.status(404).json({ message: 'Folder not found' });
    
    if (folder.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'User not authorized' });
    }

    await Folder.updateOne(
      { _id: req.params.id },
      { 
        $unset: { shareToken: "" }, 
        $set: { isDropFolder: false } 
      }
    );

    const updatedFolder = await Folder.findById(req.params.id);
    res.status(200).json(updatedFolder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle folder publish status to department
// @route   PUT /api/folders/:id/publish
// @access  Private
const toggleFolderDepartmentPublish = async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id);
    if (!folder) return res.status(404).json({ message: 'Folder not found' });
    
    if (folder.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'User not authorized' });
    }

    if (!folder.department) {
      folder.department = req.user.department;
    }

    folder.isPublicToDepartment = !folder.isPublicToDepartment;
    await folder.save();

    res.status(200).json(folder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getFolderContents,
  createFolder,
  deleteFolder,
  generateDropFolderLink,
  getDropFolderInfo,
  revokeDropFolderLink,
  toggleFolderDepartmentPublish
};
