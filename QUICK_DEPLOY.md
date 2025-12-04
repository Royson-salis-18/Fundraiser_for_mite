# Quick Deploy Checklist 🚀

## Before Pushing to GitHub

### ✅ 1. Check .gitignore
Make sure `.gitignore` includes:
- `.env` files
- `node_modules/`
- `backend/.env`
- `client/.env*`

**Your `.gitignore` is already set up correctly!** ✅

### ✅ 2. Create .env file locally (NOT for GitHub)
Create `backend/.env` file with your local development keys:
```
MONGODB_URI=your_local_mongodb_uri
JWT_SECRET=your_local_jwt_secret
PORT=5000
NODE_ENV=development
```

**This file is already ignored by .gitignore, so it won't be pushed to GitHub!** ✅

---

## Push to GitHub

1. **Initialize git** (if not already):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/yourusername/your-repo.git
   git push -u origin main
   ```

**No .env files will be committed!** They're in .gitignore ✅

---

## Deploy on Render

### Method 1: Using render.yaml (Easiest)

1. Go to **Render Dashboard** → **New** → **Blueprint**
2. Connect your GitHub repository
3. Render will automatically detect `render.yaml`
4. **Add these 2 environment variables** in Render dashboard:
   - `MONGODB_URI` = your MongoDB connection string
   - `JWT_SECRET` = generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
5. Click **Apply**

**That's it!** Your app will be live! 🎉

---

### Method 2: Manual Setup

1. Go to **Render Dashboard** → **New** → **Web Service**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `fundraiser-app`
   - **Root Directory**: `.`
   - **Environment**: `Node`
   - **Build Command**: `cd client && npm install && npm run build && cd ../backend && npm install`
   - **Start Command**: `cd backend && node server.js`
4. **Add Environment Variables** (click "Add Environment Variable"):
   - `MONGODB_URI` = your MongoDB Atlas connection string
   - `JWT_SECRET` = your secret key (32+ characters)
   - `NODE_ENV` = `production`
   - `PORT` = `10000`
5. Click **Create Web Service**

---

## Important: Secret Keys

### ✅ DO:
- ✅ Set environment variables in **Render Dashboard** (not in code)
- ✅ Use different keys for production vs development
- ✅ Keep your local `.env` file private (it's in .gitignore)

### ❌ DON'T:
- ❌ Commit `.env` files to GitHub
- ❌ Put secrets in your code
- ❌ Share your production keys

---

## Generate JWT Secret

Run this command to generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and use it as your `JWT_SECRET` in Render.

---

## Summary

1. ✅ **Push to GitHub** - Your code (no secrets)
2. ✅ **Deploy on Render** - Connect repo
3. ✅ **Add secrets in Render** - Environment variables tab
4. ✅ **Done!** - Your app is live

**No secrets in GitHub, everything secure!** 🔒

