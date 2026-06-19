const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Folder = require('./models/Folder');
const File = require('./models/File');
const AuditLog = require('./models/AuditLog');
const Department = require('./models/Department');

const wipeAndSeed = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/File-Sharing';
        await mongoose.connect(mongoURI);

        console.log('Clearing database...');
        await User.deleteMany({});
        await Folder.deleteMany({});
        await File.deleteMany({});
        await AuditLog.deleteMany({});
        await Department.deleteMany({});
        console.log('Database wiped completely.');

        console.log('Seeding default departments...');
        const defaultDepts = [
            { name: 'CSE Department', code: 'CSE', description: 'Computer Science & Engineering Department' },
            { name: 'MCA Department', code: 'MCA', description: 'Master of Computer Applications Department' },
            { name: 'ECE Department', code: 'ECE', description: 'Electronics & Communication Engineering' },
            { name: 'Placement Cell', code: 'PLACEMENT CELL', description: 'Campus Placement & Training Division' },
            { name: 'Examination Cell', code: 'EXAMINATION CELL', description: 'Academic Examinations and Grading Division' },
            { name: 'General Drive', code: 'GENERAL', description: 'General Shared Drive' }
        ];
        await Department.insertMany(defaultDepts);
        console.log('Default departments seeded!');

        console.log('Creating Master Admin...');

        // Pass the raw password; Mongoose pre-save hook will hash it automatically!
        await User.create({
            name: 'Mahalingam S',
            email: 's_mahalingam',
            password: 'MY@9486',
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
