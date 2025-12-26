import express from 'express';
import { query } from '../db/index.js';
import { authenticate } from '../middleware/auth.js';
const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET /api/stats/:projectId - Get stats for a project
router.get('/:projectId', async (req, res, next) => {
  try {
    // Verify project belongs to user
    const projectResult = await query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [req.params.projectId, req.user.id]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Get total count
    const totalResult = await query(
      `SELECT COUNT(*) as count 
       FROM waitlist_entries 
       WHERE project_id = $1`,
      [req.params.projectId]
    );
    const total = parseInt(totalResult.rows[0].count);

    // Get today's count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayResult = await query(
      `SELECT COUNT(*) as count 
       FROM waitlist_entries 
       WHERE project_id = $1 AND joined_at >= $2`,
      [req.params.projectId, today.toISOString()]
    );
    const todayCount = parseInt(todayResult.rows[0].count);

    res.json({
      success: true,
      stats: {
        total,
        today: todayCount
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;

