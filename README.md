# Fundraiser for MITE

A fundraising application for MITE (Mangalore Institute of Technology and Engineering) that allows students to make payments for college events.

## Features

- **Student Dashboard**: View mandatory and optional events, add to cart, and make payments
- **Admin Dashboard**: Manage events, view payment statistics, and confirm student payments
- **Payment System**: UPI integration with UTR tracking and screenshot upload
- **Payment Confirmation**: Admin review system for payment verification
- **User Management**: Student and admin roles with authentication
- **Platform service fee**: A configurable percentage (default 2%) shown transparently at checkout and recorded in a fee ledger when an admin confirms a payment
- **Fee ledger**: Admin dashboard card plus `GET /api/admin/fees` with totals and per-payment entries
- **UPI deep link**: One-tap "Pay with UPI app" for the exact total, plus optional payment-portal link

## Tech Stack

- **Frontend**: React, React Router
- **Backend**: Node.js, Express
- **Database**: MongoDB (MongoDB Atlas)
- **Authentication**: JWT

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account (or local MongoDB)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   cd backend && npm install
   cd ../client && npm install
   ```

3. Set up environment variables:
   - Create `backend/.env` file (see `backend/ENV_TEMPLATE.txt`)
   - Add your MongoDB connection string and JWT secret

4. Start development servers:
   ```bash
   # From root directory
   npm run dev
   ```

## Features added in this update

- **My Payments** page for students: status for every payment, rejection reasons, resubmit, and printable receipts
- **Admin review**: confirm or reject with a reason shown to the student, search, full-size screenshot preview, CSV export
- **Fee ledger table** on the admin dashboard with CSV export
- Event search and filters, toast notifications, skeleton loaders, empty states
- Light and dark themes, session restore after refresh

## Platform fee

Set `PLATFORM_FEE_PERCENT` (0-20, default 2). Checkout shows event price, fee and total payable. When an admin confirms a payment, the fee is written to the `platform_fees` collection (reversed if the payment is later rejected). Admins see totals on the dashboard.

> **Settlement note:** a single UPI payment goes to one payee, so the fee is *recorded* here but not automatically routed to a second account. To split money automatically, use a gateway with split settlements (e.g. Razorpay Route or Cashfree Easy Split) and set `PAYMENT_PORTAL_URL`.

## Try it without a database

```bash
cd client && npm install && npm run build && cd ..
cd backend && npm install
DEMO_MODE=true NODE_ENV=production JWT_SECRET=demo PORT=5000 node server.js
```

Open http://localhost:5000. Demo logins: admin `admin` / `01011990`; student `4MT22CS001` / `01012004`. Data is in memory only.

## Tests

```bash
cd backend && node --test fees.test.js
```

## Security notes

- Passwords are bcrypt-hashed; legacy plaintext passwords are upgraded automatically at next login.
- Auth endpoints are rate limited, `helmet` headers are enabled, request bodies are capped at 8 MB.

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions on Render.

## Project Structure

```
fundraiser-react/
├── backend/          # Node.js/Express backend
│   ├── server.js     # Main server file
│   └── package.json
├── client/           # React frontend
│   ├── src/
│   │   ├── pages/    # Page components
│   │   ├── components/# Reusable components
│   │   └── services/ # API services
│   └── package.json
└── DEPLOYMENT.md     # Deployment guide
```

## License

ISC
