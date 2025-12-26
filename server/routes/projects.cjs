const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { authenticate } = require('../middleware/auth');

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

module.exports = router;
