const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const resetPassword = async () => {
    await mongoose.connect('mongodb://127.0.0.1:27017/File-Sharing');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    await User.updateOne({ email: 's_mahalingam@cb.amrita.edu' }, { $set: { password: hashedPassword } });
    console.log("Password reset to password123");
    process.exit(0);
};

resetPassword();
