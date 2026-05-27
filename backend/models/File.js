const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  originalName: {
    type: String,
    required: true
  },
  storageName: {
    type: String,
    required: true,
    unique: true
  },
  folderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  category: {
    type: String,
    default: 'Uncategorized'
  },
  department: {
    type: String,
    default: 'General'
  },
  academicYear: {
    type: String,
    default: 'All'
  },
  isPublicToDepartment: {
    type: Boolean,
    default: false
  },
  sizeBytes: {
    type: Number,
    required: true
  },
  shareToken: {
    type: String,
    sparse: true,
    unique: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  shareExpiresAt: {
    type: Date,
    default: null
  },
  shareDownloadLimit: {
    type: Number,
    default: null
  },
  shareDownloadCount: {
    type: Number,
    default: 0
  },
}, {
  timestamps: true
});

module.exports = mongoose.model('File', fileSchema);
