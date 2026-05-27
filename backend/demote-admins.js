const mongoose = require('mongoose');
const User = require('./models/User');

const cleanupAdmins = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/File-Sharing');
    
    // Demote the test accounts back to student
    await User.updateMany(
      { email: { $in: ['mahal23@gamil.com', 'maha@gamil.com', 'mahal@gamil.com'] } },
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
