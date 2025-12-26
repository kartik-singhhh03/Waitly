# Deployment Guide

## Quick Deployment

### Frontend (Vercel)

1. **Connect Repository to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-detect Vite

2. **Set Environment Variables:**
   ```
   VITE_API_URL=https://your-backend-url.com
   ```

3. **Deploy:**
   - Vercel will automatically deploy on push
   - Or click "Deploy" in the dashboard

### Backend (AWS - EC2/Elastic Beanstalk/Lambda)

#### Option 1: AWS Elastic Beanstalk (Recommended)

1. **Install EB CLI:**
   ```bash
   pip install awsebcli
   ```

2. **Initialize:**
   ```bash
   cd server
   eb init -p node.js waitlist-wizard-api
   ```

3. **Create Environment:**
   ```bash
   eb create waitlist-wizard-prod
   ```

4. **Set Environment Variables:**
   ```bash
   eb setenv \
     DATABASE_URL="YOUR_DATABASE_URL_FROM_NEON_DASHBOARD" \
     NODE_ENV=production \
     FRONTEND_URL="https://your-app.vercel.app" \
     JWT_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"
   ```

5. **Deploy:**
   ```bash
   eb deploy
   ```

#### Option 2: AWS EC2

1. **Launch EC2 Instance:**
   - Ubuntu 22.04 LTS
   - t2.micro (free tier) or t3.small
   - Security Group: Allow HTTP (80), HTTPS (443), SSH (22)

2. **SSH into Instance:**
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   ```

3. **Install Node.js:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

4. **Clone and Setup:**
   ```bash
   git clone your-repo-url
   cd waitlist-wizard-main/server
   npm install --production
   ```

5. **Install PM2:**
   ```bash
   sudo npm install -g pm2
   ```

6. **Create .env:**
   ```bash
   nano .env
   # Paste environment variables
   ```

7. **Start with PM2:**
   ```bash
   pm2 start index.js --name waitlist-api
   pm2 save
   pm2 startup
   ```

8. **Setup Nginx (Reverse Proxy):**
   ```bash
   sudo apt install nginx
   sudo nano /etc/nginx/sites-available/waitlist-api
   ```

   Nginx config:
   ```nginx
   server {
       listen 80;
       server_name api.yourdomain.com;

       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   ```bash
   sudo ln -s /etc/nginx/sites-available/waitlist-api /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

#### Option 3: AWS Lambda (Serverless)

1. **Install Serverless Framework:**
   ```bash
   npm install -g serverless
   ```

2. **Use the provided `serverless.yml`**

3. **Deploy:**
   ```bash
   cd server
   serverless deploy
   ```

### Database (Neon PostgreSQL)

**⚠️ IMPORTANT:** Get your database connection string from the Neon dashboard. Never commit it to Git!

**Important:** Run the schema first:
```bash
cd server
npm run setup-db
```

Or manually run `server/db/schema.sql` in Neon's SQL editor.

## Environment Variables Summary

### Frontend (.env in Vercel)
```
VITE_API_URL=https://your-backend-url.com
```

### Backend (.env in AWS)
```
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
NODE_ENV=production
FRONTEND_URL=https://your-app.vercel.app
JWT_SECRET=your-strong-random-secret
```

## Post-Deployment Checklist

- [ ] Database schema executed
- [ ] Environment variables set
- [ ] Backend accessible at API URL
- [ ] Frontend can connect to backend
- [ ] CORS configured correctly
- [ ] Test signup/login
- [ ] Test API subscribe endpoint
- [ ] Test embed script
- [ ] SSL/HTTPS enabled

## Troubleshooting

### CORS Errors
- Ensure `FRONTEND_URL` matches your Vercel URL exactly
- Check backend CORS configuration

### Database Connection
- Verify `DATABASE_URL` is correct
- Check Neon database is active
- Ensure IP is allowed (Neon allows all by default)

### 502 Bad Gateway
- Check backend is running
- Verify port 3001 is accessible
- Check Nginx/load balancer configuration

## Cost Estimation

- **Vercel:** Free tier (hobby) or $20/month (pro)
- **AWS EC2:** ~$10-15/month (t3.small)
- **Neon PostgreSQL:** Free tier (0.5GB) or $19/month (4GB)
- **Total:** ~$0-35/month depending on tier

