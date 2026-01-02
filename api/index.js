// Vercel Serverless Function - CommonJS for maximum compatibility
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

// ============================================
// DATABASE SETUP
// ============================================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 2,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
});

const query = async (text, params) => {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};

// ============================================
// JWT HELPERS
// ============================================
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const result = await query('SELECT id, email FROM users WHERE id = $1', [decoded.userId]);
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    req.user = { id: decoded.userId, email: result.rows[0].email };
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }
    next(error);
  }
};

// ============================================
// EXPRESS APP SETUP
// ============================================
const app = express();

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: 'Too many requests' }
});

// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: {
      hasDatabase: !!process.env.DATABASE_URL,
      hasJwtSecret: !!process.env.JWT_SECRET
    }
  });
});

// ============================================
// AUTH ROUTES
// ============================================
app.post('/api/auth/signup', apiLimiter, async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    // Check if user exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 10);
    const userResult = await query(
      `INSERT INTO users (email, password_hash, display_name) VALUES ($1, $2, $3) RETURNING id, email, display_name, created_at`,
      [email.toLowerCase(), passwordHash, displayName || email.split('@')[0]]
    );

    const user = userResult.rows[0];

    // Create profile
    await query(
      `INSERT INTO profiles (user_id, email, display_name) VALUES ($1, $2, $3)`,
      [user.id, user.email, user.display_name]
    );

    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      token,
      user: { id: user.id, email: user.email, display_name: user.display_name }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ success: false, error: 'Signup failed: ' + error.message });
  }
});

app.post('/api/auth/signin', apiLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const result = await query(
      'SELECT id, email, password_hash, display_name FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const token = generateToken(user.id);

    res.json({
      success: true,
      token,
      user: { id: user.id, email: user.email, display_name: user.display_name }
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ success: false, error: 'Signin failed: ' + error.message });
  }
});

