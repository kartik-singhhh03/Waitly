# 🏗️ Waitly Architecture - Vercel Deployment

## System Overview

```
┌───────────────────────────────────────────────────────────────────┐
│                         VERCEL PLATFORM                            │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │                    FRONTEND (Static)                     │     │
│  │  Built with: Vite + React + TypeScript                   │     │
│  ├─────────────────────────────────────────────────────────┤     │
│  │                                                           │     │
│  │  GET  /                    → index.html                  │     │
│  │  GET  /dashboard           → index.html (SPA routing)    │     │
│  │  GET  /projects/:id        → index.html (SPA routing)    │     │
│  │  GET  /embed.js            → public/embed.js             │     │
│  │                                                           │     │
│  └─────────────────────────────────────────────────────────┘     │
│                              │                                     │
│                              │ API Calls                           │
│                              ▼                                     │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │            BACKEND (Serverless Functions)                │     │
│  │  Built with: Express.js → api/index.js                   │     │
│  ├─────────────────────────────────────────────────────────┤     │
│  │                                                           │     │
│  │  PUBLIC ENDPOINTS (No Auth Required):                    │     │
│  │  ├─ GET  /health                                         │     │
│  │  └─ POST /api/subscribe     [Rate Limited]              │     │
│  │                                                           │     │
│  │  AUTHENTICATION ENDPOINTS:                               │     │
│  │  ├─ POST /api/auth/signup                               │     │
│  │  ├─ POST /api/auth/signin                               │     │
│  │  ├─ GET  /api/auth/me       [JWT Required]             │     │
│  │  ├─ POST /api/auth/magic-link/send                      │     │
│  │  └─ POST /api/auth/magic-link/verify                    │     │
│  │                                                           │     │
│  │  PROTECTED ENDPOINTS (JWT Required):                     │     │
│  │  ├─ GET    /api/projects                                │     │
│  │  ├─ POST   /api/projects                                │     │
│  │  ├─ GET    /api/projects/:id                            │     │
│  │  ├─ PATCH  /api/projects/:id                            │     │
│  │  ├─ DELETE /api/projects/:id                            │     │
│  │  ├─ POST   /api/projects/:id/rotate-key                 │     │
│  │  │                                                        │     │
│  │  ├─ GET    /api/entries/:projectId                      │     │
│  │  ├─ DELETE /api/entries/:entryId                        │     │
│  │  ├─ DELETE /api/entries/purge/:projectId                │     │
│  │  │                                                        │     │
│  │  └─ GET    /api/stats/:projectId                        │     │
│  │                                                           │     │
│  └─────────────────────────────────────────────────────────┘     │
│                              │                                     │
│                              │ SQL Queries                         │
│                              ▼                                     │
└───────────────────────────────────────────────────────────────────┘
                               │
                               │ SSL Connection
                               │ (Connection Pooling: max 2)
                               ▼
        ┌─────────────────────────────────────────────┐
        │       PostgreSQL Database (External)         │
        │       Provider: Neon / Supabase / Railway    │
        ├─────────────────────────────────────────────┤
        │                                               │
        │  Tables:                                      │
        │  ├─ users                                     │
        │  ├─ profiles                                  │
        │  ├─ projects                                  │
        │  ├─ waitlist_entries                          │
        │  └─ api_rate_limits                           │
        │                                               │
        └─────────────────────────────────────────────┘
```

---

## Data Flow

### 1. User Signup Flow
```
User → Frontend → POST /api/auth/signup
                       │
                       ├─ Validate email/password
                       ├─ Hash password (bcrypt)
                       ├─ Check if user exists
                       ├─ INSERT INTO users
                       ├─ INSERT INTO profiles
                       ├─ Generate JWT token
                       └─ Return { token, user }
                       
Frontend ← Store token in localStorage
```

### 2. Protected Request Flow
```
User → Frontend → GET /api/projects
                       │
                       ├─ Extract JWT from Authorization header
                       ├─ Verify token signature
                       ├─ Check user exists in DB
                       ├─ Attach user to request
                       ├─ Execute route handler
                       └─ Return JSON response
                       
Frontend ← Display data
```

