const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { authenticate } = require('../middleware/auth');

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

module.exports = router;
