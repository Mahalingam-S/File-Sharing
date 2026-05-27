const http = require('http');
const jwt = require('jsonwebtoken');

// Generate token manually
require('dotenv').config({ path: '../.env' });
// We need to fetch the admin user from DB
const mongoose = require('mongoose');
const User = require('./models/User');

const testApi = async () => {
    await mongoose.connect('mongodb://127.0.0.1:27017/File-Sharing');
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
        console.log("NO ADMIN FOUND!");
        process.exit(1);
    }
    
    const token = jwt.sign({ id: adminUser._id }, 'supersecretjwttokenforcampusdrive', { expiresIn: '30d' });
    
    // Call stats
    const statsOptions = { hostname: 'localhost', port: 5000, path: '/api/admin/stats', method: 'GET', headers: { 'Authorization': 'Bearer ' + token } };
    const statsReq = http.request(statsOptions, res => {
      console.log(`STATS statusCode: ${res.statusCode}`);
      res.on('data', d => process.stdout.write(d));
      console.log('\n');
    });
    statsReq.end();
    
    // Call logs
    const logsOptions = { hostname: 'localhost', port: 5000, path: '/api/admin/logs', method: 'GET', headers: { 'Authorization': 'Bearer ' + token } };
    const logsReq = http.request(logsOptions, res => {
      console.log(`LOGS statusCode: ${res.statusCode}`);
      res.on('data', d => process.stdout.write(d));
      console.log('\n');
      
      setTimeout(() => process.exit(0), 1000);
    });
    logsReq.end();
};

testApi();