### 3. Public Waitlist Subscribe Flow
```
Website Visitor → Embed Script → POST /api/subscribe
                                       │
                                       ├─ Validate API key
                                       ├─ Check rate limit
                                       ├─ Validate email
                                       ├─ Check for duplicate
                                       ├─ INSERT INTO waitlist_entries
                                       ├─ Calculate position
                                       └─ Return { position, referralCode }
                                       
Embed Script ← Display success message
```

---

## Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     SECURITY LAYERS                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Layer 1: Network                                            │
│  ├─ HTTPS Only (Vercel)                                     │
│  ├─ CORS configured                                         │
│  └─ Helmet security headers                                 │
│                                                              │
│  Layer 2: Rate Limiting                                      │
│  ├─ 100 requests / 15 minutes per IP (API routes)          │
│  └─ Per-API-key rate limiting (subscribe endpoint)          │
│                                                              │
│  Layer 3: Authentication                                     │
│  ├─ JWT with HS256 algorithm                                │
│  ├─ 7-day token expiration                                  │
│  ├─ User verification on each request                       │
│  └─ 32+ character secret required                           │
│                                                              │
│  Layer 4: Input Validation                                   │
│  ├─ Email format validation                                 │
│  ├─ Password requirements                                   │
│  ├─ SQL parameterization (injection prevention)             │
│  └─ Request body size limits (10MB max)                     │
│                                                              │
│  Layer 5: Data Protection                                    │
│  ├─ Password hashing (bcrypt, 10 rounds)                   │
│  ├─ SSL for database connections                            │
│  ├─ No secrets in frontend code                             │
│  └─ Error sanitization (no stack traces in prod)            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Environment Variables

### Frontend (Public - Exposed to Browser)
```
VITE_API_URL (optional)
  ├─ Development: http://localhost:3001
  ├─ Production:  (empty - uses relative paths)
  └─ Custom:      https://yourdomain.com
```

### Backend (Private - Server Only)
```
DATABASE_URL (required)
  └─ postgresql://user:pass@host:5432/db?sslmode=require

JWT_SECRET (required)
  ├─ Minimum: 32 characters
  └─ Generated: crypto.randomBytes(32).toString('hex')

NODE_ENV (required)
  ├─ development
  └─ production

PORT (optional)
  └─ Default: 3001

CORS_ORIGIN (optional)
  └─ Default: * (allow all)
```

---

## Deployment Flow

```
Developer Machine
        │
        │ git push
        ▼
GitHub Repository
        │
        │ webhook
        ▼
Vercel Platform
        │
        ├─ 1. Install dependencies (npm install)
        ├─ 2. Build frontend (vite build)
        ├─ 3. Create serverless function (api/index.js)
        ├─ 4. Deploy to CDN (static assets)
        └─ 5. Configure routes (vercel.json)
        │
        ▼
Live URL: https://your-app.vercel.app
```

---

## Request/Response Flow

### Example: Create Project

```
┌──────────────┐
│   Browser    │
└──────┬───────┘
       │
       │ 1. POST /api/projects
       │    Authorization: Bearer <jwt>
       │    Body: { name, slug }
       ▼
┌──────────────────────┐
│  Vercel Edge         │
│  (Route Handler)     │
└──────┬───────────────┘
       │
       │ 2. Route to /api/index.js
       ▼
┌──────────────────────┐
│  Express App         │
│  (Serverless)        │
└──────┬───────────────┘
       │
       │ 3. Helmet → CORS → JSON Parser
       ▼
┌──────────────────────┐
│  Rate Limiter        │
│  (100/15min)         │
└──────┬───────────────┘
       │
       │ 4. Check IP rate limit
       ▼
┌──────────────────────┐
│  Auth Middleware     │
└──────┬───────────────┘
       │
       │ 5. Verify JWT
       │ 6. Load user from DB
       ▼
┌──────────────────────┐
│  Route Handler       │
│  (projects.js)       │
└──────┬───────────────┘
       │
       │ 7. Validate input
       │ 8. Check slug uniqueness
       ▼
┌──────────────────────┐
│  Database Query      │
└──────┬───────────────┘
       │
       │ 9. INSERT INTO projects
       │ 10. RETURNING *
       ▼
┌──────────────────────┐
│  Response            │
└──────┬───────────────┘
       │
       │ 11. { success: true, project: {...} }
       ▼
┌──────────────┐
│   Browser    │
│  (Update UI) │
└──────────────┘
```

