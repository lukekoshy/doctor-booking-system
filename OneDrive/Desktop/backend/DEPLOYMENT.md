# Deployment Instructions

## Prerequisites
- GitHub account
- Render account (free tier) - https://render.com
- Vercel account (free tier) - https://vercel.com

---

## PART 1: GitHub Setup (5 minutes)

### Step 1: Initialize Git in Backend
```bash
cd c:\Users\lukes\OneDrive\Desktop\backend
git init
git add .
git commit -m "Initial commit: Doctor booking system backend"
```

### Step 2: Create GitHub Repository
1. Go to https://github.com/new
2. Name: `doctor-booking-backend`
3. Description: `Doctor Appointment Booking System - Node.js Express PostgreSQL`
4. Make it **Public**
5. Don't initialize with README (we already have one)
6. Click "Create repository"

### Step 3: Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/doctor-booking-backend.git
git branch -M main
git push -u origin main
```

---

## PART 2: Backend Deployment on Render (15-20 minutes)

### Step 1: Create New Web Service on Render
1. Go to https://render.com/dashboard
2. Click "New +" → "Web Service"
3. Connect your GitHub account if not already done
4. Select `doctor-booking-backend` repository
5. Fill in details:
   - **Name:** `doctor-booking-backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node src/app.js`
   - **Instance Type:** `Free` (for now)

### Step 2: Add Environment Variables
Add these in the Render dashboard:
```
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://user:password@your-db-host/doctor_booking
```

For free tier, use Render's free PostgreSQL:
1. Click "Create Database"
2. Name: `doctor-booking-db`
3. Copy the generated `DATABASE_URL`
4. Paste it in the environment variables

### Step 3: Deploy
Click "Create Web Service" - Render will automatically deploy!

**Your Backend URL will be:**
```
https://doctor-booking-backend-xxxx.onrender.com
```

---

## PART 3: Frontend Deployment on Vercel (10 minutes)

### Step 1: Create .env.local in Frontend
Create `c:\Users\lukes\OneDrive\Desktop\backend\public\.env.local`:
```
REACT_APP_API_URL=https://doctor-booking-backend-xxxx.onrender.com/api
```

Replace with your actual Render URL from Step 2.

### Step 2: Push Frontend to GitHub
```bash
cd c:\Users\lukes\OneDrive\Desktop\backend
git add public/
git commit -m "Add frontend files"
git push origin main
```

### Step 3: Deploy to Vercel
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Select `doctor-booking-backend`
4. Configure:
   - **Framework Preset:** Other
   - **Root Directory:** `public/` (since frontend is in public folder)
   - **Build Command:** Skip (static files)
   - **Output Directory:** Leave blank
5. Click "Deploy"

**Your Frontend URL will be:**
```
https://doctor-booking-xxxx.vercel.app
```

---

## PART 4: Verify Deployment (5 minutes)

### Test Backend
```
https://doctor-booking-backend-xxxx.onrender.com/health
```
Should return:
```json
{"status":"ok","timestamp":"..."}
```

### Test Frontend
Open in browser:
```
https://doctor-booking-xxxx.vercel.app
```

### Create a Test Booking
1. Add a doctor via Admin panel
2. Create a slot
3. Book an appointment
4. Confirm booking

---

## IMPORTANT NOTES

### Render Free Tier Limitations
- Application spins down after 15 minutes of inactivity
- Takes ~30 seconds to wake up on first request
- If you need production, upgrade to paid tier ($7/month)

### To Keep Backend Always Running
Option 1: Upgrade Render to paid plan
Option 2: Use a monitoring service (Free option):
```bash
# Add to run-full-test.js - run periodic health checks
setInterval(() => {
  fetch('https://your-backend.onrender.com/health');
}, 600000); // Every 10 minutes
```

### Database
- Use Render's free PostgreSQL for demo
- For production, migrate to managed PostgreSQL service

---

## Troubleshooting

### Backend not connecting to database
- Verify `DATABASE_URL` environment variable is set correctly
- Check database migrations have run
- Render PostgreSQL takes ~2 minutes to initialize

### Frontend shows "Endpoint not found"
- Check `REACT_APP_API_URL` is correct
- Ensure it doesn't have trailing slash
- Clear browser cache (Ctrl+Shift+Delete)

### Slow initial load
- Render free tier needs to spin up
- This is normal, happens only once every 15 minutes

---

## Final Deployment Checklist

- [ ] Backend deployed to Render
- [ ] Frontend deployed to Vercel
- [ ] Health check endpoint working
- [ ] Doctor creation working
- [ ] Slot creation working
- [ ] Booking creation working
- [ ] Booking confirmation working
- [ ] Both URLs documented

---

## Your Final URLs (Update these after deployment)

**Backend:** `https://doctor-booking-backend-xxxx.onrender.com`

**Frontend:** `https://doctor-booking-xxxx.vercel.app`

**GitHub:** `https://github.com/YOUR_USERNAME/doctor-booking-backend`
