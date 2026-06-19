const mongoose = require('mongoose');
const Department = require('../models/Department');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Seed default departments if none exist
    const count = await Department.countDocuments();
    if (count === 0) {
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
      console.log('Default departments seeded successfully.');
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
