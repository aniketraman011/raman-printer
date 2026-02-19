# Raman Prints - Student Printing Service

A full-featured web application for student printing services built with Next.js 14, MongoDB, NextAuth.js v5, and Razorpay.

**Live**: [https://raman-printer.vercel.app](https://raman-printer.vercel.app)

## Features

### Students

- **Authentication** - Signup, login, forgot password (verify via WhatsApp number)
- **Account Verification** - Admin-verified accounts with auto-refreshing status (no re-login needed)
- **File Upload** - PDF, DOC, DOCX, images — max 10 files, 4MB each
- **Auto Page Detection** - PDF pages auto-counted; double-sided auto-adjusted
- **Editable Inputs** - Type, scroll, or use +/- buttons for pages (max 199) and copies (max 20)
- **Service-Only Orders** - Order additional services without uploading files
- **Price Calculator** - Real-time pricing: `(Pages × ₹2 × Copies) + Services`
- **Payments** - Razorpay (online) or Cash on Delivery
- **Pay All** - Pay remaining balance for all unpaid orders at once from order history
- **Order Tracking** - 4-step progress with tooltips: Pending → Printing → Ready → Completed
- **Cancellation** - Request cancellation with admin approval workflow
- **Feedback** - Submit ratings (1-5 stars) with admin replies
- **Profile** - View and manage account details
- **Dark Mode** - System-wide dark/light theme toggle

### Admin

- **Dashboard** - Total orders, 24h orders, today's orders, revenue, pending/completed/cancelled counts, user stats
- **Order Management** - Update status & payment, view details, search/filter, delete with file cleanup
- **User Management** - Verify users (auto WhatsApp notification), soft delete/restore, search/filter by year
- **Feedback** - View, reply, delete user feedback
- **Settings** - Toggle COD, manage service items & pricing, configure price per page, service availability toggle
- **Reset Dashboard** - Recalculate all stats from OrderLog data

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router, Server Actions) |
| Language | TypeScript |
| Styling | Tailwind CSS 3 (dark mode, responsive) |
| Database | MongoDB with Mongoose ODM |
| Auth | NextAuth.js v5 (JWT, 30-day sessions) |
| Payments | Razorpay (Live Mode) |
| Icons | Lucide React |
| Animations | Motion (Framer Motion) |
| File Upload | react-dropzone + pdf-parse |
| Password | bcryptjs (cost factor 12) |

## Database Models

- **User** - fullName, whatsappNumber, year, username, password (bcrypt), role, isVerified, isDeleted
- **Order** - userId, files[], serviceItems[], pages, copies, printSide, totalAmount, paidAmount, paymentMethod, status, paymentStatus, razorpay fields, cancelRequested, message
- **OrderLog** - orderId, totalAmount, createdAt (permanent tracking, survives deletion)
- **Settings** - isCodEnabled, serviceItems[], pricePerPage, isServiceAvailable, counters (totalOrders, completedOrders, cancelledOrders, totalRevenue)
- **Feedback** - userId, message, rating (1-5), adminReply, adminRepliedAt

## Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Landing page |
| `/login` | Public | Login with forgot password link |
| `/signup` | Public | Registration |
| `/forgot-password` | Public | Password reset (verify username + WhatsApp) |
| `/dashboard` | User | Overview with verification status |
| `/dashboard/new` | User | Create new order |
| `/dashboard/history` | User | Order list with Pay All button |
| `/dashboard/profile` | User | Account details |
| `/dashboard/feedback` | User | Submit feedback |
| `/admin` | Admin | Analytics dashboard |
| `/admin/orders` | Admin | Order management |
| `/admin/orders/[id]` | Admin | Order detail/edit |
| `/admin/users` | Admin | User management |
| `/admin/feedback` | Admin | Feedback management |
| `/admin/settings` | Admin | App configuration |

## Setup

See [SETUP_GUIDE.md](SETUP_GUIDE.md) for full installation instructions.

### Quick Start

```bash
# Install dependencies
npm install

# Configure environment (copy and edit)
cp .env.example .env.local

# Start development server
npm run dev
```

### Required Environment Variables

```env
MONGODB_URI=mongodb://127.0.0.1:27017/ramanprints
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=your-razorpay-secret
```

## Security

- Passwords hashed with bcryptjs (12 rounds)
- JWT-based sessions with 30-day expiry
- Role-based access control (USER / ADMIN)
- Middleware protection for `/dashboard/*` and `/admin/*`
- Razorpay HMAC signature verification
- File upload validation (type, size, count)
- Input sanitization and server-side validation
- Soft delete for users (preserves data integrity)
- Verification auto-refresh every 30 seconds (no re-login needed)

## Deployment

Recommended: **Vercel** + **MongoDB Atlas**

1. Push to GitHub
2. Import in Vercel
3. Set environment variables (use MongoDB Atlas URI)
4. Deploy

## License

Private project — Raman Prints.
