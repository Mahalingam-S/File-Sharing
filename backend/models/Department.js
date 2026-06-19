const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a department name'],
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Please add a department code'],
    unique: true,
    trim: true,
    uppercase: true
  },
  description: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Department', departmentSchema);
