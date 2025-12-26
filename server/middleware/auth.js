const jwt = require('jsonwebtoken');
const { query } = require('../db');

// JWT_SECRET must be set via environment variable
// Never use a default secret in production!
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable is required in production');
}

// Only allow default in development
const DEFAULT_SECRET = 'dev-secret-key-change-in-production';
const secret = JWT_SECRET || DEFAULT_SECRET;

if (!JWT_SECRET && process.env.NODE_ENV !== 'production') {
  console.warn('⚠️  WARNING: Using default JWT_SECRET. Set JWT_SECRET in .env for production!');
}

// Middleware to verify JWT token
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, secret);
    
    // Verify user still exists
    const result = await query('SELECT id, email FROM users WHERE id = $1', [decoded.userId]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    req.user = {
      id: decoded.userId,
      email: result.rows[0].email
    };
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired'
      });
    }
    next(error);
  }
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, secret, { expiresIn: '7d' });
};

module.exports = {
  authenticate,
  generateToken
};

