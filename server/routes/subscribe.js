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
        message: 'You are already on the waitlist!'
      });
    }

    // Calculate priority score based on referral
    let priorityScore = 0;
    if (ref) {
      // Find the referrer and increment their score
      const referrerResult = await query(
        `SELECT id, priority_score 
         FROM waitlist_entries 
         WHERE project_id = $1 AND referral_code = $2`,
        [project.id, ref]
      );

      if (referrerResult.rows.length > 0) {
        const referrer = referrerResult.rows[0];
        await query(
          `UPDATE waitlist_entries 
           SET priority_score = priority_score + 1 
           WHERE id = $1`,
          [referrer.id]
        );
        priorityScore = 1; // Small boost for being referred
      }
    }

    // Insert new entry
    const insertResult = await query(
      `INSERT INTO waitlist_entries (project_id, email, referred_by, priority_score)
       VALUES ($1, $2, $3, $4)
       RETURNING id, referral_code, joined_at`,
      [project.id, normalizedEmail, ref || null, priorityScore]
    );

    const newEntry = insertResult.rows[0];

    // Get position
    let position = null;
    let tier = null;
    
    if (project.show_position) {
      const positionResult = await query(
        `SELECT COUNT(*) as count 
         FROM waitlist_entries 
         WHERE project_id = $1 AND joined_at <= $2`,
        [project.id, newEntry.joined_at]
      );
      position = parseInt(positionResult.rows[0].count);
    } else {
      // For position-less mode, calculate tier
      const totalResult = await query(
        `SELECT COUNT(*) as count 
         FROM waitlist_entries 
         WHERE project_id = $1`,
        [project.id]
      );
      const totalCount = parseInt(totalResult.rows[0].count);
      
      const positionResult = await query(
        `SELECT COUNT(*) as count 
         FROM waitlist_entries 
         WHERE project_id = $1 AND joined_at <= $2`,
        [project.id, newEntry.joined_at]
      );
      const currentPosition = parseInt(positionResult.rows[0].count);
      
      const percentile = ((totalCount - currentPosition + 1) / totalCount) * 100;
      
      if (percentile >= 90) tier = 'Top 10%';
      else if (percentile >= 75) tier = 'High priority';
      else if (percentile >= 50) tier = 'Early cohort';
      else tier = 'On the list';
    }

    console.log(`New signup: ${normalizedEmail} for project ${project.id}, position: ${position}`);

    return res.json({
      success: true,
      position: project.show_position ? position : null,
      tier: !project.show_position ? tier : null,
      referralCode: newEntry.referral_code
    });

  } catch (error) {
    console.error('Subscribe error:', error);
    
    // Handle unique constraint violation (duplicate email)
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        error: 'Email already registered'
      });
    }
    
    next(error);
  }
});

module.exports = router;

