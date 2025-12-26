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

		const data = magicLinks.get(token);
		if (!data) {
			return res.status(400).json({
				success: false,
				error: 'Invalid or expired token'
			});
		}

		if (Date.now() > data.expiresAt) {
			magicLinks.delete(token);
			return res.status(400).json({
				success: false,
				error: 'Token has expired'
			});
		}

		// Find user by email
		const userResult = await query(
			'SELECT id, email, display_name FROM users WHERE email = $1',
			[data.email]
		);

		if (userResult.rows.length === 0) {
			return res.status(404).json({
				success: false,
				error: 'User not found'
			});
		}

		const user = userResult.rows[0];
		const jwt = generateToken(user.id);

		// Delete token after use
		magicLinks.delete(token);

		res.json({
			success: true,
			token: jwt,
			user: {
				id: user.id,
				email: user.email,
				display_name: user.display_name
			}
		});
	} catch (error) {
		next(error);
	}
});

module.exports = router;
