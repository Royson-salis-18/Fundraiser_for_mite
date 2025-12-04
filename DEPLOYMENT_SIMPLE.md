# Simple Deployment Guide - Same Repo, Same Project

Yes! You can deploy both frontend and backend from the same repo. Here are your options:

## Option 1: Single Service (Easiest) ✅ RECOMMENDED

**One service that runs everything together**

1. Go to Render Dashboard → **New** → **Web Service**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `fundraiser-app`
   - **Root Directory**: `.` (root of repo)
   - **Environment**: `Node`
   - **Build Command**: 
     ```
     cd client && npm install && npm run build && cd ../backend && npm install
     ```
   - **Start Command**: 
     ```
     cd backend && node server.js
     ```
4. Add Environment Variables:
   - `MONGODB_URI` = your MongoDB connection string
   - `JWT_SECRET` = your secret key
   - `NODE_ENV` = `production`
   - `PORT` = `10000`
5. Click **Create Web Service**

**That's it!** Your app will be at `https://fundraiser-app.onrender.com`

The backend automatically serves the frontend build files, so everything works together.

---

## Option 2: Two Services, Same Project

**Separate services but under one project**

1. Create a **Project** in Render (optional - just for organization)
2. Inside that project, create **Service 1 (Backend)**:
   - **Name**: `fundraiser-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Environment Variables**: `MONGODB_URI`, `JWT_SECRET`, `PORT`, `NODE_ENV`, `FRONTEND_URL`
3. Inside the same project, create **Service 2 (Frontend)**:
   - **Name**: `fundraiser-frontend`
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`
   - **Environment Variables**: `REACT_APP_API_URL` = `https://fundraiser-backend.onrender.com/api`

Both services will be in the same project, but you'll have two URLs:
- Backend: `https://fundraiser-backend.onrender.com`
- Frontend: `https://fundraiser-frontend.onrender.com`

---

## Which Should You Choose?

**Choose Option 1 (Single Service)** if:
- ✅ You want simplicity
- ✅ You want one URL for everything
- ✅ You want easier deployment
- ✅ You want lower cost (one service instead of two)

**Choose Option 2 (Two Services)** if:
- ✅ You want to scale frontend and backend independently
- ✅ You want separate URLs
- ✅ You have specific requirements for separation

**For most cases, Option 1 is better!** It's what I've already configured for you.

