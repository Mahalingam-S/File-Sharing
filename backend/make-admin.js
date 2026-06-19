const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

const promoteUser = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/File-Sharing';
    await mongoose.connect(mongoURI);

    // Parse CLI Argument: --email=user@domain.com
    const args = process.argv.slice(2);
    const emailArg = args.find(arg => arg.startsWith('--email='));
    const targetEmail = emailArg ? emailArg.split('=')[1] : null;

    let query = {};
    if (targetEmail) {
      query = { email: targetEmail.toLowerCase() };
      console.log(`Promoting dynamic target email: ${targetEmail}`);
    } else {
      const fallbackEmails = ['mahal23@gmail.com', 'maha@gmail.com', 'mahal@gmail.com'];
      query = { email: { $in: fallbackEmails } };
      console.log(`No --email CLI argument provided. Promoting fallback test accounts: ${fallbackEmails.join(', ')}`);
    }

    const result = await User.updateMany(query, { $set: { role: 'admin' } });
    console.log(`Successfully promoted ${result.modifiedCount} users to Admin.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

promoteUser();
