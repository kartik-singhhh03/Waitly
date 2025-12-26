import express from 'express';
import { query } from '../db/index.js';
import { authenticate } from '../middleware/auth.js';
const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET /api/entries/:projectId - Get all entries for a project
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

    const result = await query(
      `SELECT * FROM waitlist_entries 
       WHERE project_id = $1 
       ORDER BY joined_at DESC`,
      [req.params.projectId]
    );

    res.json({
      success: true,
      entries: result.rows
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/entries/:entryId - Delete single entry
router.delete('/:entryId', async (req, res, next) => {
  try {
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'projectId query parameter is required'
      });
    }

    // Verify project belongs to user
    const projectResult = await query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [projectId, req.user.id]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    const result = await query(
      `DELETE FROM waitlist_entries 
       WHERE id = $1 AND project_id = $2
       RETURNING id`,
      [req.params.entryId, projectId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Entry not found'
      });
    }

    res.json({
      success: true,
      message: 'Entry deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/entries/purge/:projectId - Purge all entries for a project
router.delete('/purge/:projectId', async (req, res, next) => {
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

    const result = await query(
      `DELETE FROM waitlist_entries 
       WHERE project_id = $1`,
      [req.params.projectId]
    );

    res.json({
      success: true,
      message: `Deleted ${result.rowCount} entries`,
      count: result.rowCount
    });
  } catch (error) {
    next(error);
  }
});

export default router;

