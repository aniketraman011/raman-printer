# Setup Guide - Raman Prints

## Prerequisites

- **Node.js** 18 or higher
- **MongoDB** 6+ (local or MongoDB Atlas)
- **Razorpay** account with API keys

## 1. Install Dependencies

```bash
cd printer
npm install
```

## 2. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
# MongoDB
MONGODB_URI=mongodb://127.0.0.1:27017/ramanprints

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-a-random-secret-string

# Razorpay (Live Keys)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret_key
```

> For production, use MongoDB Atlas URI instead of localhost.

## 3. Setup MongoDB

### Option A: Local MongoDB (Recommended for Development)

1. Download and install from [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
2. Install as a Windows service (check the box during installation)
3. Verify it's running:

```powershell
Get-Service MongoDB
```

4. Connection string: `mongodb://127.0.0.1:27017/ramanprints`

### Option B: MongoDB Atlas (Recommended for Production)

1. Create a free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a database user with read/write access
3. Whitelist your IP (or `0.0.0.0/0` for all IPs)
4. Get connection string from Atlas dashboard (looks like: `mongodb+srv://<USERNAME>:<PASSWORD>@<CLUSTER>.mongodb.net/ramanprints`)
5. Update `MONGODB_URI` in `.env.local` with your actual connection string

## 4. Start the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 5. Create Admin Account

1. Sign up through the UI normally
2. Connect to MongoDB and promote the user:

```javascript
// Using mongosh:
use ramanprints
db.users.updateOne(
  { username: "yourusername" },
  { $set: { role: "ADMIN", isVerified: true } }
)
```

Or use the helper script:

```bash
node create-admin.js
```

## 6. Test the Flow

1. **Create a test user** - Sign up at `/signup`
2. **Verify as admin** - Login as admin at `/admin/users` and verify the user
3. **Place an order** - Login as user, go to `/dashboard/new`
4. **Make a payment** - Test Razorpay payment flow
5. **Track order** - Check `/dashboard/history`

## Production Deployment (Vercel)

1. Push code to GitHub
2. Import repo on [vercel.com](https://vercel.com)
3. Add all environment variables (use Atlas URI for `MONGODB_URI`)
4. Set `NEXTAUTH_URL` to your production domain
5. Deploy

## Troubleshooting

| Issue | Solution |
|-------|----------|
| MongoDB won't connect | Check `MONGODB_URI`, ensure MongoDB service is running |
| Login fails | Verify `NEXTAUTH_SECRET` is set, restart dev server |
| Payment fails | Check Razorpay key ID and secret in `.env.local` |
| File upload fails | Ensure `public/uploads/` directory exists |
| Build errors | Run `npm install`, check Node.js version >= 18 |
