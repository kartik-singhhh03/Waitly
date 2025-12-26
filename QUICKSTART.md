# Quick Start Guide

Get Waitlist Wizard running in 5 minutes!

## 1. Get a Database

1. Sign up at [neon.tech](https://neon.tech) (free tier available)
2. Create a new project
3. Copy your connection string

## 2. Set Up Backend

```bash
cd server
npm install

# Create .env file
cat > .env << EOF
DATABASE_URL=your-neon-connection-string-here
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:8080
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
EOF

# Run database schema
npm run setup-db

# Start server
npm start
```

## 3. Set Up Frontend

```bash
# From project root
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:3001" > .env

# Start frontend
npm run dev
```

## 4. Open & Sign Up

1. Open http://localhost:8080
2. Sign up for an account
3. Create your first project
4. Copy the embed code or API key

## Done! 🎉

Your waitlist is ready. Use the API key or embed script to start collecting signups.

For detailed documentation, see [SETUP.md](./SETUP.md).

