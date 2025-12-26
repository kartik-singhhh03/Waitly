# Waitlist Wizard - Setup Guide

This guide will help you set up Waitlist Wizard with Node.js Express backend and Neon PostgreSQL database.

## Prerequisites

- Node.js 18+ and npm
- A Neon PostgreSQL database (free tier available at [neon.tech](https://neon.tech))
- Basic knowledge of environment variables

## Step 1: Database Setup

### 1.1 Create Neon Database

1. Go to [neon.tech](https://neon.tech) and sign up
2. Create a new project
3. Copy your connection string (it looks like: `postgresql://user:password@host/database?sslmode=require`)

### 1.2 Run Database Schema

1. Connect to your Neon database using their SQL editor or any PostgreSQL client
2. Copy the contents of `server/db/schema.sql`
3. Execute the SQL in your database

Alternatively, you can use the Neon CLI or psql:

```bash
psql "your-connection-string" -f server/db/schema.sql
```

## Step 2: Backend Setup

### 2.1 Install Dependencies

```bash
cd server
npm install
```

### 2.2 Configure Environment Variables

Create a `.env` file in the `server` directory:

```env
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# Server
PORT=3001
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:8080

# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

**Important:** Generate a strong JWT secret for production:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2.3 Start the Backend Server

```bash
npm start
# or for development with auto-reload:
npm run dev
```

The server should start on `http://localhost:3001`

## Step 3: Frontend Setup

### 3.1 Install Dependencies

```bash
# From project root
npm install
```

### 3.2 Configure Environment Variables

Create a `.env` file in the project root:

```env
VITE_API_URL=http://localhost:3001
```

### 3.3 Start the Frontend

```bash
npm run dev
```

The frontend should start on `http://localhost:8080`

## Step 4: Verify Setup

1. Open `http://localhost:8080` in your browser
2. Sign up for a new account
3. Create a project
4. Test the subscribe endpoint using the API key

## API Endpoints

### Public Endpoints

- `POST /api/subscribe` - Subscribe to waitlist
  ```json
  {
    "apiKey": "wl_live_xxx",
    "email": "user@example.com",
    "ref": "optional_referral_code"
  }
  ```

### Authenticated Endpoints (require Bearer token)

- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get single project
- `POST /api/projects` - Create project
- `PATCH /api/projects/:id` - Update project
- `POST /api/projects/:id/rotate-key` - Rotate API key
- `DELETE /api/projects/:id` - Delete project
- `GET /api/entries/:projectId` - Get waitlist entries
- `DELETE /api/entries/:entryId?projectId=xxx` - Delete entry
- `DELETE /api/entries/purge/:projectId` - Purge all entries
- `GET /api/stats/:projectId` - Get project stats

### Auth Endpoints

- `POST /api/auth/signup` - Sign up
- `POST /api/auth/signin` - Sign in
- `GET /api/auth/me` - Get current user

## Deployment

### Backend Deployment (Vercel/Railway/Render)

1. Set environment variables in your hosting platform
2. Point the build command to: `cd server && npm install && npm start`
3. Set the start command to: `node server/index.js`

### Frontend Deployment (Vercel/Netlify)

1. Set `VITE_API_URL` to your backend URL
2. Build and deploy

### Database

Your Neon database is already hosted, just make sure your `DATABASE_URL` is correct in production.

## Troubleshooting

### Database Connection Issues

- Verify your `DATABASE_URL` is correct
- Check that your Neon database allows connections from your IP
- Ensure SSL mode is set correctly

### CORS Errors

- Update `FRONTEND_URL` in server `.env` to match your frontend URL
- Check that the frontend is making requests to the correct backend URL

### Authentication Issues

- Clear localStorage: `localStorage.removeItem('token')`
- Check that `JWT_SECRET` is set correctly
- Verify token is being sent in Authorization header

## Features Implemented

✅ POST /api/subscribe endpoint with:
- Email validation
- Deduplication per project
- Rate limiting per API key
- Referral code support
- Position calculation
- Position-less mode (tier-based)

✅ Dashboard features:
- Total signups
- New signups today
- Recent signups table
- CSV export
- Delete/purge waitlist
- Rotate API key

✅ Integration snippets:
- React
- Next.js
- Plain HTML
- Fetch API
- Embed script (1-line install)

✅ Waitlist modes:
- FIFO
- Random
- Score-based
- Manual

✅ Additional features:
- Position-less UX mode
- Privacy-first mode
- Waitlist freeze
- Auth migration export (Supabase, Firebase, Clerk)

## Next Steps

1. Set up email service (Resend/Brevo) for launch day emails
2. Add CAPTCHA for abuse prevention
3. Implement pricing logic
4. Add analytics dashboard
5. Set up monitoring and logging

## Support

For issues or questions, check the codebase or create an issue in the repository.

