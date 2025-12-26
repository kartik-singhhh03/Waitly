# Waitlist Wizard

A fast, privacy-first waitlist SaaS built with React, Express, and Neon PostgreSQL.

**Launch before you're ready.** A simple, privacy-first waitlist you can add in 5 minutes.

## Features

✅ **POST /api/subscribe** - Public API endpoint with:
- Email validation
- Deduplication per project
- Rate limiting per API key
- Referral code support
- Position calculation
- Position-less mode (tier-based)

✅ **Dashboard** - Full founder view:
- Total signups & today's signups
- Recent signups table
- CSV export
- Delete/purge waitlist
- Rotate API key

✅ **Integration Snippets** - Copy-paste ready:
- React component
- Next.js component
- Plain HTML
- Fetch API example
- One-line embed script

✅ **Waitlist Modes**:
- FIFO (First come, first serve)
- Random (Fair lottery)
- Score-based (Internal priority)
- Manual (Founder approval)

✅ **Additional Features**:
- Position-less UX mode (Top 10%, High priority, etc.)
- Privacy-first mode (No cookies, no tracking)
- Waitlist freeze (Pause accepting signups)
- Auth migration export (Supabase, Firebase, Clerk compatible)

## Tech Stack

**Frontend:**
- React + TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- React Query

**Backend:**
- Node.js + Express
- Neon PostgreSQL
- JWT Authentication
- Rate Limiting

## Quick Start

### Prerequisites

- Node.js 18+
- Neon PostgreSQL database ([Get free account](https://neon.tech))

### Setup

1. **Clone the repository:**
```bash
git clone <YOUR_GIT_URL>
cd waitlist-wizard
```

2. **Set up the database:**
   - Create a Neon PostgreSQL database
   - Run the schema: `server/db/schema.sql`
   - Copy your connection string

3. **Backend setup:**
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your DATABASE_URL and other settings
npm start
```

4. **Frontend setup:**
```bash
# From project root
npm install
# Create .env file with: VITE_API_URL=http://localhost:3001
npm run dev
```

5. **Open** `http://localhost:8080` and sign up!

For detailed setup instructions, see [SETUP.md](./SETUP.md).

## Project Structure

```
├── server/              # Express backend
│   ├── index.js        # Main server
│   ├── db/             # Database connection & schema
│   ├── middleware/     # Auth, rate limiting
│   └── routes/         # API routes
├── src/                # React frontend
│   ├── components/     # UI components
│   ├── pages/          # Page components
│   ├── hooks/          # React hooks
│   └── lib/            # Utilities & API client
└── public/             # Static assets
    └── embed.js        # Embed script
```

## API Documentation

### Public Endpoints

**POST /api/subscribe**
```json
{
  "apiKey": "wl_live_xxx",
  "email": "user@example.com",
  "ref": "optional_referral_code"
}
```

Response:
```json
{
  "success": true,
  "position": 124,
  "referralCode": "abc123"
}
```

### Authenticated Endpoints

All authenticated endpoints require `Authorization: Bearer <token>` header.

- `GET /api/projects` - List all projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project
- `PATCH /api/projects/:id` - Update project
- `POST /api/projects/:id/rotate-key` - Rotate API key
- `DELETE /api/projects/:id` - Delete project
- `GET /api/entries/:projectId` - Get entries
- `DELETE /api/entries/:entryId` - Delete entry
- `DELETE /api/entries/purge/:projectId` - Purge all entries
- `GET /api/stats/:projectId` - Get stats

See [SETUP.md](./SETUP.md) for full API documentation.

## Development

```bash
# Frontend (port 8080)
npm run dev

# Backend (port 3001)
cd server && npm run dev
```

## Deployment

### Backend
Deploy to Vercel, Railway, or Render. Set environment variables:
- `DATABASE_URL`
- `JWT_SECRET`
- `FRONTEND_URL`
- `NODE_ENV=production`

### Frontend
Deploy to Vercel or Netlify. Set:
- `VITE_API_URL` to your backend URL

### Database
Neon PostgreSQL is already hosted. Just ensure your connection string is correct.

## License

MIT

## Support

For setup help, see [SETUP.md](./SETUP.md).
