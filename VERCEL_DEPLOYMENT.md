# Vercel Deployment Guide

## Minimal Changes Made

### Files Changed:

1. **`api/index.js`** (NEW)
   - Exports Express app for Vercel serverless functions
   - Single entry point for all API routes

2. **`server/index.js`** (MODIFIED)
   - Removed `app.listen()` when running on Vercel
   - Added check for `process.env.VERCEL`
   - Exports app for serverless use

3. **`server/db/index.js`** (MODIFIED)
   - Optimized connection pool for serverless:
     - Reduced `max` connections from 20 to 2
     - Reduced `idleTimeoutMillis` from 30s to 10s
     - Added `allowExitOnIdle: true` for proper cleanup

4. **`vercel.json`** (MODIFIED)
   - Added API routing: `/api/*` → `/api/index.js`
   - Added function configuration (30s max duration)
   - Added CORS headers for API routes

## Deployment Steps

### 1. Install Dependencies

Make sure `server/package.json` has all dependencies. Vercel will install them automatically.

### 2. Set Environment Variables in Vercel

Go to your Vercel project settings → Environment Variables and add:

```
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
JWT_SECRET=your-strong-random-secret
FRONTEND_URL=https://your-app.vercel.app
NODE_ENV=production
```

### 3. Deploy

**Option A: Via Vercel Dashboard**
1. Push your code to GitHub
2. Import repository in Vercel
3. Vercel will auto-detect and deploy

**Option B: Via Vercel CLI**
```bash
npm i -g vercel
vercel login
vercel
```

### 4. Verify Deployment

- Frontend: `https://your-app.vercel.app`
- API: `https://your-app.vercel.app/api/health`
- Subscribe: `https://your-app.vercel.app/api/subscribe`

## How It Works

### Request Flow:
1. User requests `/api/subscribe`
2. Vercel routes to `/api/index.js` (serverless function)
3. Express app handles the request
4. Response returned to user

### Database Connection:
- Neon Postgres works perfectly with serverless
- Connection pool is optimized for short-lived functions
- Connections are reused across invocations when possible
- Pool automatically cleans up idle connections

## Local Development

Your existing setup still works:

```bash
# Start backend locally
cd server
npm install
npm start

# Start frontend
npm run dev
```

The code detects the environment:
- **Local**: Starts Express server on port 3001
- **Vercel**: Exports app as serverless function

## Important Notes

1. **Stateless**: Serverless functions are stateless. Don't store data in memory between requests.

2. **Cold Starts**: First request may be slower (~1-2s). Subsequent requests are fast.

3. **Database**: Neon Postgres connection pooling works great with serverless. The optimized pool settings ensure efficient connection reuse.

4. **Rate Limiting**: Your existing rate limiting middleware works, but it's per-function instance. For global rate limiting, consider using Vercel's built-in rate limiting or an external service.

5. **Environment Variables**: All env vars must be set in Vercel dashboard. They're automatically available to serverless functions.

## Testing

After deployment, test these endpoints:

```bash
# Health check
curl https://your-app.vercel.app/api/health

# Subscribe (public)
curl -X POST https://your-app.vercel.app/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{"apiKey":"wl_live_xxx","email":"test@example.com"}'

# Auth (requires token)
curl https://your-app.vercel.app/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is set correctly in Vercel
- Check Neon dashboard for connection limits
- Ensure SSL is enabled (`sslmode=require`)

### CORS Errors
- Update `FRONTEND_URL` in Vercel env vars
- Check CORS headers in `vercel.json`

### Function Timeout
- Default max duration is 30s (configured in `vercel.json`)
- For longer operations, consider increasing or using background jobs

### Cold Start Performance
- First request is slower (normal for serverless)
- Consider using Vercel Pro for better performance
- Or use Edge Functions for simple routes

## Cost

- **Hobby (Free)**: 100GB bandwidth, 100 serverless function invocations/day
- **Pro ($20/mo)**: Unlimited bandwidth, unlimited invocations

For most use cases, the free tier is sufficient.

