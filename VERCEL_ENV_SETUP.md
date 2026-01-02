# 🚀 Vercel Environment Variables Setup

## ⚠️ CRITICAL: Required Environment Variables

Set these in **Vercel Dashboard → Your Project → Settings → Environment Variables**

### Backend (Serverless Function) Variables

These are **SERVER-SIDE ONLY** and never exposed to the browser:

```bash
# PostgreSQL Connection String (REQUIRED)
# Get this from your database provider (Neon, Supabase, Railway, etc.)
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require

# JWT Secret (REQUIRED)
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long

# Node Environment (REQUIRED)
NODE_ENV=production
```

### Frontend Variables

Frontend variables are **PUBLIC** (exposed to browser). Never put secrets here!

```bash
# API URL (OPTIONAL for Vercel - leave empty to use relative paths)
# For Vercel: LEAVE EMPTY or OMIT entirely
# For custom domains: Set to your domain
# VITE_API_URL=

# If you use a custom domain:
# VITE_API_URL=https://yourdomain.com
```

## ✅ How to Set Environment Variables in Vercel

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable:
   - **Name**: Variable name (e.g., `DATABASE_URL`)
   - **Value**: The actual value
   - **Environment**: Select `Production`, `Preview`, and `Development`
5. Click **Save**
6. **Redeploy** your project for changes to take effect

## 🔐 Security Best Practices

### ❌ NEVER expose these in frontend:
- `DATABASE_URL`
- `JWT_SECRET`
- API keys with write access
- Service role keys

### ✅ Safe for frontend (must start with `VITE_`):
- `VITE_API_URL` (only if needed for custom domains)
- Public configuration
- Feature flags

## 📝 Database Setup

1. **Create a PostgreSQL Database**
   - Recommended: [Neon](https://neon.tech) (free tier, Vercel-optimized)
   - Alternatives: Supabase, Railway, Render

2. **Get Connection String**
   ```
   postgresql://user:password@host:5432/database?sslmode=require
   ```

3. **Run Schema**
   - Copy contents from `server/db/schema.sql`
   - Run in your database's SQL editor
   - Or use the setup script:
     ```bash
     node server/scripts/setup-db.js
     ```

## 🧪 Testing Environment Variables

After setting variables in Vercel:

1. Trigger a new deployment
2. Check Vercel deployment logs for any missing env var errors
3. Test API endpoints:
   - `https://your-app.vercel.app/health` (should return `{"status":"ok"}`)
   - `https://your-app.vercel.app/api/auth/signup` (should accept POST requests)

## 🐛 Troubleshooting

### Error: "Missing required environment variables"
- Make sure variables are set in Vercel dashboard
- Check variable names match exactly (case-sensitive)
- Redeploy after adding variables

### Error: "Unexpected token '<'"
- Frontend is trying to call invalid API route
- Make sure `VITE_API_URL` is empty or omitted for Vercel
- Check that API routes are deployed at `/api/index.js`

### Error: "connect ECONNREFUSED"
- `DATABASE_URL` is incorrect or database is unreachable
- Verify connection string
- Check if database allows connections from Vercel IPs (0.0.0.0/0)

## 📚 More Info

- [Vercel Environment Variables Docs](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vite Environment Variables Docs](https://vitejs.dev/guide/env-and-mode.html)
