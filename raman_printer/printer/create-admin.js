const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

/**
 * Parse a .env file into an object, handling:
 * - comments (#)
 * - quoted values ("..." or '...')
 * - inline comments after value
 */
function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Environment file not found: ${filePath}\nCopy .env.example to .env.local and fill in your values.`);
  }
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    // Strip wrapping quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    } else {
      // Strip trailing inline comments
      const commentIdx = value.indexOf(' #');
      if (commentIdx !== -1) value = value.slice(0, commentIdx).trim();
    }
    env[key] = value;
  }
  return env;
}

// Load environment variables from .env.local
const envPath = path.resolve(__dirname, '.env.local');
const envVars = parseEnvFile(envPath);
const MONGODB_URI = envVars.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not set in .env.local');
  process.exit(1);
}

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
