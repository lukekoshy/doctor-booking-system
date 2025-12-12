# Deployment Steps - Manual Actions Required

Your code is committed and ready. Complete these 4 steps to go live:

---

## Step 1: Create GitHub Repository (2 minutes)

1. Go to **https://github.com/new**
2. **Repository name**: `doctor-booking-system`
3. **Description**: "Full-stack doctor appointment booking system with concurrency control"
4. **Public** checkbox: ✅ Checked
5. **Click**: "Create repository"
6. **Copy** the commands shown, they'll look like:
```bash
git remote add origin https://github.com/YOUR_USERNAME/doctor-booking-system.git
git branch -M main
git push -u origin main
```

---

## Step 2: Push Code to GitHub (3 minutes)

Run these commands in your terminal:

```powershell
cd c:\Users\lukes\OneDrive\Desktop\backend
git remote add origin https://github.com/YOUR_USERNAME/doctor-booking-system.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

**Result**: Your code appears at `https://github.com/YOUR_USERNAME/doctor-booking-system`

---

## Step 3: Deploy Backend to Render (15 minutes)

1. Go to **https://render.com**
2. **Sign in** with GitHub account
3. Click **"New Web Service"**
4. **Connect GitHub**: Click "GitHub" and authorize
5. **Select repo**: `doctor-booking-system`
6. Fill in:
   - **Name**: `doctor-booking-api`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/app.js`
7. Click **"Advanced"** and add Environment Variable:
   - **Key**: `DATABASE_URL`
   - **Value**: Get from [ElephantSQL Free Tier](https://www.elephantsql.com) (takes 30 seconds, they'll email you a connection string starting with `postgres://`)
8. Add another:
   - **Key**: `NODE_ENV`
   - **Value**: `production`
9. Click **"Create Web Service"**
10. Wait 2-3 minutes for deployment
11. **Copy your URL** when "Build successful" appears - looks like: `https://doctor-booking-api-xxxx.onrender.com`

**Test it**:
```
https://doctor-booking-api-xxxx.onrender.com/health
```
Should return: `{"status":"ok"}`

---

## Step 4: Deploy Frontend to Vercel (10 minutes)

1. Go to **https://vercel.com/new**
2. **Sign in** with GitHub
3. **Import** your GitHub repository: `doctor-booking-system`
4. **Framework Preset**: Select "Other"
5. **Root Directory**: Set to `public/` (this is where index.html lives)
6. Click **"Deploy"**
7. Wait 1-2 minutes
8. **Copy your URL** - looks like: `https://doctor-booking-xxxx.vercel.app`

---

## Step 5: Test Live Application (5 minutes)

1. Open **`https://doctor-booking-xxxx.vercel.app`** in your browser
2. Go to **Admin Panel** tab
3. Add a doctor: Name: "John Doe", Specialization: "Cardiology", Click "Add"
4. Create slot: Select doctor, set date/time (tomorrow), capacity: 3, Click "Create"
5. Go to **User Booking** tab
6. Click "Refresh Slots"
7. Click the available slot
8. Enter patient details and book
9. Confirm the booking

**If you see the appointment in the list**, it works! 🎉

---

## Step 6: Record 10-Minute Video (40 minutes)

Follow [VIDEO_SCRIPT.md](VIDEO_SCRIPT.md) exactly:

**Part A (4 minutes)**: Explain the deployment
- Show GitHub repo
- Show Render dashboard (backend running)
- Show Vercel dashboard (frontend deployed)
- Explain what each does

**Part B (6 minutes)**: Demo the features
- Add doctor
- Create appointment slot
- Make a booking
- Confirm booking
- Show database activity

Upload to YouTube (unlisted) and get the link.

---

## Step 7: Submit (2 minutes)

Create file `SUBMISSION.md`:

```markdown
# Submission - Doctor Booking System

## URLs
- **GitHub Repository**: https://github.com/YOUR_USERNAME/doctor-booking-system
- **Live Frontend**: https://doctor-booking-xxxx.vercel.app
- **Live Backend API**: https://doctor-booking-api-xxxx.onrender.com
- **Video Demo**: https://youtube.com/watch?v=XXXXX

## Features Delivered ✅
- Full-stack REST API (8 endpoints)
- PostgreSQL with ACID transactions
- Row-level locking for concurrency control
- HTML5 admin dashboard
- Real-time booking interface
- Complete System Design document
- Comprehensive testing (10/10 passing)

## Quick Start
See QUICK_START.md for complete setup and testing instructions.
```

Then:
```bash
git add SUBMISSION.md
git commit -m "Add submission details"
git push origin main
```

---

## Troubleshooting

**Database URL not working?**
- Get free PostgreSQL at [ElephantSQL.com](https://www.elephantsql.com)
- Sign up → Create Instance → Copy connection string
- Paste as DATABASE_URL in Render environment variables

**Frontend shows "Endpoint not found"?**
- Update the API URL in `public/index.html` line ~50:
```javascript
const API_URL = 'https://doctor-booking-api-xxxx.onrender.com';
```
- Save, commit, and Vercel auto-deploys

**Render says "Build failed"?**
- Check build logs
- Ensure `npm install` succeeds locally: `npm install` in your backend folder
- Push again: `git push origin main`

---

## Timeline
| Task | Time | Status |
|------|------|--------|
| GitHub Repo | 2 min | ⏳ Manual |
| Push Code | 3 min | ⏳ Manual |
| Render Deploy | 15 min | ⏳ Manual |
| Vercel Deploy | 10 min | ⏳ Manual |
| Test Live | 5 min | ⏳ Manual |
| Record Video | 40 min | ⏳ Manual |
| Submit | 2 min | ⏳ Manual |
| **Total** | **77 min** | - |

Everything is ready. Start with Step 1 (GitHub) and work through in order. Each step takes the time listed.
