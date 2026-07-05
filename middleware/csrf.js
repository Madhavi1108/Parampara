const crypto = require('crypto');

// In-memory store for active tokens
const activeTokens = new Map();

// Token Time-To-Live (TTL): 1 hour in milliseconds
const TOKEN_TTL = 60 * 60 * 1000;

/**
 * Generate a new CSRF token and store it in memory.
 */
function generateToken() {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + TOKEN_TTL;
  activeTokens.set(token, expiresAt);
  return token;
}

/**
 * Cleanup expired tokens periodically to prevent memory leaks.
 * Runs every 15 minutes.
 */
setInterval(() => {
  const now = Date.now();
  for (const [token, expiresAt] of activeTokens.entries()) {
    if (now > expiresAt) {
      activeTokens.delete(token);
    }
  }
}, 15 * 60 * 1000);

/**
 * CSRF Validation Middleware
 */
function csrfProtection(req, res, next) {
  // Safe HTTP methods do not require CSRF token
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // Allow internal/legacy logic for some paths if strictly needed,
  // but for strict CSRF, we protect all state-changing endpoints.
  
  // Look for the token in common CSRF headers
  const token = req.headers['x-csrf-token'] || req.headers['x-xsrf-token'];

  if (!token) {
    return res.status(403).json({ error: 'CSRF token missing' });
  }

  const expiresAt = activeTokens.get(token);

  if (!expiresAt) {
    return res.status(403).json({ error: 'CSRF token invalid or expired' });
  }

  if (Date.now() > expiresAt) {
    activeTokens.delete(token); // cleanup
    return res.status(403).json({ error: 'CSRF token expired' });
  }

  // Token is valid; proceed
  next();
}

module.exports = {
  generateToken,
  csrfProtection
};
