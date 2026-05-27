const mongoose = require('mongoose');
const User = require('./models/User');

const checkDB = async () => {
    await mongoose.connect('mongodb://127.0.0.1:27017/File-Sharing');
    const users = await User.find({});
    console.log("ALL USERS:", users);
    process.exit(0);
};

checkDB();
