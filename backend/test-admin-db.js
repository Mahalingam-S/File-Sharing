const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const File = require('./models/File');
const AuditLog = require('./models/AuditLog');

const testAdminAPI = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/File-Sharing';
    await mongoose.connect(mongoURI);
    
    const totalUsers = await User.countDocuments();
    const totalFiles = await File.countDocuments();
    const files = await File.find({}, 'sizeBytes');
    const totalStorageBytes = files.reduce((acc, file) => acc + file.sizeBytes, 0);

    const logs = await AuditLog.find({}).populate('userId', 'name email role').sort({ createdAt: -1 }).limit(100);

    console.log("Stats API returns:");
    console.log({
      totalUsers,
      totalFiles,
      totalStorageBytes: (totalStorageBytes / 1024 / 1024).toFixed(2) + ' MB'
    });
    
    console.log("\nLogs API returns:");
    console.log(logs);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

testAdminAPI();
