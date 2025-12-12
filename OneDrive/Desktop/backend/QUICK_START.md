# QUICK START: Deploy & Submit in 90 Minutes

Follow this step-by-step to get live and record your video.

---

## STEP 1: Initialize Git (2 minutes)

Open PowerShell in backend folder:
```powershell
cd c:\Users\lukes\OneDrive\Desktop\backend
git init
git add .
git commit -m "Doctor Booking System - Full Stack Application"
git config --global user.email "your.email@example.com"
git config --global user.name "Your Name"
```

---

## STEP 2: Create GitHub Repository (3 minutes)

1. Go to **https://github.com/new**
2. **Repository name:** `doctor-booking-system`
3. **Description:** `Full-stack doctor appointment booking system with concurrency prevention`
4. Select **Public**
5. Click **Create repository**
6. Copy the provided commands and run them:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/doctor-booking-system.git
git branch -M main
git push -u origin main
```

Copy this URL: **`https://github.com/YOUR_USERNAME/doctor-booking-system`**

---

## STEP 3: Deploy Backend on Render (20 minutes)

1. Go to **https://render.com/dashboard**
2. Sign up or log in
3. Click **"New +"** → **"Web Service"**
4. Click **"Connect account"** and authorize GitHub
5. Select **`doctor-booking-system`** repository
6. Fill in:
   - **Name:** `doctor-booking-api`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node src/app.js`
   - **Instance Type:** `Free`

7. Scroll down to **Environment Variables**
8. Click **"Create Database"**
   - Database name: `doctor_booking`
   - This creates `DATABASE_URL` automatically

9. Click **"Create Web Service"**
10. Wait for deployment (~3-5 minutes)
11. Copy your URL from the dashboard

Your backend URL will be: **`https://doctor-booking-api-xxxx.onrender.com`**

Test it: Open in browser:
```
https://doctor-booking-api-xxxx.onrender.com/health
```

You should see:
```json
{"status":"ok","timestamp":"..."}
```

---

## STEP 4: Deploy Frontend on Vercel (15 minutes)

### Option A: Simple HTML Frontend (Recommended)

1. Go to **https://vercel.com/new**
2. Sign in with GitHub
3. Select **`doctor-booking-system`** repository
4. Configure:
   - **Framework:** `Other`
   - **Root Directory:** `public`
   - Leave Build and Output empty
5. Click **"Deploy"**

Wait 2-3 minutes for deployment.

Your frontend URL will be: **`https://doctor-booking-xxxx.vercel.app`**

### Option B: Update API URL in Frontend

Edit the HTML file to point to your live backend:

1. Go to **public/index.html**
2. Find the line with: `const API_BASE = '/api';`
3. Change to: `const API_BASE = 'https://doctor-booking-api-xxxx.onrender.com/api';`
4. Push to GitHub:
   ```powershell
   git add public/index.html
   git commit -m "Update API URL for production"
   git push origin main
   ```
5. Vercel will redeploy automatically

---

## STEP 5: Test Live Application (5 minutes)

Open your frontend URL in browser: **`https://doctor-booking-xxxx.vercel.app`**

### Test Admin Features:
1. Click "⚙️ Admin Mode" button (top right)
2. Click "📋 View Slots" (or look for Admin Dashboard)
3. **Add Doctor:**
   - Name: `Dr. Sarah Johnson`
   - Specialization: `Cardiology`
   - Click "Add Doctor"
   - ✅ Should see success message

4. **Create Slot:**
   - Select doctor from dropdown
   - Start Time: `2025-12-15 10:00 AM`
   - End Time: `2025-12-15 11:00 AM`
   - Capacity: `5`
   - Click "Create Slot"
   - ✅ Should see success message

### Test User Features:
1. Click "👤 User Mode" button
2. Click "📅 Book Appointment"
3. **Select and book slot:**
   - Select slot from dropdown
   - Enter Name: `John Doe`
   - Enter Contact: `555-1234`
   - Click "Book Now"
   - ✅ Should get Booking ID
   - Click "Confirm Booking"
   - ✅ Status should change to CONFIRMED

**✅ If all working → Ready for video!**

---

## STEP 6: Record Video (30-45 minutes)

### What You'll Record:

**Part 1: Deployment (4 minutes)**
1. Show GitHub repository (2 seconds)
2. Explain Render deployment (1 minute)
   - Show build logs
   - Show successful deployment
   - Test health endpoint
3. Explain Vercel deployment (1 minute)
   - Show connected repo
   - Show deployed frontend
4. Explain database setup (30 seconds)
   - Show PostgreSQL in Render
5. Summary (30 seconds)

