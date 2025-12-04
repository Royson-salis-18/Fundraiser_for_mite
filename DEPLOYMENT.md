# Deployment Guide for Render

This guide will help you deploy your fundraiser application to Render while keeping your MongoDB credentials secure.

## Prerequisites

1. A MongoDB Atlas account (free tier works)
2. A Render account (free tier available)
3. Your code pushed to GitHub

## Quick Start (One-Click Deployment)

**Easiest Method:** Use the `render.yaml` file!

1. Push your code to GitHub
2. Go to Render Dashboard → New → Blueprint
3. Connect your GitHub repository
4. Render will automatically detect `render.yaml`
5. Add your environment variables:
   - `MONGODB_URI` (your MongoDB connection string)
   - `JWT_SECRET` (generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
6. Click **Apply** - That's it! 🎉

Your app will be live at `https://your-app.onrender.com`

---

## Manual Deployment (Step by Step)

## Step 1: Set Up Environment Variables

### Backend Environment Variables

In your Render dashboard, when creating a new **Web Service** for your backend:

1. Go to your backend service settings
2. Navigate to **Environment** tab
3. Add these environment variables:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/campus_events?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here_minimum_32_characters
PORT=10000
NODE_ENV=production
FRONTEND_URL=https://your-frontend-app.onrender.com
```

**Important:**
- Replace `MONGODB_URI` with your actual MongoDB Atlas connection string
- Generate a secure `JWT_SECRET` using: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `FRONTEND_URL` should be your frontend Render URL (add this after deploying frontend)

### Frontend Environment Variables

In your Render dashboard, when creating a new **Static Site** for your frontend:

1. Go to your frontend service settings
2. Navigate to **Environment** tab
3. Add this environment variable:

```
REACT_APP_API_URL=https://your-backend-app.onrender.com/api
```

Replace `your-backend-app.onrender.com` with your actual backend Render URL.

## Step 2: Deploy (Single Service - Recommended)

**Option A: Combined Deployment (Frontend + Backend in One Service)**

This is the easiest option - deploy everything in one go!

1. **Create a new Web Service** on Render
2. Connect your GitHub repository
3. Configure:
   - **Name**: `fundraiser-app` (or your choice)
   - **Root Directory**: `.` (root of repository)
   - **Environment**: `Node`
   - **Build Command**: `cd client && npm install && npm run build && cd ../backend && npm install`
   - **Start Command**: `cd backend && node server.js`
4. Add environment variables (from Step 1):
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   PORT=10000
   NODE_ENV=production
   ```
   **Note:** You don't need `FRONTEND_URL` or `REACT_APP_API_URL` for this option since everything runs on the same domain!
5. Click **Create Web Service**

That's it! Your app will be available at `https://your-app.onrender.com`

---

**Option B: Separate Services (Frontend + Backend)**

If you prefer separate services:

### Deploy Backend

1. **Create a new Web Service** on Render
2. Connect your GitHub repository
3. Configure:
   - **Name**: `fundraiser-backend` (or your choice)
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
4. Add environment variables (from Step 1)
5. Click **Create Web Service**

### Deploy Frontend

1. **Create a new Static Site** on Render
2. Connect your GitHub repository
3. Configure:
   - **Name**: `fundraiser-frontend` (or your choice)
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`
4. Add environment variable `REACT_APP_API_URL` (from Step 1)
5. Click **Create Static Site**

## Step 3: Update CORS and URLs (Only for Option B)

After both services are deployed (only needed for Option B):

1. Get your backend URL (e.g., `https://fundraiser-backend.onrender.com`)
2. Get your frontend URL (e.g., `https://fundraiser-frontend.onrender.com`)
3. Update backend environment variable:
   - `FRONTEND_URL=https://fundraiser-frontend.onrender.com`
4. Update frontend environment variable:
   - `REACT_APP_API_URL=https://fundraiser-backend.onrender.com/api`
5. Redeploy both services

## Step 5: MongoDB Atlas Configuration

1. Go to MongoDB Atlas → Network Access
2. Click **Add IP Address**
3. Click **Allow Access from Anywhere** (or add Render's IP ranges)
4. Go to Database Access → Create a database user
5. Copy the connection string and use it in `MONGODB_URI`

## Security Checklist

✅ Never commit `.env` files to GitHub
✅ Use environment variables for all secrets
✅ Keep `JWT_SECRET` long and random (32+ characters)
✅ Use HTTPS in production (Render provides this automatically)
✅ Restrict MongoDB network access if possible
✅ Use strong database passwords

## Local Development Setup

1. Create `backend/.env` file:
```
MONGODB_URI=your_local_or_atlas_connection_string
JWT_SECRET=your_local_jwt_secret
PORT=5000
NODE_ENV=development
```

2. The frontend will automatically use `http://localhost:5000/api` in development

## Troubleshooting

### Backend won't start
- Check environment variables are set correctly
- Verify MongoDB connection string
- Check Render logs for errors

### Frontend can't connect to backend
- Verify `REACT_APP_API_URL` is set correctly
- Check CORS settings in backend
- Ensure backend is running and accessible

### CORS errors
- Make sure `FRONTEND_URL` in backend matches your frontend URL exactly
- Check that CORS middleware is configured correctly

## Notes

- Render free tier services spin down after 15 minutes of inactivity
- First request after spin-down may take 30-60 seconds
- Consider upgrading to paid tier for always-on services
- Environment variables are encrypted at rest on Render

