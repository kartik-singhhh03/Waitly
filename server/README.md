# Waitlist Wizard Backend

Express.js backend server for Waitlist Wizard.

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (see `.env.example`)

3. Run database migrations (see `db/schema.sql`)

4. Start the server:
```bash
npm start
```

## Development

```bash
npm run dev
```

This uses nodemon for auto-reload.

## Project Structure

```
server/
├── index.js           # Main server file
├── db/
│   ├── index.js      # Database connection
│   └── schema.sql    # Database schema
├── middleware/
│   ├── auth.js       # JWT authentication
│   └── rateLimit.js  # API rate limiting
└── routes/
    ├── subscribe.js   # Public subscribe endpoint
    ├── auth.js       # Authentication routes
    ├── projects.js   # Project management
    ├── entries.js     # Waitlist entries
    ├── stats.js      # Statistics
    └── public.js     # Public endpoints
```

## Environment Variables

- `DATABASE_URL` - Neon PostgreSQL connection string
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)
- `FRONTEND_URL` - Frontend URL for CORS
- `JWT_SECRET` - Secret for JWT tokens

## API Documentation

See main `SETUP.md` for full API documentation.

