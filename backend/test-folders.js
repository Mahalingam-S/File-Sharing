const http = require('http');
const mongoose = require('mongoose');
const User = require('./models/User');
const jwt = require('jsonwebtoken');

const testFolders = async () => {
    await mongoose.connect('mongodb://127.0.0.1:27017/File-Sharing');
    const adminUser = await User.findOne({ email: 's_mahalingam@cb.amrita.edu' });
    const token = jwt.sign({ id: adminUser._id }, 'supersecretjwttokenforcampusdrive', { expiresIn: '30d' });

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
