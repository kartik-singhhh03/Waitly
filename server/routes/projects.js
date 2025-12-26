
import express from 'express';
import { query } from '../db/index.js';
import { authenticate } from '../middleware/auth.js';
const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET /api/projects - Get all projects for user
router.get('/', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT * FROM projects 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      projects: result.rows
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/:id - Get single project
router.get('/:id', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT * FROM projects 
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    res.json({
      success: true,
      project: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects - Create new project
router.post('/', async (req, res, next) => {
  try {
    const { name, slug } = req.body;

    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        error: 'Name and slug are required'
      });
    }

    // Normalize slug
    const normalizedSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    const result = await query(
      `INSERT INTO projects (user_id, name, slug)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.user.id, name, normalizedSlug]
    );

    res.status(201).json({
      success: true,
      project: result.rows[0]
    });
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({
        success: false,
        error: 'A project with this slug already exists'
      });
    }
    next(error);
  }
});

// PATCH /api/projects/:id - Update project
router.patch('/:id', async (req, res, next) => {
  try {
    const { name, mode, is_frozen, email_confirmation_required, privacy_mode, show_position } = req.body;

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (mode !== undefined) {
      updates.push(`mode = $${paramCount++}`);
      values.push(mode);
    }
    if (is_frozen !== undefined) {
      updates.push(`is_frozen = $${paramCount++}`);
      values.push(is_frozen);
    }
    if (email_confirmation_required !== undefined) {
      updates.push(`email_confirmation_required = $${paramCount++}`);
      values.push(email_confirmation_required);
    }
    if (privacy_mode !== undefined) {
      updates.push(`privacy_mode = $${paramCount++}`);
      values.push(privacy_mode);
    }
    if (show_position !== undefined) {
      updates.push(`show_position = $${paramCount++}`);
      values.push(show_position);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    values.push(req.params.id, req.user.id);

    const result = await query(
      `UPDATE projects 
       SET ${updates.join(', ')}
       WHERE id = $${paramCount++} AND user_id = $${paramCount++}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    res.json({
      success: true,
      project: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:id/rotate-key - Rotate API key
router.post('/:id/rotate-key', async (req, res, next) => {
  try {
    // Generate new API key
    import crypto from 'crypto';
    const newApiKey = 'wl_live_' + crypto.randomBytes(16).toString('hex');

    const result = await query(
      `UPDATE projects 
       SET api_key = $1
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [newApiKey, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    res.json({
      success: true,
      project: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/projects/:id - Delete project
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await query(
      `DELETE FROM projects 
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;

