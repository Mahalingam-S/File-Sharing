const http = require('http');
const fs = require('fs');
const FormData = require('form-data');
const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const jwt = require('jsonwebtoken');

const testUpload = async () => {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/File-Sharing';
    const jwtSecret = process.env.JWT_SECRET || 'supersecretjwttokenforcampusdrive';
    await mongoose.connect(mongoURI);
    const adminUser = await User.findOne({ role: 'admin' });
    const token = jwt.sign({ id: adminUser._id }, jwtSecret, { expiresIn: '30d' });

    fs.writeFileSync('dummy.txt', 'Hello World!');

    const form = new FormData();
    form.append('file', fs.createReadStream('dummy.txt'));

    const options = {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/files',
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token,
            ...form.getHeaders()
        }
    };

    const req = http.request(options, res => {
        console.log(`UPLOAD statusCode: ${res.statusCode}`);
        let body = '';
        res.on('data', d => body += d);
        res.on('end', () => {
            console.log("UPLOAD RESPONSE:", body);
            process.exit(0);
        });
    });
    
    req.on('error', e => {
        console.error("HTTP ERROR:", e);
        process.exit(1);
    });

    form.pipe(req);
};

testUpload();
