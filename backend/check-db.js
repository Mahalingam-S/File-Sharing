require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const checkDB = async () => {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/File-Sharing';
    await mongoose.connect(mongoURI);
    const users = await User.find({});
    console.log("ALL USERS:", users);
    process.exit(0);
};

checkDB();