---

## File Structure

```
waitlist-wizard-main/
├── api/
│   └── index.js                    # Vercel serverless entry point
│
├── server/
│   ├── index.js                    # Express app (exported for Vercel)
│   ├── db/
│   │   ├── index.js               # Database connection pool
│   │   └── schema.sql             # Database schema
│   ├── middleware/
│   │   ├── auth.js                # JWT authentication
│   │   └── rateLimit.js           # Rate limiting logic
│   └── routes/
│       ├── auth.js                # Authentication endpoints
│       ├── auth-magic-link.js     # Magic link auth
│       ├── projects.js            # Project CRUD
│       ├── entries.js             # Waitlist entries
│       ├── stats.js               # Statistics
│       ├── subscribe.js           # Public subscribe endpoint
│       └── public.js              # Other public endpoints
│
├── src/
│   ├── lib/
│   │   └── api.ts                 # Frontend API client (FIXED)
│   ├── contexts/
│   │   └── AuthContext.tsx        # Auth state management
│   ├── pages/
│   │   ├── Auth.tsx               # Login/signup page
│   │   ├── Dashboard.tsx          # Dashboard page
│   │   └── ProjectDetail.tsx      # Project management
│   └── components/                # UI components
│
├── public/
│   └── embed.js                   # Embeddable waitlist widget (SECURED)
│
├── vercel.json                    # Vercel configuration (UPDATED)
├── .env.example                   # Environment variables template (NEW)
├── DEPLOY_NOW.md                  # Quick deployment guide (NEW)
├── PRODUCTION_READY_REPORT.md     # Security audit (NEW)
├── VERCEL_ENV_SETUP.md            # Env setup guide (NEW)
└── COMPLETE_FIX_SUMMARY.md        # Fix summary (NEW)
```

---

## Monitoring & Debugging

### Health Check
```bash
curl https://your-app.vercel.app/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-02T...",
  "environment": "production",
  "version": "1.0.0"
}
```

### Logs
```bash
# Via Vercel CLI
vercel logs

# Via Vercel Dashboard
Dashboard → Deployments → Functions → View Logs
```

### Common Issues
1. **"Unexpected token '<'"** → ✅ Fixed in api.ts
2. **"Missing env vars"** → Set in Vercel dashboard
3. **"Connect ECONNREFUSED"** → Check DATABASE_URL
4. **"Invalid token"** → User needs to re-login

---

## Performance Characteristics

### Vercel Serverless
- **Cold start:** ~500ms first request
- **Warm requests:** ~50-100ms
- **Concurrent:** Up to 1000 requests/second
- **Region:** Auto-deployed to global edge

### Database (Neon)
- **Connection time:** ~100ms (pooled)
- **Query time:** ~10-50ms (typical)
- **Connection pool:** 2 max (serverless optimized)
- **SSL:** Required

### Frontend (Static)
- **Load time:** ~500ms (cached)
- **CDN:** Global (Vercel Edge Network)
- **Caching:** Aggressive for static assets

---

## Scaling Considerations

### Current Setup (Good for):
- ✅ 0-10k waitlist entries
- ✅ 100+ projects
- ✅ 1000+ daily visitors
- ✅ Multiple concurrent users

### To Scale Further:
1. **Database:** Upgrade Neon tier or use Supabase Pro
2. **Caching:** Add Redis for rate limiting
3. **CDN:** Custom domain with Cloudflare
4. **Monitoring:** Add Sentry for error tracking

---

**Status:** 🟢 Production Ready  
**Last Updated:** January 2, 2026  
**Architecture Version:** 1.0
