const mongoose = require('mongoose');
const User = require('./models/User');

const promoteUser = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/File-Sharing');
    const result = await User.updateMany(
      { email: { $in: ['mahal23@gamil.com', 'maha@gamil.com', 'mahal@gamil.com'] } },
      { $set: { role: 'admin' } }
    );
    console.log(`Successfully promoted ${result.modifiedCount} users to Admin.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

promoteUser();
