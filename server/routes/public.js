import express from 'express';
import { query } from '../db/index.js';
const router = express.Router();

// GET /api/public/project/:slug - Get public project info (for embed script)
router.get('/project/:slug', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, slug, api_key FROM projects WHERE slug = $1`,
      [req.params.slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Only return API key for embed purposes
    res.json({
      success: true,
      project: {
        id: result.rows[0].id,
        slug: result.rows[0].slug,
        apiKey: result.rows[0].api_key
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;

