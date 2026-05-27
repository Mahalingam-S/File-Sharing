const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a folder name']
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  shareToken: {
    type: String,
    sparse: true,
    unique: true
  },
  isDropFolder: {
    type: Boolean,
    default: false
  },
  deadline: {
    type: Date,
    default: null
  },
  department: {
    type: String,
    default: 'General'
  },
  isPublicToDepartment: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Folder', folderSchema);