app.get('/api/auth/me', authenticate, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, email, display_name, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// PROJECTS ROUTES
// ============================================
app.get('/api/projects', authenticate, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ success: true, projects: result.rows });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/projects/:id', authenticate, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    res.json({ success: true, project: result.rows[0] });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/projects', authenticate, async (req, res) => {
  try {
    const { name, slug } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ success: false, error: 'Name and slug are required' });
    }

    const normalizedSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    
    // Generate API key
    const apiKey = 'wl_live_' + require('crypto').randomBytes(16).toString('hex');

    const result = await query(
      `INSERT INTO projects (user_id, name, slug, api_key) VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user.id, name, normalizedSlug, apiKey]
    );

    res.status(201).json({ success: true, project: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ success: false, error: 'A project with this slug already exists' });
    }
    console.error('Create project error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.patch('/api/projects/:id', authenticate, async (req, res) => {
  try {
    const { name, mode, is_frozen, show_position } = req.body;
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) { updates.push(`name = $${paramCount++}`); values.push(name); }
    if (mode !== undefined) { updates.push(`mode = $${paramCount++}`); values.push(mode); }
    if (is_frozen !== undefined) { updates.push(`is_frozen = $${paramCount++}`); values.push(is_frozen); }
    if (show_position !== undefined) { updates.push(`show_position = $${paramCount++}`); values.push(show_position); }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    values.push(req.params.id, req.user.id);
    const result = await query(
      `UPDATE projects SET ${updates.join(', ')}, updated_at = now() WHERE id = $${paramCount++} AND user_id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    res.json({ success: true, project: result.rows[0] });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/projects/:id/rotate-key', authenticate, async (req, res) => {
  try {
    const newApiKey = 'wl_live_' + require('crypto').randomBytes(16).toString('hex');
    
    const result = await query(
      'UPDATE projects SET api_key = $1, updated_at = now() WHERE id = $2 AND user_id = $3 RETURNING *',
      [newApiKey, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    res.json({ success: true, project: result.rows[0] });
  } catch (error) {
    console.error('Rotate key error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/projects/:id', authenticate, async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM projects WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// ENTRIES ROUTES
// ============================================
app.get('/api/entries/:projectId', authenticate, async (req, res) => {
  try {
    // Verify project ownership
    const project = await query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [req.params.projectId, req.user.id]
    );

    if (project.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const result = await query(
      'SELECT * FROM waitlist_entries WHERE project_id = $1 ORDER BY joined_at DESC',
      [req.params.projectId]
    );

    res.json({ success: true, entries: result.rows });
  } catch (error) {
    console.error('Get entries error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/entries/:entryId', authenticate, async (req, res) => {
  try {
    const { projectId } = req.query;
    
    // Verify project ownership
    const project = await query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [projectId, req.user.id]
    );

    if (project.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    await query('DELETE FROM waitlist_entries WHERE id = $1 AND project_id = $2', [req.params.entryId, projectId]);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete entry error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/entries/purge/:projectId', authenticate, async (req, res) => {
  try {
    // Verify project ownership
    const project = await query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [req.params.projectId, req.user.id]
    );

    if (project.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    await query('DELETE FROM waitlist_entries WHERE project_id = $1', [req.params.projectId]);
    res.json({ success: true });
  } catch (error) {
    console.error('Purge entries error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// STATS ROUTES
// ============================================
app.get('/api/stats/:projectId', authenticate, async (req, res) => {
  try {
    // Verify project ownership
    const project = await query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [req.params.projectId, req.user.id]
    );

    if (project.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const totalResult = await query(
      'SELECT COUNT(*) as total FROM waitlist_entries WHERE project_id = $1',
      [req.params.projectId]
    );

    const todayResult = await query(
      `SELECT COUNT(*) as today FROM waitlist_entries WHERE project_id = $1 AND joined_at >= CURRENT_DATE`,
      [req.params.projectId]
    );

    res.json({
      success: true,
      stats: {
        total: parseInt(totalResult.rows[0].total),
        today: parseInt(todayResult.rows[0].today)
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// PUBLIC SUBSCRIBE ROUTE (No Auth Required)
// ============================================
// ✅ SECURITY: Uses projectId (slug) instead of API key
// API keys are NEVER exposed to the client
app.post('/api/subscribe', async (req, res) => {
  try {
    const { projectId, email, ref } = req.body;

    if (!projectId || !email) {
      return res.status(400).json({ success: false, error: 'Project ID and email are required' });
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email format' });
    }

    // Validate projectId format (alphanumeric with dashes, 3-50 chars)
    if (!/^[a-z0-9-]{3,50}$/i.test(projectId)) {
      return res.status(400).json({ success: false, error: 'Invalid project ID format' });
    }

    // Get project by slug (public identifier)
    const projectResult = await query(
      'SELECT id, is_frozen, show_position FROM projects WHERE slug = $1',
      [projectId.toLowerCase()]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const project = projectResult.rows[0];

    if (project.is_frozen) {
      return res.status(403).json({ success: false, error: 'Waitlist is currently closed' });
    }

    // Check for existing entry
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await query(
      'SELECT id, referral_code, joined_at FROM waitlist_entries WHERE project_id = $1 AND email = $2',
      [project.id, normalizedEmail]
    );

    if (existing.rows.length > 0) {
      const entry = existing.rows[0];
      let position = null;
      if (project.show_position) {
        const posResult = await query(
          'SELECT COUNT(*) as count FROM waitlist_entries WHERE project_id = $1 AND joined_at <= $2',
          [project.id, entry.joined_at]
        );
        position = parseInt(posResult.rows[0].count);
      }
      return res.json({
        success: true,
        position,
        referralCode: entry.referral_code,
        message: 'You are already on the waitlist!'
      });
    }

    // Generate referral code
    const referralCode = require('crypto').randomBytes(6).toString('hex');

    // Handle referral
    let priorityScore = 0;
    if (ref) {
      const referrer = await query(
        'SELECT id FROM waitlist_entries WHERE project_id = $1 AND referral_code = $2',
        [project.id, ref]
      );
      if (referrer.rows.length > 0) {
        await query(
          'UPDATE waitlist_entries SET priority_score = priority_score + 1 WHERE id = $1',
          [referrer.rows[0].id]
        );
        priorityScore = 1;
      }
    }

    // Insert new entry
    const insertResult = await query(
      `INSERT INTO waitlist_entries (project_id, email, referral_code, referred_by, priority_score) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id, referral_code, joined_at`,
      [project.id, normalizedEmail, referralCode, ref || null, priorityScore]
    );

    const newEntry = insertResult.rows[0];

    // Get position
    let position = null;
    if (project.show_position) {
      const posResult = await query(
        'SELECT COUNT(*) as count FROM waitlist_entries WHERE project_id = $1 AND joined_at <= $2',
        [project.id, newEntry.joined_at]
      );
      position = parseInt(posResult.rows[0].count);
    }

    res.json({
      success: true,
      position,
      referralCode: newEntry.referral_code
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// ERROR HANDLERS
// ============================================
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found', path: req.path });
});

// Export for Vercel
module.exports = app;

