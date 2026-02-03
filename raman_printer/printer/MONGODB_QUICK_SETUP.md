# MongoDB Quick Setup for Windows

## Option 1: Install MongoDB Locally (5 minutes) ✅ RECOMMENDED

### Step 1: Download MongoDB
1. Go to: https://www.mongodb.com/try/download/community
2. Select:
   - Version: 7.0.x (Latest)
   - Platform: Windows
   - Package: MSI
3. Click "Download"

### Step 2: Install MongoDB
1. Run the downloaded `.msi` file
2. Choose "Complete" installation
3. **IMPORTANT**: Check "Install MongoDB as a Service"
4. **IMPORTANT**: Check "Install MongoDB Compass" (GUI tool)
5. Click "Next" and "Install"

### Step 3: Verify Installation
Open PowerShell and run:
```powershell
mongod --version
```

If you see version info, MongoDB is installed!

### Step 4: Start MongoDB Service
```powershell
# Start MongoDB service
net start MongoDB

# Check if it's running
Get-Service MongoDB
```

### Step 5: Test Your App
```powershell
# Restart your Next.js server
cd d:\PRINTOUT\raman_printer\printer
npm run dev
```

Visit http://localhost:3000/signup and try creating an account!

---

## Option 2: Use MongoDB Atlas (Cloud) ⚠️ Need Credentials

If you want to use Atlas instead:

### Step 1: Get Proper Connection String
1. Go to https://cloud.mongodb.com
2. Login to your account
3. Click "Connect" on your cluster
4. Choose "Drivers" (NOT Atlas SQL)
5. Select: Node.js driver
6. Copy the connection string (looks like below)

### Step 2: Update .env.local
The string should look like:
```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/ramanprints?retryWrites=true&w=majority
```

**Replace:**
- `USERNAME` with your database username
- `PASSWORD` with your database password
- `ramanprints` is your database name

### Step 3: Create Database User (if not exists)
1. In Atlas Dashboard → Database Access
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Username: `ramanprints`
5. Password: Create a strong password
6. Database User Privileges: "Atlas Admin"
7. Click "Add User"

### Step 4: Whitelist Your IP
1. In Atlas Dashboard → Network Access
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (for testing)
4. Click "Confirm"

---

## Quick Check: Is MongoDB Running?

### For Local MongoDB:
```powershell
# Check service status
Get-Service MongoDB

# If not running, start it:
net start MongoDB
```

### For MongoDB Atlas:
Test connection string format:
- ✅ `mongodb+srv://user:pass@cluster.mongodb.net/dbname`
- ❌ `mongodb://atlas-sql...` (This is wrong - SQL interface)

---

## Current Setup (Local MongoDB)

Your `.env.local` is now configured for **local MongoDB**:
```env
MONGODB_URI=mongodb://127.0.0.1:27017/ramanprints
```

### To use this:
1. Install MongoDB (steps above)
2. Start MongoDB service: `net start MongoDB`
3. Restart your app: `npm run dev`
4. Test at http://localhost:3000

---

## Troubleshooting

### Error: "MongooseServerSelectionError"
**Cause**: MongoDB is not running
**Fix**: 
```powershell
net start MongoDB
```

### Error: "auth required"
**Cause**: Wrong connection string or missing credentials
**Fix**: 
- For local: Use `mongodb://127.0.0.1:27017/ramanprints`
- For Atlas: Use proper `mongodb+srv://` with username:password

### MongoDB Service Won't Start
**Fix**:
```powershell
# Create data directory
mkdir C:\data\db

# Start MongoDB manually
mongod --dbpath C:\data\db
```

---

## Next Steps After MongoDB is Running

1. **Start your app**: `npm run dev`
2. **Create account**: http://localhost:3000/signup
3. **Make admin**: Open MongoDB Compass
   - Connect to `mongodb://localhost:27017`
   - Database: `ramanprints`
   - Collection: `users`
   - Find your user
   - Edit: Set `role: "ADMIN"` and `isVerified: true`
4. **Login as admin**: http://localhost:3000/login

---

## Recommended: Use Local MongoDB for Development

- ✅ No internet required
- ✅ Faster
- ✅ No connection issues
- ✅ Free forever
- ✅ Easy to reset/test

Use MongoDB Atlas for production deployment later!
