const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const createTestUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('test1234', salt);
    
    await mongoose.connection.db.collection('users').updateOne(
      { email: 'test_faculty@gmail.com' },
      { 
        $set: { 
          name: 'Test Faculty',
          email: 'test_faculty@gmail.com',
          password: hashedPassword,
          role: 'faculty',
          department: 'Computer Science',
          isApproved: true
        } 
      },
      { upsert: true }
    );
    
    console.log('Test Faculty user created: test_faculty@gmail.com / test1234');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

createTestUser();
