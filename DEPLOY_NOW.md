# 🚀 Quick Start Guide - Deploy to Vercel in 5 Minutes

## Prerequisites
- [ ] GitHub account
- [ ] Vercel account (free: https://vercel.com)
- [ ] Database (Neon recommended: https://neon.tech - free tier)

---

## Step 1: Database Setup (2 minutes)

### Option A: Neon (Recommended - Free & Vercel-optimized)
1. Go to https://neon.tech
2. Sign up / Sign in
3. Click "Create Project"
4. Copy the connection string
5. Go to SQL Editor → Run this schema: `server/db/schema.sql`

### Option B: Supabase
1. Go to https://supabase.com
2. Create new project
3. Settings → Database → Connection pooling → Copy connection string
4. Go to SQL Editor → Run schema from `server/db/schema.sql`

**Save your connection string:**
```
postgresql://username:password@host:5432/database?sslmode=require
```

---

## Step 2: Generate JWT Secret (30 seconds)

**Windows PowerShell:**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

**Mac/Linux:**
```bash
openssl rand -hex 32
```

**Online Generator:**
https://generate-secret.vercel.app/32

**Save this secret** - you'll need it next!

---

## Step 3: Deploy to Vercel (2 minutes)

### Via GitHub (Recommended)

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Production ready deployment"
   git push origin main
   ```

2. **Import to Vercel:**
   - Go to https://vercel.com/new
   - Click "Import Git Repository"
   - Select your repo
   - Click "Import"

3. **Set Environment Variables:**
   - Click "Environment Variables"
   - Add these THREE variables:
   
   ```
   Name: DATABASE_URL
   Value: <your connection string from Step 1>
   Environment: Production, Preview, Development
   
   Name: JWT_SECRET  
   Value: <your secret from Step 2>
   Environment: Production, Preview, Development
   
   Name: NODE_ENV
   Value: production
   Environment: Production
   ```

4. **Deploy:**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Done! 🎉

---

## Step 4: Test Deployment (1 minute)

### Test Health Endpoint
```bash
curl https://your-app.vercel.app/health
```

**Expected:** `{"status":"ok","timestamp":"2025-01-02T...","environment":"production"}`

### Test Signup
```bash
curl -X POST https://your-app.vercel.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","displayName":"Test"}'
```

**Expected:** `{"success":true,"token":"...","user":{...}}`

### Open in Browser
```
https://your-app.vercel.app
```

Sign up → Create project → Get embed code → Done!

---

## Step 5: Get Your Embed Code

1. Sign up / Log in to your deployed app
2. Create a new project
3. Copy the embed code:

```html
<script 
  src="https://your-app.vercel.app/embed.js"
  data-project="your-project-slug"
  data-api-key="wl_live_xxxxx">
</script>
```

4. Paste on any website
5. Test by entering an email

---

## 🎉 You're Live!

Your waitlist is now production-ready and deployed!

**What's Working:**
- ✅ Authentication (signup/login)
- ✅ Dashboard
- ✅ Project management
- ✅ Waitlist entries
- ✅ Public embed script
- ✅ Rate limiting
- ✅ Security hardening

---

## 🐛 Troubleshooting

### "Missing required environment variables"
→ Go back to Step 3, add `DATABASE_URL` and `JWT_SECRET` in Vercel

### "Cannot connect to database"
→ Check your `DATABASE_URL` is correct and includes `?sslmode=require`

### "Unexpected token '<'"
→ This is fixed! If you still see it, make sure `VITE_API_URL` is NOT set in Vercel

### Deployment fails
→ Check Vercel logs: Dashboard → Your Project → Deployments → Click latest → View Logs

---

## 🔗 Useful Links

- **Your Dashboard:** https://your-app.vercel.app/dashboard
- **Health Check:** https://your-app.vercel.app/health
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Database Dashboard:** (Neon/Supabase dashboard link)

---

## 📝 Next Steps

1. **Custom Domain** (optional)
   - Vercel Dashboard → Domains → Add domain

2. **Email Notifications** (optional)
   - Add Resend API key for magic links
   - See: `server/routes/auth-magic-link.js`

3. **Analytics** (optional)
   - Vercel Analytics (free)
   - Dashboard → Analytics → Enable

4. **Backup Database**
   - Neon: Automatic backups included
   - Or: Set up manual backup schedule

---

## 🆘 Need Help?

Check the detailed docs:
- [PRODUCTION_READY_REPORT.md](PRODUCTION_READY_REPORT.md) - Full audit report
- [VERCEL_ENV_SETUP.md](VERCEL_ENV_SETUP.md) - Environment variables guide
- Vercel Discord: https://vercel.com/discord
- Neon Discord: https://discord.gg/neon

---

**Total Time:** ~5 minutes
**Cost:** $0 (using free tiers)
**Status:** 🟢 Production Ready
