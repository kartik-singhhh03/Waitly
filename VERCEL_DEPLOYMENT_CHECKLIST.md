# 🚨 CRITICAL: Vercel Deployment Checklist

## ❌ Current Errors: 500 Internal Server Error

Your app is deployed but the API is failing. Here's how to fix it:

---

## 1️⃣ Check Vercel Environment Variables (CRITICAL)

Go to: **https://vercel.com/dashboard → Your Project → Settings → Environment Variables**

### Required Variables:

```bash
DATABASE_URL
Value: postgresql://user:password@host:5432/database?sslmode=require
Environment: ✅ Production, ✅ Preview, ✅ Development

JWT_SECRET
Value: (32+ character random string)
Environment: ✅ Production, ✅ Preview, ✅ Development

NODE_ENV
Value: production
Environment: ✅ Production only
```

### Generate JWT_SECRET:

**Windows PowerShell:**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

**Copy the output and paste as JWT_SECRET value**

---

## 2️⃣ Verify Database Setup

Your database schema MUST be created before signup works.

### If Using Neon:
1. Go to https://console.neon.tech
2. Select your project
3. Click "SQL Editor"
4. Copy entire contents of `server/db/schema.sql`
5. Paste and run
6. Should see: "Success" messages

### If Using Supabase:
1. Go to https://app.supabase.com
2. Select your project
3. Go to "SQL Editor"
4. Create new query
5. Copy entire contents of `server/db/schema.sql`
6. Run query

### Verify Tables Exist:
```sql
-- Run this to check:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

**Should see:**
- users
- profiles
- projects
- waitlist_entries
- api_rate_limits

---

## 3️⃣ Redeploy After Setting Variables

After setting environment variables, you MUST redeploy:

### Option A: Via Vercel Dashboard
1. Go to Deployments tab
2. Click "..." menu on latest deployment
3. Click "Redeploy"
4. Select "Use existing Build Cache: No"
5. Click "Redeploy"

### Option B: Via Git Push
```bash
git commit --allow-empty -m "Trigger redeploy"
git push origin main
```

---

## 4️⃣ Check Vercel Function Logs

After redeploying, check if errors persist:

1. Go to Vercel Dashboard → Your Project
2. Click "Deployments"
3. Click latest deployment
4. Click "Functions" tab
5. Find `/api/index.js`
6. Click "View Logs"

**Look for:**
- ❌ "Missing required environment variables" → Go back to step 1
- ❌ "connect ECONNREFUSED" → Database URL is wrong
- ❌ "relation does not exist" → Database schema not created (step 2)
- ✅ No errors → Should be working!

---

## 5️⃣ Test After Fixes

### A. Health Check
```bash
curl https://waitly-sigma.vercel.app/health
```

**Expected:**
```json
{"status":"ok","timestamp":"...","environment":"production","version":"1.0.0"}
```

**If fails:** Environment variables not set correctly

### B. Test Signup
```bash
curl -X POST https://waitly-sigma.vercel.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","displayName":"Test User"}'
```

**Expected:**
```json
{"success":true,"token":"...","user":{...}}
```

**If fails with 500:**
- Check Vercel logs (step 4)
- Verify DATABASE_URL is correct
- Verify JWT_SECRET is set
- Verify database schema is created

---

## 🐛 Common Issues & Solutions

### Issue: "Missing required environment variables"
**Solution:**
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Add DATABASE_URL and JWT_SECRET
3. Make sure they're checked for Production, Preview, Development
4. Redeploy (step 3)

### Issue: "connect ECONNREFUSED" or "connect ETIMEDOUT"
**Solution:**
1. DATABASE_URL is incorrect
2. Check your database provider dashboard
3. Copy the connection string exactly
4. Make sure it ends with `?sslmode=require`
5. Update in Vercel settings
6. Redeploy

### Issue: "relation 'users' does not exist"
**Solution:**
1. Database schema not created
2. Go to your database SQL editor
3. Run entire `server/db/schema.sql` file
4. Verify tables exist (see step 2)
5. Try signup again

### Issue: "Invalid token" or "JsonWebTokenError"
**Solution:**
1. JWT_SECRET not set or changed
2. Generate new secret (step 1)
3. Set in Vercel dashboard
4. Redeploy
5. Users need to log in again

### Issue: Still getting 500 errors
**Solution:**
1. Check Vercel Function Logs (step 4)
2. Look for specific error message
3. Common causes:
   - Missing npm dependencies (rebuild)
   - Syntax error in code (check last commit)
   - Database connection timeout (increase DATABASE_URL pool settings)

---

## ✅ Verification Steps

Once you've completed the above:

1. ✅ Visit: `https://waitly-sigma.vercel.app/health`
   - Should return: `{"status":"ok",...}`

2. ✅ Visit: `https://waitly-sigma.vercel.app/auth`
   - Should load the signup page

3. ✅ Create an account
   - Should redirect to dashboard

4. ✅ Create a project
   - Should generate API key and embed code

5. ✅ Test embed script
   - Copy embed code
   - Test on any website

---

## 📋 Quick Reference Commands

### Check if DATABASE_URL is set in Vercel:
```bash
vercel env ls
```

### Pull Vercel env to local:
```bash
vercel env pull .env.local
```

### Check Vercel logs in real-time:
```bash
vercel logs --follow
```

### Force redeploy:
```bash
git commit --allow-empty -m "Force redeploy"
git push
```

---

## 🆘 Still Not Working?

1. **Check Vercel Build Logs:**
   - Dashboard → Deployments → Click latest → View Build Logs
   - Look for errors during build

2. **Check Vercel Function Logs:**
   - Dashboard → Deployments → Click latest → Functions → View Logs
   - This shows runtime errors

3. **Test locally:**
   ```bash
   npm run dev:all
   ```
   - If works locally but not on Vercel → environment variable issue

4. **Compare environment variables:**
   - Local: `.env` file
   - Vercel: Dashboard → Settings → Environment Variables
   - Make sure they match (except VITE_API_URL should be empty on Vercel)

---

## 📞 Database Provider Help

### Neon:
- Dashboard: https://console.neon.tech
- Docs: https://neon.tech/docs
- Discord: https://discord.gg/neon

### Supabase:
- Dashboard: https://app.supabase.com
- Docs: https://supabase.com/docs
- Discord: https://discord.gg/supabase

---

**After completing all steps, your app should work perfectly!** 🎉

If you're still having issues after following ALL steps above, check the Vercel function logs for the specific error message.
