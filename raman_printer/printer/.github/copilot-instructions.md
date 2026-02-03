# Raman Prints - AI Coding Agent Instructions

## Project Overview
Student printing service built with **Next.js 14 App Router**, MongoDB, NextAuth.js v5, and Razorpay. Two-tier architecture: student dashboards for ordering prints, admin panel for order/user management.

## Architecture Patterns

### Authentication & Authorization
- **NextAuth.js v5** with credentials provider in [auth.ts](../auth.ts)
- Auth middleware protects `/dashboard/*` and `/admin/*` routes (see [middleware.ts](../middleware.ts))
- Session extended with `role`, `username`, `isVerified` via callbacks
- User verification (`isVerified`) required for order placement - admins manually verify users
- Soft delete pattern: `isDeleted` flag on User model (never hard delete users from DB)

### Data Layer
- **Mongoose** with global connection caching to prevent hot-reload connection leaks ([lib/db.ts](../lib/db.ts))
- Always check cached connection before creating new ones
- Model compilation guard: `mongoose.models?.ModelName || mongoose.model(...)` to prevent recompilation errors
- All database operations in Server Actions or API Routes, never in client components

### Server Actions vs API Routes
- **Server Actions** (`app/actions/`) for mutations with revalidation (createOrder, updateOrderStatus)
  - Always `'use server'` directive at top
  - Use `revalidatePath()` after mutations
  - Return `{ success: boolean, error?: string }` pattern
- **API Routes** (`app/api/`) for:
  - External integrations (Razorpay webhooks)
  - Operations requiring NextRequest/NextResponse
  - File uploads with FormData

### Business Logic

#### Order Flow
1. User uploads files → Server Action to `/api/upload` → stores in `public/uploads/`
2. Calculate price: `pages × copies × ₹2/page` (B/W only, see [lib/constants.ts](../lib/constants.ts))
3. Create order with `PENDING` status and selected payment method
4. Razorpay payment → callback updates `paymentStatus` to `PAID`
5. Admin progressively updates: `PENDING → PRINTING → READY → COMPLETED`

#### Order Cancellation
- Users request cancellation (sets `cancelRequested: true`)
- Admin must manually delete from admin panel (hard delete allowed for orders, not users)

#### User Verification
- New users start with `isVerified: false`
- Only verified users can place orders
- Admins verify via `/admin/users` panel

### Key Models

#### Order Model ([models/Order.ts](../models/Order.ts))
```typescript
{
  files: [{fileName, fileUrl, fileSize}],  // Multiple files per order
  serviceItems: [{name, price, quantity}], // Service breakdown
  totalAmount: number,
  paymentMethod: 'RAZORPAY' | 'COD',
  status: 'PENDING' | 'PRINTING' | 'READY' | 'COMPLETED' | 'CANCELLED',
  paymentStatus: 'PENDING' | 'PAID' | 'UNPAID' | 'FAILED',
  printSide: 'SINGLE' | 'DOUBLE',
  cancelRequested?: boolean
}
```

#### User Model ([models/User.ts](../models/User.ts))
```typescript
{
  username: string (unique, lowercase),
  password: string (bcrypt hashed),
  role: 'USER' | 'ADMIN',
  isVerified: boolean,    // Manual admin verification
  isDeleted: boolean,     // Soft delete only
  year: '1st Year' | '2nd Year' | '3rd Year' | '4th Year' | 'Passout'
}
```

### Settings Management
- Dynamic price per page configurable via Settings model (default ₹2)
- COD toggle (`isCodEnabled`) controlable by admin
- Service items array defines available printing services
- Client components fetch `/api/settings` on mount to get current pricing

## Development Workflow

### Running the App
```powershell
npm run dev           # Development server on :3000
npm run build         # Production build
npm run start         # Production server
```

### Database Setup
- MongoDB connection via `MONGODB_URI` in `.env.local` (required)
- Local MongoDB or MongoDB Atlas supported
- Use `create-admin.js` script to promote first user to admin

### Creating Admin User
```javascript
// After first user signup, run in MongoDB shell:
db.users.updateOne(
  { username: "your-username" },
  { $set: { role: "ADMIN", isVerified: true } }
)
```

### Razorpay Integration
- Uses live keys: `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` from `.env.local`
- Order creation in `/api/order/route.ts` creates Razorpay order
- Payment verification in `/api/razorpay/route.ts` validates signatures

## Code Conventions

### Component Patterns
- Client components: `'use client'` for interactivity, forms, state
- Server components: default for data fetching, layout
- Mobile-first Tailwind classes, responsive design mandatory
- Lucide React icons consistently used across app

### Error Handling
- Server Actions: return `{ success: false, error: string }`
- API Routes: return `NextResponse.json({ error }, { status })`
- Never throw unhandled errors in Server Actions
- Always await `connectDB()` before Mongoose queries

### File Upload
- Files go to `public/uploads/` directory
- Store relative path in DB (`/uploads/filename.pdf`)
- Validate file types and size limits in upload endpoint

### Route Protection
- Auth session check: `const session = await auth()`
- Return 401 for missing session
- Check `isVerified` before allowing orders
- Admin-only routes check `session.user.role === 'ADMIN'`

## Common Tasks

### Adding New Order Status
1. Update `ORDER_STATUS` const in [lib/constants.ts](../lib/constants.ts)
2. Add enum value to Order model schema
3. Update `getStatusColor()` for badge styling
4. Add UI options in admin order management

### Modifying Pricing
- Update `PRICING` constant for defaults
- Override via Settings model for dynamic pricing
- Ensure calculator components fetch latest from `/api/settings`

### Adding Payment Method
1. Add to `paymentMethod` enum in Order model
2. Update payment method toggle in new order UI
3. Implement payment flow in `/api/order/route.ts`
4. Add verification logic if needed

## Testing Guidance
- Test unauthenticated access to protected routes
- Verify soft delete doesn't break references
- Test order flow with both Razorpay and COD
- Ensure unverified users cannot place orders
- Check connection caching prevents DB connection leaks
