const { query } = require('../db');

// Rate limit: 100 requests per minute per API key
const RATE_LIMIT = 100;
const RATE_WINDOW_MS = 60000; // 1 minute

const checkRateLimit = async (apiKey) => {
  const now = new Date();
  const windowStart = new Date(now.getTime() - RATE_WINDOW_MS);

  // Get or create rate limit record
  const result = await query(
    `SELECT * FROM api_rate_limits 
     WHERE api_key = $1 AND window_start >= $2 
     ORDER BY window_start DESC 
     LIMIT 1`,
    [apiKey, windowStart.toISOString()]
  );

  if (result.rows.length > 0) {
    const rateLimit = result.rows[0];
    
    if (rateLimit.request_count >= RATE_LIMIT) {
      return { allowed: false, remaining: 0 };
    }

    // Update count
    await query(
      `UPDATE api_rate_limits 
       SET request_count = request_count + 1 
       WHERE id = $1`,
      [rateLimit.id]
    );

    return { 
      allowed: true, 
      remaining: RATE_LIMIT - rateLimit.request_count - 1 
    };
  } else {
    // Clean old records and insert new
    await query(
      `DELETE FROM api_rate_limits 
       WHERE api_key = $1 AND window_start < $2`,
      [apiKey, windowStart.toISOString()]
    );

    await query(
      `INSERT INTO api_rate_limits (api_key, request_count, window_start) 
       VALUES ($1, 1, $2)`,
      [apiKey, now.toISOString()]
    );

    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }
};

module.exports = {
  checkRateLimit
};

