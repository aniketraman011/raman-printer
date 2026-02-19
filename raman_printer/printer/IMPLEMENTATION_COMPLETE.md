# Raman Prints - Changelog

## Latest Updates

### Pay All Orders
- Added "Pay All" button on order history page
- Users can pay remaining balance for all unpaid orders at once via Razorpay
- API: /api/order/pay-all (create) + /api/order/pay-all/verify (verify)

### Forgot Password
- New /forgot-password page with two-step flow
- Step 1: Verify identity (username + WhatsApp number)
- Step 2: Set new password
- "Forgot Password?" link added to login page

### Editable Number Inputs
- Pages and copies inputs now support direct typing
- Click on the number to type, press Enter or click away to confirm
- Still supports +/- buttons and scroll wheel

### Max Pages Limit
- Changed maximum pages per order from 500 to 199

### WhatsApp Verification Message
- Updated message: removes "Please logout and login again" (no longer needed)
- Verification status auto-refreshes every 30 seconds via JWT callback

## Previous Updates

### Auto-Refresh Verification Status
- JWT session auto-checks verification status from DB every 30 seconds
- Users no longer need to logout/login after admin verification

### Service-Only Orders
- Users can place orders with only additional services (no file upload required)
- Pages/copies fields disabled until files are uploaded

### Order Status Tooltips
- Hover over status steps to see descriptions (e.g., "Your order is being printed")

### File Upload Improvements
- Max 4MB per file (reduced from 20MB)
- Max 10 files per upload
- PDF auto page count detection

### Admin Features
- Reset dashboard stats from OrderLog data
- Delete feedback with confirmation
- Permanent order counters (survive deletion)
- OrderLog model for reliable stats

### Core Features
- Razorpay integration (Live Mode)
- COD payment option (admin toggleable)
- Order tracking: Pending > Printing > Ready > Completed
- Cancel request with admin approval
- User verification system
- Dark mode support
- Responsive design
