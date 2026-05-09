const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const uri = 'mongodb+srv://yahav78:yv787878@cluster0.krtudqq.mongodb.net/MeetDrop?appName=Cluster0';

// Define minimal schema just for this script
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: false },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { type: String, default: 'user' },
  isProfileComplete: { type: Boolean, default: true }
}, { strict: false });

const User = mongoose.model('User', userSchema);

async function seedAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('Connected.');

    const username = 'yahav78';
    let admin = await User.findOne({ username });

    if (!admin) {
      console.log('Admin user not found. Creating a new one...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('yv787878', salt);

      admin = new User({
        username,
        email: 'yahav78@admin.network',
        password: hashedPassword,
        firstName: 'Yahav',
        lastName: 'Admin',
        role: 'admin',
        isProfileComplete: true
      });
      await admin.save();
      console.log(`Successfully created new admin user '@yahav78'.`);
    } else {
      console.log('Admin user already exists! Force updating role to admin...');
      admin.role = 'admin';
      await admin.save();
      console.log(`Successfully elevated '@yahav78' to admin.`);
    }

    mongoose.connection.close();
    console.log('Done.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed admin:', error);
    process.exit(1);
  }
}

seedAdmin();
