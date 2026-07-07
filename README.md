# 🖨️ Raman Prints

<div align="center">

### Smart Online Printing Platform for Students

A production-ready full-stack web application that allows students to upload documents, calculate printing costs, make secure online payments, and track print orders in real time.

[🌐 Live Demo](https://raman-printer.vercel.app) • [💻 GitHub Repository](https://github.com/aniketraman011/raman-printer)

</div>

---

## 📌 Overview

Raman Prints is a modern online printing service designed to simplify the document printing process for students.

Users can:

- Upload PDF, DOC, DOCX, and image files
- Calculate printing costs automatically
- Place secure online orders
- Pay using Razorpay
- Track order status
- View order history

Administrators can:

- Manage all orders
- Update order status
- Manage users
- View analytics
- Configure pricing
- Handle customer feedback

---

# ✨ Features

## 👨‍🎓 Student Features

- Secure Authentication
- File Upload
- Online Payment (Razorpay)
- Dynamic Price Calculator
- Order History
- Real-time Order Tracking
- Profile Management
- Responsive UI

---

## 👨‍💼 Admin Features

- Admin Dashboard
- Order Management
- User Management
- Revenue Analytics
- Feedback Management
- Pricing Configuration
- Secure Role-Based Access

---

# 🛠 Tech Stack

## Frontend

- Next.js 14 (App Router)
- React
- TypeScript
- Tailwind CSS

## Backend

- Next.js API Routes
- Node.js

## Database

- MongoDB
- Mongoose

## Authentication

- NextAuth.js (JWT)

## Payment

- Razorpay

## Deployment

- Vercel

---

# 📂 Project Structure

```
raman-printer/
│
├── app/
├── components/
├── lib/
├── models/
├── public/
├── styles/
├── utils/
├── middleware.ts
├── package.json
└── README.md
```

---

# 🔐 Authentication

- NextAuth.js Authentication
- JWT Session Management
- Protected Routes
- Admin Authorization
- User Authorization

---

# 💳 Payment Integration

Integrated with **Razorpay**.

Supports

- Secure Checkout
- Order Verification
- Payment Success Handling
- Payment Failure Handling

---

# 📦 File Upload

Supported formats

- PDF
- DOC
- DOCX
- JPG
- JPEG
- PNG

Limits

- Maximum 10 files
- Maximum 20MB per file
- Maximum 100MB per order

---

# 📊 Order Workflow

```
Pending
   ↓
Accepted
   ↓
Printing
   ↓
Ready for Pickup
   ↓
Completed
```

---

# 🚀 Installation

Clone the repository

```bash
git clone https://github.com/aniketraman011/raman-printer.git
```

Go inside project

```bash
cd raman-printer
```

Install dependencies

```bash
npm install
```

Create environment variables

```
NEXTAUTH_URL=
NEXTAUTH_SECRET=

MONGODB_URI=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

Run development server

```bash
npm run dev
```

Open

```
http://localhost:3000
```

---

# 📸 Screenshots

Add screenshots here.

Example

- Home Page
- Upload Documents
- Checkout
- Order Tracking
- Admin Dashboard

---

# 📈 Future Improvements

- Email Notifications
- SMS Notifications
- QR Code Pickup
- Print Preview
- Multi-Branch Support
- Coupon System
- Dark Mode
- Mobile Application

---

# 👨‍💻 Author

**Aniket Raman**

B.Tech Computer Science Engineering

Indian Institute of Information Technology (IIIT) Sonepat

GitHub:
https://github.com/aniketraman011

LinkedIn:
(Add your LinkedIn URL)

Portfolio:
(Add your Portfolio URL)

---

# ⭐ Support

If you like this project,

⭐ Star this repository

🍴 Fork it

🛠 Contribute to improve it.

---

# 📄 License

This project is licensed under the MIT License.
