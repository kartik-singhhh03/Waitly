
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
dotenv.config();

// ✅ Validate required environment variables
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

// ✅ CRITICAL: Check env vars but allow Vercel build to proceed
if (missingEnvVars.length > 0) {
  const errorMsg = `❌ Missing required environment variables: ${missingEnvVars.join(', ')}`;
  
  // During Vercel build, just warn (build needs to succeed to deploy)
  if (process.env.VERCEL && process.env.VERCEL_ENV === 'production') {
    console.warn('⚠️  Build-time warning:', errorMsg);
    console.warn('⚠️  Runtime will fail if these are not set in Vercel dashboard');
  } else if (process.env.NODE_ENV === 'production') {
    // In production runtime (not build), fail immediately
    console.error(errorMsg);
    console.error('Set these in Vercel Dashboard → Settings → Environment Variables');
    // Don't exit during build, only at runtime
    if (!process.env.VERCEL) {
      process.exit(1);
    }
  } else {
    // Development: just warn
    console.warn('⚠️  Development warning:', errorMsg);
  }
}

const app = express();
const PORT = process.env.PORT || 3001;

// ✅ Security headers with Helmet
app.use(helmet({
  contentSecurityPolicy: false, // Disable for API
  crossOriginEmbedderPolicy: false
}));

// ✅ CORS configuration for Vercel
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*', // In production, set specific origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ Rate limiting - protect against abuse
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  message: {
    success: false,
    error: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// ✅ Import routes
import subscribeRouter from './routes/subscribe.js';
import publicRouter from './routes/public.js';
import projectsRouter from './routes/projects.js';
import entriesRouter from './routes/entries.js';
import statsRouter from './routes/stats.js';
import authRouter from './routes/auth.js';
import authMagicLinkRouter from './routes/auth-magic-link.js';

// ✅ Health check endpoint (no rate limiting)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// ✅ API Routes
app.use('/api/subscribe', subscribeRouter); // Public, has its own rate limiting
app.use('/api/public', publicRouter); // Public endpoints
app.use('/api/projects', apiLimiter, projectsRouter); // Protected
app.use('/api/entries', apiLimiter, entriesRouter); // Protected
app.use('/api/stats', apiLimiter, statsRouter); // Protected
app.use('/api/auth', apiLimiter, authRouter); // Authentication
app.use('/api/auth', apiLimiter, authMagicLinkRouter); // Magic link auth

// ✅ Enhanced error handling middleware
app.use((err, req, res, next) => {
  // Log error for debugging
  console.error('❌ Error occurred:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method
  });

  // ✅ SECURITY: Never expose internal errors in production
  const isDev = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    success: false,
    error: isDev ? err.message : 'Internal server error',
    ...(isDev && { stack: err.stack })
  });
});

// ✅ 404 handler for unknown routes
app.use((req, res) => {
  console.warn(`⚠️  404 Not Found: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path
  });
});

// ✅ Only start server if not in serverless environment
if (!process.env.VERCEL && !process.env.LAMBDA_TASK_ROOT) {
  const server = app.listen(PORT, () => {
    console.log('');
    console.log('🚀 ================================================');
    console.log(`   Waitly Server Started`);
    console.log('   ================================================');
    console.log(`   🌐 Server:      http://localhost:${PORT}`);
    console.log(`   ✅ Health:      http://localhost:${PORT}/health`);
    console.log(`   📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   🗄️  Database:    ${process.env.DATABASE_URL ? 'Connected' : '❌ Not configured'}`);
    console.log(`   🔐 JWT Secret:  ${process.env.JWT_SECRET ? 'Set ✓' : '❌ Not set'}`);
    console.log('   ================================================');
    console.log('');
  });

  // ✅ Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server gracefully...');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
}

// ✅ Export app for Vercel serverless
export default app;

