const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { query } = require('../db');
const { generateToken } = require('../middleware/auth');

// Store magic links in memory (in production, use Redis)
const magicLinks = new Map();

// POST /api/auth/magic-link/send
router.post('/magic-link/send', async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    const normalizedEmail = email.toLowerCase();

    // Generate magic link token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    // Store token
    magicLinks.set(token, {
      email: normalizedEmail,
      expiresAt
    });

    // In production, send email here using Resend/Brevo
    // For now, return the token (remove in production!)
    const magicLink = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/auth/verify?token=${token}`;

    // TODO: Send email with magic link
    // await sendMagicLinkEmail(normalizedEmail, magicLink);

    // For development, log the link
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔗 Magic link for ${normalizedEmail}: ${magicLink}`);
    }

    res.json({
      success: true,
      message: 'Magic link sent to your email',
      // Remove this in production!
      ...(process.env.NODE_ENV === 'development' && { magicLink })
    });
  } catch (error) {
    console.error('Magic link send error:', error);
    next(error);
  }
});

// POST /api/auth/magic-link/verify
router.post('/magic-link/verify', async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required'
      });
    }

    // Get magic link data
    const linkData = magicLinks.get(token);

    if (!linkData) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    // Check expiration
    if (Date.now() > linkData.expiresAt) {
      magicLinks.delete(token);
      return res.status(400).json({
        success: false,
        error: 'Token has expired'
      });
    }

    const { email } = linkData;

    // Find or create user
    let userResult = await query(
      'SELECT id, email, display_name, created_at FROM users WHERE email = $1',
      [email]
    );

    let user;

    if (userResult.rows.length === 0) {
      // Create new user
      userResult = await query(
        `INSERT INTO users (email, password_hash, display_name)
         VALUES ($1, $2, $3)
         RETURNING id, email, display_name, created_at`,
        [email, null, email.split('@')[0]]
      );

      user = userResult.rows[0];

      // Create profile
      await query(
        `INSERT INTO profiles (user_id, email, display_name)
         VALUES ($1, $2, $3)`,
        [user.id, user.email, user.display_name]
      );
    } else {
      user = userResult.rows[0];
    }

    // Delete used token
    magicLinks.delete(token);

    // Generate JWT token
    const jwtToken = generateToken(user.id);

    res.json({
      success: true,
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name
      }
    });
  } catch (error) {
    console.error('Magic link verify error:', error);
    next(error);
  }
});

module.exports = router;

