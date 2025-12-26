const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { checkRateLimit } = require('../middleware/rateLimit');

// Validate email format
const validateEmail = (email) => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email) && email.length <= 255;
};

// POST /api/subscribe
router.post('/', async (req, res, next) => {
	try {
		const { apiKey, email, ref } = req.body;

		// Validate required fields
		if (!apiKey) {
			return res.status(400).json({
				success: false,
				error: 'API key is required'
			});
		}

		if (!email) {
			return res.status(400).json({
				success: false,
				error: 'Email is required'
			});
		}

		// Validate email format
		if (!validateEmail(email)) {
			return res.status(400).json({
				success: false,
				error: 'Invalid email format'
			});
		}

		// Validate API key and get project
		const projectResult = await query(
			`SELECT id, is_frozen, mode, show_position 
			 FROM projects 
			 WHERE api_key = $1`,
			[apiKey]
		);

		if (projectResult.rows.length === 0) {
			return res.status(401).json({
				success: false,
				error: 'Invalid API key'
			});
		}

		const project = projectResult.rows[0];

		// Check if waitlist is frozen
		if (project.is_frozen) {
			return res.status(403).json({
				success: false,
				error: 'Waitlist is currently closed'
			});
		}

		// Rate limiting check
		const rateLimitResult = await checkRateLimit(apiKey);
		if (!rateLimitResult.allowed) {
			return res.status(429).json({
				success: false,
				error: 'Rate limit exceeded. Please try again later.'
			});
		}

		// Check for duplicate email
		const normalizedEmail = email.toLowerCase().trim();
		const existingResult = await query(
			`SELECT id, referral_code, joined_at 
			 FROM waitlist_entries 
			 WHERE project_id = $1 AND email = $2`,
			[project.id, normalizedEmail]
		);

		if (existingResult.rows.length > 0) {
			const existingEntry = existingResult.rows[0];
			// Get position
			let position = null;
			if (project.show_position) {
				const positionResult = await query(
					`SELECT COUNT(*) as count 
					 FROM waitlist_entries 
					 WHERE project_id = $1 AND joined_at <= $2`,
					[project.id, existingEntry.joined_at]
				);
				position = parseInt(positionResult.rows[0].count);
			}
			return res.json({
				success: true,
				position: project.show_position ? position : null,
				referralCode: existingEntry.referral_code,
				alreadyJoined: true
			});
		}

		// Insert new entry
		const referralCode = Math.random().toString(36).substring(2, 10);
		const entryResult = await query(
			`INSERT INTO waitlist_entries (project_id, email, referral_code, ref)
			 VALUES ($1, $2, $3, $4)
			 RETURNING id, joined_at`,
			[project.id, normalizedEmail, referralCode, ref || null]
		);
		const entry = entryResult.rows[0];

		// Get position
		let position = null;
		if (project.show_position) {
			const positionResult = await query(
				`SELECT COUNT(*) as count 
				 FROM waitlist_entries 
				 WHERE project_id = $1 AND joined_at <= $2`,
				[project.id, entry.joined_at]
			);
			position = parseInt(positionResult.rows[0].count);
		}

		// Log for analytics
		console.log(`New signup: ${normalizedEmail} for project ${project.id}, position: ${position}`);

		res.json({
			success: true,
			position: project.show_position ? position : null,
			referralCode,
			alreadyJoined: false
		});
	} catch (error) {
		next(error);
	}
});

module.exports = router;
