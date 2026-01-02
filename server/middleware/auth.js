
import jwt from 'jsonwebtoken';
import { query } from '../db/index.js';

// ✅ SECURITY: JWT_SECRET MUST be set in production
// Get secret from environment, with strict validation
const JWT_SECRET = process.env.JWT_SECRET;

// ✅ CRITICAL: Fail fast if JWT_SECRET is missing in production
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    console.error('❌ CRITICAL: JWT_SECRET environment variable is REQUIRED');
    throw new Error('JWT_SECRET environment variable must be set for security');
  }
  console.warn('⚠️  WARNING: Using insecure development JWT_SECRET. NEVER deploy this to production!');
}

// Development fallback (ONLY for local development)
const DEFAULT_DEV_SECRET = 'dev-secret-key-NEVER-use-in-production';
const secret = JWT_SECRET || DEFAULT_DEV_SECRET;

// ✅ SECURITY: Minimum secret length validation
if (secret.length < 32 && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET must be at least 32 characters for security');
}

// ✅ Middleware to verify JWT token with security best practices
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please provide a valid token.'
      });
    }

    const token = authHeader.substring(7);
    
    // ✅ SECURITY: Verify token signature and expiration
    const decoded = jwt.verify(token, secret);
    
    // ✅ SECURITY: Verify user still exists in database
    const result = await query('SELECT id, email FROM users WHERE id = $1', [decoded.userId]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'User account not found. Token may be invalid.'
      });
    }

    // ✅ Attach verified user to request
    req.user = {
      id: decoded.userId,
      email: result.rows[0].email
    };
    
    next();
  } catch (error) {
    // ✅ SECURITY: Specific error messages for different JWT errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid authentication token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Authentication token has expired. Please sign in again.'
      });
    }
    console.error('Authentication error:', error);
    next(error);
  }
};

// ✅ Generate JWT token with security best practices
export const generateToken = (userId) => {
  if (!userId) {
    throw new Error('userId is required to generate token');
  }
  
  return jwt.sign(
    { userId }, 
    secret, 
    { 
      expiresIn: '7d', // Token expires in 7 days
      issuer: 'waitly',
      algorithm: 'HS256' // Explicit algorithm to prevent algorithm confusion attacks
    }
  );
};



