const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

const cleanupAdmins = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/File-Sharing';
    await mongoose.connect(mongoURI);
    
    // Demote the test accounts back to student
    await User.updateMany(
      { email: { $in: ['mahal23@gmail.com', 'maha@gmail.com', 'mahal@gmail.com'] } },
      { $set: { role: 'student' } }
    );
    
    console.log(`Demoted test accounts back to student.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

cleanupAdmins();
