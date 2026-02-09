# Raman Prints - Student Printing Service

A full-featured web application for student printing services built with Next.js 14, MongoDB, NextAuth.js v5, and Razorpay.

🚀 **Live Demo**: [https://raman-printer.vercel.app/](https://raman-printer.vercel.app/)

## ✨ Features

### For Students
- **🔐 User Registration & Login**: Secure authentication with JWT-based sessions
- **✅ Account Verification**: Admin-verified accounts (prevents unauthorized orders)
- **📄 File Upload**: Support for PDF, DOC, DOCX, and images (10 files max, 100MB total)
- **📊 Real-time Price Calculator**: Instant price calculation for B&W printing + optional services
- **💳 Dual Payment Methods**: Razorpay (online) or Cash on Delivery (COD)
- **📱 Order Tracking**: 4-step progress (Pending → Printing → Ready → Completed)
- **📜 Order History**: View all past orders with status badges
- **📝 Feedback System**: Submit ratings and feedback with admin responses
- **👤 Profile Management**: View/edit account details
- **🌓 Dark Mode**: System-wide dark theme support
- **🔔 Order Cancellation**: Request cancellation with admin approval

### For Admins
- **📊 Analytics Dashboard**: 
  - Total Orders (permanent counter - never decreases)
  - Recent Orders (24h - survives deletion)
  - Today's Orders (survives deletion)
  - Pending/Completed/Cancelled orders
  - Total Revenue (cumulative)
  - User statistics (verified/pending)
- **🔄 Reset Dashboard**: Recalculate all stats from current data
- **📦 Order Management**: 
  - Update order status (4-step workflow)
  - Update payment status
  - Delete orders (with file cleanup)
  - View order details with user info
  - Search & filter by status, payment, date
- **👥 User Management**: 
  - Verify new users
  - Soft delete/restore accounts
  - Search by name/phone/username
  - Filter by year and verification status
  - Hidden admin users from list
- **💬 Feedback Management**: 
  - View all user feedback with ratings
  - Reply to feedback
  - Delete feedback
- **⚙️ Settings Control**: 
  - Toggle COD availability
  - Manage service items (pricing & availability)
  - Dynamic price per page
  - Revenue visibility toggle

## 🛠️ Tech Stack

- **Framework**: Next.js 14.2.35 (App Router, Server Actions, Server Components)
- **Styling**: Tailwind CSS 3 (Mobile-First, Responsive, Dark Mode)
- **Icons**: Lucide React
- **Backend**: Next.js API Routes + Server Actions
- **Database**: MongoDB 6+ with Mongoose ODM
- **Authentication**: NextAuth.js v5 (JWT Strategy)
- **Payments**: Razorpay (Live Mode Ready)
- **File Storage**: Local file system (`public/uploads/`)
- **PDF Parsing**: pdf-parse (auto page count detection)
- **TypeScript**: Full type safety across codebase

## 📁 Project Structure

```
printer/
├── app/
│   ├── actions/              # Server actions
│   │   ├── user.ts           # User CRUD, admin stats
│   │   ├── order.ts          # Order CRUD, status updates
│   │   └── settings.ts       # Settings management
│   ├── api/                  # API routes
│   │   ├── auth/             # NextAuth handlers
│   │   ├── order/            # Order creation, cancellation
│   │   ├── razorpay/         # Payment verification
│   │   ├── upload/           # File upload with validation
│   │   ├── settings/         # Settings CRUD
│   │   ├── feedback/         # Feedback submission
│   │   └── admin/            # Admin-only endpoints
│   │       ├── order/        # Order management
│   │       ├── stats/        # Dashboard stats & reset
│   │       └── feedback/     # Feedback replies & deletion
│   ├── admin/                # Admin panel
│   │   ├── layout.tsx        # Admin layout with nav
│   │   ├── page.tsx          # Dashboard with stats
│   │   ├── orders/           # Order management
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── users/page.tsx    # User management
│   │   ├── feedback/page.tsx # Feedback management
│   │   └── settings/page.tsx # App settings
│   ├── dashboard/            # User dashboard
│   │   ├── layout.tsx        # User layout with nav
│   │   ├── page.tsx          # Order summary
│   │   ├── new/page.tsx      # New order form
│   │   ├── history/page.tsx  # Order history
│   │   ├── profile/page.tsx  # User profile
│   │   └── feedback/page.tsx # Submit feedback
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Landing page
│   └── globals.css           # Global styles + animations
├── components/               # Reusable components
│   ├── AdminNav.tsx          # Admin navigation
│   ├── AdminOrderTable.tsx   # Order management table
│   ├── AdminUserTable.tsx    # User management table
│   ├── DashboardNav.tsx      # User navigation
│   ├── OrderCard.tsx         # Order display card
│   ├── PriceCalculator.tsx   # Instant price calculator
│   ├── ServiceSelector.tsx   # Additional services selector
│   ├── ThemeProvider.tsx     # Dark mode provider
│   └── ThemeToggle.tsx       # Theme switcher button
├── lib/                      # Utilities
│   ├── db.ts                 # MongoDB connection (cached)
│   └── constants.ts          # Pricing, status colors, helpers
├── models/                   # Mongoose models
│   ├── User.ts               # User schema (soft delete)
│   ├── Order.ts              # Order schema
│   ├── OrderLog.ts           # Permanent order tracking
│   ├── Settings.ts           # App settings & counters
│   └── Feedback.ts           # User feedback
├── types/                    # TypeScript types
│   └── next-auth.d.ts        # NextAuth type extensions
├── public/
│   └── uploads/              # Uploaded files
├── auth.ts                   # NextAuth configuration
├── middleware.ts             # Route protection
├── tailwind.config.ts        # Tailwind + animations
├── .env.local                # Environment variables
└── package.json
```

## 🗄️ Database Schema

### User Model
```typescript
{
  fullName: String (Required, trim)
  whatsappNumber: String (Required, trim)
  year: Enum ["1st Year", "2nd Year", "3rd Year", "4th Year", "Passout"] (Required)
  username: String (Unique, Required, lowercase, trim)
  password: String (Bcrypt hashed, Required)
  role: Enum ["USER", "ADMIN"] (Default: USER)
  isVerified: Boolean (Default: false) // Admin manually verifies
  isDeleted: Boolean (Default: false)  // Soft delete only
  createdAt: Date (Auto)
  updatedAt: Date (Auto)
}
```

### Order Model
```typescript
{
  userId: ObjectId (Ref: User, Required)
  files: [{
    fileName: String (Required)
    fileUrl: String (Required)
    fileSize: Number (Required)
  }]
  serviceItems: [{
    name: String (Required)
    price: Number (Required)
    quantity: Number (Required, min: 1)
  }]
  totalAmount: Number (Required)
  paymentMethod: Enum ["RAZORPAY", "COD"] (Required)
  status: Enum ["PENDING", "PRINTING", "READY", "COMPLETED", "CANCELLED"] (Default: PENDING)
  paymentStatus: Enum ["PENDING", "PAID", "UNPAID", "FAILED"] (Default: PENDING)
  razorpayOrderId: String (Optional)
  razorpayPaymentId: String (Optional)
  cancelRequested: Boolean (Default: false)
  cancelRequestedAt: Date (Optional)
  cancelApprovedByAdmin: Boolean (Default: false)
  printSide: Enum ["SINGLE", "DOUBLE"] (Default: SINGLE, Required)
  message: String (Optional, trim)
  createdAt: Date (Auto)
  updatedAt: Date (Auto)
}
```

### OrderLog Model (NEW - Permanent Tracking)
```typescript
{
  orderId: ObjectId (Ref: Order, Required, Unique)
  totalAmount: Number (Required)
  createdAt: Date (Required, Indexed)
}
// Purpose: Permanent record of all orders (survives deletion)
// Used for: Total Orders, Recent 24h, Today's count
```

### Settings Model
```typescript
{
  isCodEnabled: Boolean (Default: true)
  serviceItems: [{
    name: String (Required)
    price: Number (Required, min: 0)
    isAvailable: Boolean (Default: true)
  }]
  // Permanent counters (never decrease on deletion)
  totalOrders: Number (Default: 0)
  completedOrders: Number (Default: 0)
  cancelledOrders: Number (Default: 0)
  totalRevenue: Number (Default: 0)
  createdAt: Date (Auto)
  updatedAt: Date (Auto)
}
```

### Feedback Model
```typescript
{
  userId: ObjectId (Ref: User, Required)
  message: String (Required, trim)
  rating: Number (1-5, Optional)
  adminReply: String (Optional, trim)
  adminRepliedAt: Date (Optional)
  createdAt: Date (Auto)
  updatedAt: Date (Auto)
}
```

## 💰 Pricing

- **Black & White Printing**: ₹2 per page (configurable via Settings)
- **Additional Services**: Lamination, Binding, Spiral Binding, etc. (admin-managed)
- **Formula**: Total = (Pages × Price × Copies) + (Service Items)

## 🔐 Authentication & Authorization

### User Flow
- **Registration**: Anyone can signup with full name, WhatsApp number, year, username, password
- **Verification**: Admin must verify account before user can place orders
- **Login**: JWT-based session (30-day expiry)
- **Session Extension**: `role`, `username`, `isVerified` added to session via callbacks

### Role-Based Access Control
| Role | Access |
|------|--------|
| **USER** | Dashboard, New Order (if verified), Order History, Profile, Feedback |
| **ADMIN** | Admin Panel, Order Management, User Management, Feedback Management, Settings |

### Route Protection (Middleware)
- `/dashboard/*` → Requires authentication
- `/admin/*` → Requires authentication + ADMIN role
- Deleted users automatically logged out (session invalidated)

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ 
- MongoDB 6+ (local or Atlas)
- Razorpay account (for payment integration)

### Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd printer
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create `.env.local`:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/raman-prints

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-change-in-production

# Razorpay (Live Mode)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret_key
```

4. **Run MongoDB** (if using local MongoDB)
```bash
mongod
```

5. **Run the development server**
```bash
npm run dev
```

6. **Open your browser**
```
http://localhost:3000
```

## 🎯 Usage

### Creating an Admin Account

**Option 1: Via MongoDB Shell**
```javascript
// 1. Signup normally via UI
// 2. Connect to MongoDB:
mongosh

// 3. Switch to database:
use raman-prints

// 4. Promote user to admin:
db.users.updateOne(
  { username: "yourusername" },
  { $set: { role: "ADMIN", isVerified: true } }
)
```

**Option 2: Using Script**
```bash
node create-admin.js
# Follow prompts to enter username
```

### User Workflow
1. **Signup** → Fill registration form
2. **Wait** → Admin verifies account
3. **Login** → Access dashboard
4. **New Order** → Upload files (max 10, 100MB total), add services, calculate price
5. **Choose Payment** → Razorpay or COD
6. **Pay** → Complete payment (if Razorpay)
7. **Track** → Monitor order status in Order History
8. **Pickup** → Collect order when status = READY
9. **Feedback** → Submit rating and feedback

### Admin Workflow
1. **Login** → Access admin panel
2. **Verify Users** → Go to Users → Verify pending accounts
3. **Manage Orders** → 
   - View all orders with search/filter
   - Update status: PENDING → PRINTING → READY → COMPLETED
   - Update payment status for COD orders
   - Delete unwanted orders
4. **View Feedback** → Reply to user feedback, delete spam
5. **Settings** → 
   - Toggle COD on/off
   - Add/edit service items
   - Adjust pricing
6. **Reset Dashboard** → Click "Reset Stats" to recalculate counters

## 🚀 Deployment

### Vercel (Recommended)

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo>
git push -u origin main
```

2. **Deploy on Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables (MONGODB_URI, NEXTAUTH_URL, NEXTAUTH_SECRET, Razorpay keys)
   - Deploy

3. **Set Production URL**
   - Update `NEXTAUTH_URL` in Vercel env vars to your production URL

### MongoDB Atlas Setup
1. Create cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Whitelist Vercel IPs (or use 0.0.0.0/0 for all IPs)
3. Create database user
4. Get connection string
5. Replace `MONGODB_URI` in Vercel environment variables

## 🎨 Design System

### Colors
- **Primary**: Indigo (#4f46e5)
- **Success**: Green (#10b981)
- **Warning**: Yellow (#f59e0b)
- **Danger**: Red (#ef4444)
- **Backgrounds**: 
  - Light: #ffffff, #f8fafc
  - Dark: #1f2937, #111827

### Typography
- **Font**: Inter (System Font Stack)
- **Headings**: Bold, 2xl-3xl
- **Body**: Regular, base-sm

### Animations
- fadeIn, slideUp, scaleIn
- Smooth transitions (200-300ms)
- Hover effects on interactive elements

### Components
- **Cards**: Rounded-2xl, shadow-md, hover:shadow-lg
- **Buttons**: Rounded-lg, font-medium, transition-colors
- **Forms**: Focus rings, validation colors
- **Tables**: Striped rows, responsive overflow
- **Badges**: Rounded-full, status-based colors

## 🛡️ Security

- **Password Hashing**: Bcrypt (10 rounds)
- **Session Management**: JWT with 30-day expiry
- **CSRF Protection**: NextAuth built-in
- **Input Validation**: Server-side validation on all endpoints
- **File Upload**: Type and size validation (max 20MB per file, 100MB total)
- **Soft Delete**: Users never hard-deleted (maintains order references)
- **Route Protection**: Middleware + session checks
- **Admin Verification**: Prevents unauthorized users from placing orders

## 📊 Admin Dashboard Counters

### Permanent Counters (Never Decrease)
| Counter | Source | Behavior |
|---------|--------|----------|
| **Total Orders** | Settings.totalOrders | Increments on new order, never decreases |
| **Recent Orders (24h)** | OrderLog collection | Counts orders created in last 24 hours, survives deletion |
| **Today (+X)** | OrderLog collection | Counts orders created today, survives deletion |
| **Total Revenue** | Settings.totalRevenue | Cumulative, never decreases |

### Dynamic Counters
- **Pending Orders**: Current orders with PENDING/PRINTING status
- **Completed Orders**: Settings counter (permanent)
- **Cancelled Orders**: Settings counter (permanent)
- **Verified Users**: Current count of verified users
- **Pending Verifications**: Current count of unverified users

### Reset Dashboard
- Click "Reset Stats" to recalculate all Settings counters from current Order/OrderLog data
- Useful after data cleanup or migration

## 🔧 Troubleshooting

### Cannot Place Order
- **Issue**: User account not verified
- **Solution**: Admin must verify account in User Management

### Payment Failed
- **Issue**: Razorpay keys incorrect or expired
- **Solution**: Check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables

### Orders Not Showing
- **Issue**: Database connection failed
- **Solution**: Check MONGODB_URI in .env.local, ensure MongoDB is running

### Deleted User Still Logged In
- **Issue**: Session not invalidated
- **Solution**: Middleware auto-logs out deleted users on next page load

### File Upload Fails
- **Issue**: File too large or invalid type
- **Solution**: 
  - Max 10 files per upload
  - Max 20MB per file
  - Total max 100MB
  - Supported: PDF, DOC, DOCX, JPG, PNG, GIF, WEBP

## 📝 License

MIT License - Feel free to use for commercial or personal projects

## 👤 Author

**Raman Prints**
- Built for student printing services
- Contact: [Your Contact Info]

## 🙏 Acknowledgments

- Next.js Team
- Vercel
- MongoDB
- Razorpay
- Tailwind CSS
- Lucide Icons

## 🔐 Authentication & Authorization

- **User Registration**: Anyone can signup, but admin must verify before placing orders
- **Role-Based Access**: 
  - `USER`: Access to dashboard, new orders, order history
  - `ADMIN`: Access to admin panel, order management, user management
- **Protected Routes**: Middleware ensures only authenticated users access their respective areas

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ 
- MongoDB (local or Atlas)
- Razorpay account (for payment integration)

### Steps

1. **Clone the repository**
```bash
cd printer
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Edit `.env.local`:
```env
MONGODB_URI=mongodb://localhost:27017/raman-prints
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-change-in-production
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

4. **Run the development server**
```bash
npm run dev
```

5. **Open your browser**
```
http://localhost:3000
```
