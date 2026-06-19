const http = require('http');
const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const jwt = require('jsonwebtoken');

const testFolders = async () => {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/File-Sharing';
    const jwtSecret = process.env.JWT_SECRET || 'supersecretjwttokenforcampusdrive';
    await mongoose.connect(mongoURI);
    const adminUser = await User.findOne({ email: 's_mahalingam' });
    const token = jwt.sign({ id: adminUser._id }, jwtSecret, { expiresIn: '30d' });

    const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/folders/root',
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token }
    };

    const req = http.request(options, res => {
        console.log(`statusCode: ${res.statusCode}`);
        let body = '';
        res.on('data', d => body += d);
        res.on('end', () => {
            console.log("RESPONSE:", body);
            process.exit(0);
        });
    });
    req.end();
};

testFolders();
