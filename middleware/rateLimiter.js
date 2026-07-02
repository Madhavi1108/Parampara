/**
 * Sliding Window Rate Limiter Middleware
 * Uses an in-memory Map to track request timestamps per IP address.
 */
class SlidingWindowLimiter {
  /**
   * @param {Object} options
   * @param {number} options.windowMs - Sliding window duration in milliseconds
   * @param {number} options.max - Maximum number of requests allowed in the window
   * @param {string} options.message - Error message returned when limit is exceeded
   * @param {Function} options.exclude - Function (req) => boolean to bypass limiter
   */
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60000; // Default 1 minute
    this.max = options.max || 10; // Default 10 requests
    this.message = options.message || 'Too many requests, please try again later.';
    this.exclude = options.exclude || null;
    this.store = new Map();

    // Cleanup interval to remove inactive IPs and prevent memory leaks
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [ip, timestamps] of this.store.entries()) {
        // Keep only timestamps within the current window
        const activeTimestamps = timestamps.filter(t => t > now - this.windowMs);
        if (activeTimestamps.length === 0) {
          this.store.delete(ip);
        } else {
          this.store.set(ip, activeTimestamps);
        }
      }
    }, this.windowMs);

    // Prevent the interval from keeping the Node.js event loop alive unnecessarily
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  middleware() {
    return (req, res, next) => {
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      const now = Date.now();

      // Check if request is excluded from rate limiting
      if (this.exclude && this.exclude(req)) {
        return next();
      }

      if (!this.store.has(ip)) {
        this.store.set(ip, []);
      }

      const timestamps = this.store.get(ip);
      
      // Fast removal of expired timestamps from the front of the array
      while (timestamps.length > 0 && timestamps[0] <= now - this.windowMs) {
        timestamps.shift();
      }

      // Add current request
      timestamps.push(now);

      const remaining = Math.max(0, this.max - timestamps.length);
      const resetTime = timestamps[0] + this.windowMs;

      // Set Rate Limit headers
      res.setHeader('X-RateLimit-Limit', this.max);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('Retry-After', Math.ceil((resetTime - now) / 1000));

      if (timestamps.length > this.max) {
        console.warn(`[RateLimiter] Limit exceeded for IP: ${ip} at ${req.originalUrl}`);
        return res.status(429).json({ 
          error: this.message, 
          retryAfter: Math.ceil((resetTime - now) / 1000) 
        });
      }

      next();
    };
  }
}

module.exports = SlidingWindowLimiter;
