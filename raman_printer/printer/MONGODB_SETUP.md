# 📋 MongoDB Setup Instructions

## Option 1: Local MongoDB (Quick Testing)

### Step 1: Install MongoDB
1. Download from: https://www.mongodb.com/try/download/community
2. Install MongoDB Community Server
3. Use default settings (Port 27017)

### Step 2: Start MongoDB
```bash
# Windows
net start MongoDB

# Or use MongoDB Compass GUI
```

### Step 3: Your Connection String is Already Set
```
MONGODB_URI=mongodb://localhost:27017/raman-prints
```
✅ Already configured in .env.local

---

## Option 2: MongoDB Atlas (Cloud - Recommended)

### Step 1: Create Account
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up (free)
3. Choose FREE tier (M0)

### Step 2: Create Cluster
1. Click "Build a Database"
2. Select FREE tier
3. Choose region closest to you
4. Click "Create"

### Step 3: Setup Access
1. **Database Access**:
   - Create username: `ramanprints`
   - Create password: `yourpassword123`
   - Role: Atlas admin

2. **Network Access**:
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - For production, use specific IPs

### Step 4: Get Connection String
1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy connection string
4. Replace `<password>` with your password

Example:
```
mongodb+srv://ramanprints:yourpassword123@cluster0.xxxxx.mongodb.net/raman-prints?retryWrites=true&w=majority
```

### Step 5: Update .env.local
```env
MONGODB_URI=mongodb+srv://ramanprints:yourpassword123@cluster0.xxxxx.mongodb.net/raman-prints?retryWrites=true&w=majority
```

### Step 6: Restart Server
```bash
# Stop current server (Ctrl+C)
npm run dev
```

---

## Create Admin User

### Method 1: Using MongoDB Compass (GUI)
1. Download MongoDB Compass: https://www.mongodb.com/try/download/compass
2. Connect using your connection string
3. Find `raman-prints` database → `users` collection
4. Find your user and click Edit
5. Change:
   ```json
   {
     "role": "ADMIN",
     "isVerified": true
   }
   ```
6. Save

### Method 2: Using MongoDB Shell
```bash
# Connect to MongoDB
mongosh "your-connection-string"

# Switch to database
use raman-prints

# Update user to admin
db.users.updateOne(
  { username: "yourusername" },
  { $set: { role: "ADMIN", isVerified: true } }
)

# Verify
db.users.findOne({ username: "yourusername" })
```

### Method 3: Using Atlas Web Interface
1. Go to MongoDB Atlas
2. Click "Browse Collections"
3. Find `raman-prints` → `users`
4. Edit document
5. Set `role: "ADMIN"` and `isVerified: true`

---

## Testing Database Connection

### Quick Test
1. Start your app: `npm run dev`
2. Go to http://localhost:3000/signup
3. Register a user
4. Check terminal - should show no MongoDB errors
5. Check MongoDB Compass/Atlas - user should appear in database

### Common Connection Errors

**Error: MongooseServerSelectionError**
```
Fix: Check MongoDB is running (local) or connection string is correct (Atlas)
```

**Error: Authentication failed**
```
Fix: Check username/password in connection string
```

**Error: Network timeout**
```
Fix: Check IP whitelist in Atlas Network Access
```

---

## Database Structure

Once connected, you'll see:

### Database: `raman-prints`

#### Collection: `users`
```javascript
{
  _id: ObjectId("..."),
  fullName: "Student Name",
  whatsappNumber: "9876543210",
  year: "2nd Year",
  username: "student123",
  password: "$2a$10$...",  // Hashed
  role: "USER",
  isVerified: false,
  isDeleted: false,
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

#### Collection: `orders`
```javascript
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),
  fileName: "document.pdf",
  fileUrl: "/uploads/document.pdf",
  pageCount: 10,
  copyCount: 2,
  colorMode: "BW",
  totalAmount: 40,
  status: "PENDING",
  paymentStatus: "PAID",
  razorpayOrderId: "order_xxx",
  razorpayPaymentId: "pay_xxx",
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

---

## Verification Checklist

✅ MongoDB installed/Atlas setup
✅ Connection string in .env.local
✅ Server running without errors
✅ Can register new user
✅ User appears in database
✅ Admin user created
✅ Can login as admin
✅ Can access /admin panel

---

## Production Tips

1. **Security**:
   - Use strong passwords
   - Enable IP whitelisting
   - Use environment variables
   - Enable MongoDB authentication

2. **Performance**:
   - Create indexes on frequently queried fields
   - Use MongoDB Atlas for auto-scaling
   - Monitor database performance

3. **Backup**:
   - Atlas provides automatic backups
   - For local, use `mongodump`

---

## Need Help?

### Check Connection
```bash
# Test if MongoDB is accessible
mongosh "your-connection-string"
```

### View Logs
```bash
# Check app logs
npm run dev

# Check for MongoDB connection logs
```

### Reset Database (if needed)
```javascript
// In MongoDB shell
use raman-prints
db.dropDatabase()
```

---

## You're Ready!

Once MongoDB is connected:
1. ✅ Register users
2. ✅ Make admin
3. ✅ Place orders
4. ✅ Process payments
5. ✅ Track everything

**Database is the only thing you need to setup - everything else is ready!** 🎉
