const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

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
app.use('/api/subscribe', require('./routes/subscribe'));
app.use('/api/public', require('./routes/public'));
app.use('/api/projects', apiLimiter, require('./routes/projects'));
app.use('/api/entries', apiLimiter, require('./routes/entries'));
app.use('/api/stats', apiLimiter, require('./routes/stats'));
app.use('/api/auth', apiLimiter, require('./routes/auth'));
app.use('/api/auth', apiLimiter, require('./routes/auth-magic-link'));

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

module.exports = app;

