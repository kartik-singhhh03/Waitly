# 🚀 Quick Deployment Guide

## Your Database is Ready!

**⚠️ IMPORTANT:** Get your Neon PostgreSQL connection string from the Neon dashboard. Never commit it to Git!

## Step 1: Setup Database Schema

Run this in Neon's SQL Editor or via CLI:

```bash
cd server
# Copy the schema.sql content and run it in Neon SQL Editor
# OR use psql with your connection string:
# psql "YOUR_CONNECTION_STRING_HERE" -f db/schema.sql
```

## Step 2: Deploy Frontend to Vercel

1. **Push to GitHub** (if not already)
2. **Go to [vercel.com](https://vercel.com)** → New Project
3. **Import your repository**
4. **Set Environment Variable:**
   - Key: `VITE_API_URL`
   - Value: `https://your-backend-url.com` (set after backend deploy)
5. **Deploy!**

## Step 3: Deploy Backend to AWS

### Option A: AWS Elastic Beanstalk (Easiest)

```bash
cd server
pip install awsebcli
eb init -p node.js waitlist-wizard-api
eb create waitlist-wizard-prod

# Set environment variables (replace YOUR_DATABASE_URL with your actual Neon connection string)
eb setenv \
  DATABASE_URL="YOUR_DATABASE_URL_HERE" \
  NODE_ENV=production \
  FRONTEND_URL="https://your-app.vercel.app" \
  JWT_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"

eb deploy
```

### Option B: AWS EC2

1. Launch EC2 instance (Ubuntu 22.04, t3.small)
2. SSH in and run:
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repo
git clone your-repo-url
cd waitlist-wizard-main/server
npm install --production

# Install PM2
sudo npm install -g pm2

# Create .env
nano .env
# Paste (get DATABASE_URL from Neon dashboard):
# DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
# NODE_ENV=production
# FRONTEND_URL=https://your-app.vercel.app
# JWT_SECRET=your-secret-here

# Start
pm2 start index.js --name waitlist-api
pm2 save
pm2 startup
```

## Step 4: Update Frontend URL

1. Go to Vercel dashboard
2. Update `VITE_API_URL` to your backend URL
3. Redeploy frontend

## Step 5: Test

1. Visit your Vercel URL
2. Sign up (magic link or password)
3. Create a project
4. Test the subscribe API

## ✅ Done!

Your waitlist SaaS is live!

## Environment Variables Summary

### Frontend (Vercel)
```
VITE_API_URL=https://your-backend-url.com
```

### Backend (AWS)
```
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
NODE_ENV=production
FRONTEND_URL=https://your-app.vercel.app
JWT_SECRET=your-strong-random-secret
```

## Cost Estimate

- **Vercel**: Free (hobby) or $20/month
- **AWS EC2**: ~$10-15/month (t3.small)
- **Neon PostgreSQL**: Free tier (0.5GB) or $19/month
- **Total**: $0-35/month

