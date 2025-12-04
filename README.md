# Fundraiser for MITE

A fundraising application for MITE (Mangalore Institute of Technology and Engineering) that allows students to make payments for college events.

## Features

- **Student Dashboard**: View mandatory and optional events, add to cart, and make payments
- **Admin Dashboard**: Manage events, view payment statistics, and confirm student payments
- **Payment System**: UPI integration with UTR tracking and screenshot upload
- **Payment Confirmation**: Admin review system for payment verification
- **User Management**: Student and admin roles with authentication

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
