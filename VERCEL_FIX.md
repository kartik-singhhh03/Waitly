# Vercel Build Error Fix

## Issue
Exit code 127 during build - "command not found"

## Root Cause
The build was failing because:
1. Server code was trying to `process.exit(1)` during build when env vars weren't set
2. Database connection pool was trying to exit on errors during build

## Fixes Applied

### 1. `server/index.js`
- Don't exit during Vercel build phase
- Only validate env vars at runtime, not during build

### 2. `server/db/index.js`
- Don't exit process on database errors during Vercel build
- Only exit in local development

### 3. `api/index.js`
- Simple export of Express app (it's already a function)

### 4. `package.json`
- Moved all server dependencies to root (Vercel installs from root)

## Deployment Steps

1. **Set Environment Variables in Vercel Dashboard:**
   - Go to Project Settings → Environment Variables
   - Add:
     - `DATABASE_URL`
     - `JWT_SECRET`
     - `FRONTEND_URL`
     - `NODE_ENV=production`

2. **Deploy:**
   ```bash
   vercel --prod
   ```

3. **Verify:**
   - Check build logs in Vercel dashboard
   - Test API: `https://your-app.vercel.app/api/health`

## If Build Still Fails

Check Vercel build logs for:
- Missing dependencies
- Syntax errors
- Module resolution issues

The build should now work because:
- No process.exit() during build
- All dependencies in root package.json
- Lazy loading prevents DB connection during build

