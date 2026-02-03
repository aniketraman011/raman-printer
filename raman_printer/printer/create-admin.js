const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');

// Load environment variables manually
const envContent = fs.readFileSync('.env.local', 'utf8');
const MONGODB_URI = envContent.match(/MONGODB_URI=(.+)/)[1].trim();

const UserSchema = new mongoose.Schema(
  {
    fullName: String,
    whatsappNumber: String,
    year: String,
    username: String,
    password: String,
    role: String,
    isVerified: Boolean,
    isDeleted: Boolean,
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function createAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ username: 'backtowork' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('asdfghjkl', 10);

    // Create admin user
    const admin = await User.create({
      fullName: 'Admin User',
      whatsappNumber: '0000000000',
      year: 'Passout',
      username: 'backtowork',
      password: hashedPassword,
      role: 'ADMIN',
      isVerified: true,
      isDeleted: false,
    });

    console.log('✅ Admin user created successfully!');
    console.log('Username: backtowork');
    console.log('Password: asdfghjkl');
    console.log('\nYou can now login at http://localhost:3000/login');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();
