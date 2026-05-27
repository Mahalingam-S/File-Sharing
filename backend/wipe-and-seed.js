const mongoose = require('mongoose');

const User = require('./models/User');
const Folder = require('./models/Folder');
const File = require('./models/File');
const AuditLog = require('./models/AuditLog');

const wipeAndSeed = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/File-Sharing');

        console.log('Clearing database...');
        await User.deleteMany({});
        await Folder.deleteMany({});
        await File.deleteMany({});
        await AuditLog.deleteMany({});
        console.log('Database wiped completely.');

        console.log('Creating Master Admin...');

        // Pass the raw password; Mongoose pre-save hook will hash it automatically!
        await User.create({
            name: 'Mahalingam S',
            email: 's_mahalingam@cb.amrita.edu',
            password: 'Admin@9486#',
            role: 'admin'
        });

        console.log('Master Admin successfully created!');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

wipeAndSeed();
