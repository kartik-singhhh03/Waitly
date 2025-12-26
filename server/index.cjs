import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

// Don't exit during build - only check in runtime
if (missingEnvVars.length > 0 && process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  // Don't exit in Vercel build - let it fail at runtime if needed
  if (!process.env.VERCEL) {
    process.exit(1);
  }
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || process.env.VITE_API_URL || 'http://localhost:8080',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting for API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Routes
import subscribeRouter from './routes/subscribe.js';
import publicRouter from './routes/public.js';
import projectsRouter from './routes/projects.js';
import entriesRouter from './routes/entries.js';
import statsRouter from './routes/stats.js';
import authRouter from './routes/auth.js';
import authMagicLinkRouter from './routes/auth-magic-link.js';

app.use('/api/subscribe', subscribeRouter);
app.use('/api/public', publicRouter);
app.use('/api/projects', apiLimiter, projectsRouter);
app.use('/api/entries', apiLimiter, entriesRouter);
app.use('/api/stats', apiLimiter, statsRouter);
app.use('/api/auth', apiLimiter, authRouter);
app.use('/api/auth', apiLimiter, authMagicLinkRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Only start server if not in serverless environment (Vercel/Lambda)
if (!process.env.VERCEL && !process.env.LAMBDA_TASK_ROOT) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  });
}

export default app;
