const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const readline = require('readline');

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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function createAdmin() {
  try {
    console.log('=== Create Admin User ===\n');
    
    const username = await prompt('Enter admin username: ');
    const password = await prompt('Enter admin password (min 8 chars): ');
    const fullName = await prompt('Enter full name: ');
    const whatsappNumber = await prompt('Enter WhatsApp number: ');
    
    if (!username || username.length < 3) {
      console.error('Username must be at least 3 characters');
      process.exit(1);
    }
    
    if (!password || password.length < 8) {
      console.error('Password must be at least 8 characters');
      process.exit(1);
    }
    
    rl.close();
    
    await mongoose.connect(MONGODB_URI);
    console.log('\nConnected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ username: username.toLowerCase() });
    if (existingAdmin) {
      console.log('User with this username already exists');
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create admin user
    const admin = await User.create({
      fullName: fullName || 'Admin User',
      whatsappNumber: whatsappNumber || '0000000000',
      year: 'Passout',
      username: username.toLowerCase(),
      password: hashedPassword,
      role: 'ADMIN',
      isVerified: true,
      isDeleted: false,
    });

    console.log('\n✅ Admin user created successfully!');
    console.log(`Username: ${username.toLowerCase()}`);
    console.log('\nYou can now login at http://localhost:3000/login');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();
