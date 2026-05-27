const mongoose = require('mongoose');
require('dotenv').config();

const checkUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log('Total Users:', users.length);
    users.forEach(u => {
      console.log(`- ${u.name} (${u.email}) [Role: ${u.role}]`);
    });
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkUsers();
