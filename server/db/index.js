const { Pool } = require('pg');
require('dotenv').config();

// Optimize for serverless: smaller pool, shorter timeouts
// Vercel serverless functions are stateless and short-lived
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' || process.env.VERCEL ? { rejectUnauthorized: false } : false,
  max: process.env.VERCEL ? 2 : 20, // Smaller pool for serverless
  idleTimeoutMillis: process.env.VERCEL ? 10000 : 30000, // Shorter timeout for serverless
  connectionTimeoutMillis: 2000,
  allowExitOnIdle: true, // Allow process to exit when idle (important for serverless)
});

// Test connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  // Don't exit during Vercel build/deployment
  if (!process.env.VERCEL) {
    process.exit(-1);
  }
});

// Helper function to execute queries
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Query error', { text, error: error.message });
    throw error;
  }
};

module.exports = {
  pool,
  query
};

