const mongoose = require('mongoose');

const sharedLinkSchema = new mongoose.Schema({
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    default: null
  },
  accessLimitRole: {
    type: String,
    enum: ['student', 'faculty', 'admin', 'all'],
    default: 'all'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SharedLink', sharedLinkSchema);