**Part 2: Product Demo (4 minutes)**
1. Show home page with available slots (30 seconds)
2. Admin adds doctor (1 minute)
3. Admin creates slot (1 minute)
4. User books appointment (1 minute)
5. Test shows 10/10 passing (30 seconds)

### Recording Tools:
- **Windows Built-in:** Win + Shift + S
- **OBS Studio** (free): https://obsproject.com/
- **ScreenFlow** (Mac): Built-in
- **Camtasia** (paid): https://www.techsmith.com/camtasia.html

### Recording Steps:
1. Open Zoom / OBS Studio
2. Start recording
3. Open browser to your frontend URL
4. Demo admin features
5. Demo user features
6. Stop recording
7. Export as MP4

### Upload Video:
1. Go to **https://www.youtube.com**
2. Click "Create" → "Upload video"
3. Select your MP4 file
4. Title: `Doctor Booking System - Full Stack Deployment & Demo`
5. Description: (copy from VIDEO_SCRIPT.md)
6. Visibility: **Unlisted** (not Private!)
7. Upload and wait for processing
8. Copy the YouTube URL

Example: `https://youtube.com/watch?v=xxxxx`

---

## STEP 7: Submit (5 minutes)

Create file: `SUBMISSION.md` in backend folder:

```markdown
# Doctor Booking System - Submission

## Live URLs

- **Frontend:** https://doctor-booking-xxxx.vercel.app
- **Backend:** https://doctor-booking-api-xxxx.onrender.com
- **GitHub:** https://github.com/YOUR_USERNAME/doctor-booking-system
- **Video:** https://youtube.com/watch?v=xxxxx

## Project Summary

Doctor Booking System is a full-stack application that handles high-concurrency appointment bookings with atomic transactions and zero overbooking.

### Key Features
✅ Doctor management (create, list)
✅ Appointment slot creation with capacity
✅ Atomic booking with PostgreSQL row-level locking
✅ Booking confirmation workflow
✅ Automatic 2-minute booking expiry
✅ Concurrency prevention (tested with 10 concurrent requests)
✅ Admin dashboard for management
✅ User-friendly booking interface

### Technology Stack
- Backend: Node.js + Express.js
- Database: PostgreSQL with ACID transactions
- Frontend: HTML5 + CSS3 + JavaScript
- Deployment: Render (backend) + Vercel (frontend)

### Testing Results
- 10/10 core features PASSED
- Concurrency prevention: VERIFIED
- Overbooking prevention: VERIFIED (4th request blocked on 3-capacity slot)

---

Submitted: [Date]
```

Push to GitHub:
```powershell
git add SUBMISSION.md
git commit -m "Add submission details"
git push origin main
```

---

## ✅ FINAL CHECKLIST

Before you submit, verify:

- [ ] Frontend URL opens and loads
- [ ] Health endpoint returns JSON
- [ ] Can add doctor via admin panel
- [ ] Can create appointment slot
- [ ] Can book appointment as user
- [ ] Can confirm booking
- [ ] Video uploaded and accessible
- [ ] All three URLs documented
- [ ] GitHub repository public
- [ ] No errors in browser console
- [ ] Deployment complete and stable

---

## 🎯 TIMELINE

| Task | Time | Start | End |
|------|------|-------|-----|
| GitHub setup | 5 min | 0:00 | 0:05 |
| Backend deployment | 20 min | 0:05 | 0:25 |
| Frontend deployment | 15 min | 0:25 | 0:40 |
| Testing | 10 min | 0:40 | 0:50 |
| Video recording | 40 min | 0:50 | 1:30 |
| Submit | 5 min | 1:30 | 1:35 |

**Total: 95 minutes**

---

## 🚨 TROUBLESHOOTING

### "Endpoint not found" error
- Verify backend is running
- Check API URL doesn't have trailing slash
- Clear browser cache

### Backend taking too long to start
- Render free tier spins down after 15 minutes
- First request takes ~30 seconds to wake up
- This is normal!

### Database connection error
- Wait 2 minutes for Render PostgreSQL to initialize
- Refresh the page
- Check DATABASE_URL is set

### Video upload taking forever
- Use YouTube unlisted (faster than Google Drive)
- Upload to a high-speed WiFi network
- Compress video if >500MB

---

## 💡 TIPS

1. **Test before recording:** Make sure everything works
2. **Record in quiet environment:** Better audio quality
3. **Use 1080p resolution:** Professional look
4. **Speak clearly and slowly:** Easier to understand
5. **Have URLs ready:** Copy-paste them for accuracy
6. **Do one take:** Easier than editing multiple clips
7. **Back up everything:** Save video locally before uploading

---

Good luck! You've got this! 🚀
