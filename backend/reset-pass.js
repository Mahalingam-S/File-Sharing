const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const resetPassword = async () => {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/File-Sharing';
    await mongoose.connect(mongoURI);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('MY@9486', salt);
    
    await User.updateOne({ email: 's_mahalingam' }, { $set: { password: hashedPassword } });
    console.log("Password reset to MY@9486");
    process.exit(0);
};

resetPassword();
