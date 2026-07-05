/**
 * Token Bucket Rate Limiter Middleware
 * Uses an in-memory Map to track tokens and last refill timestamp per IP address.
 * This provides O(1) memory consumption and high performance.
 */
class TokenBucketLimiter {
  /**
   * @param {Object} options
   * @param {number} options.windowMs - Time window in milliseconds for the rate limit
   * @param {number} options.max - Maximum number of requests allowed in the window
   * @param {string} options.message - Error message returned when limit is exceeded
   * @param {Function} options.exclude - Function (req) => boolean to bypass limiter
   */
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60000; // Default 1 minute
    this.max = options.max || 10; // Default 10 requests
    this.message = options.message || 'Too many requests, please try again later.';
    this.exclude = options.exclude || null;
    
    // Map of IP to { tokens: number, lastRefill: number }
    this.store = new Map();

    // Cleanup interval to remove inactive IPs and prevent memory leaks
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [ip, bucket] of this.store.entries()) {
        // If the bucket has been inactive for more than windowMs, it would be fully refilled, so we can delete it
        if (now - bucket.lastRefill > this.windowMs) {
          this.store.delete(ip);
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

      let bucket = this.store.get(ip);

      if (!bucket) {
        // First request from this IP
        bucket = {
          tokens: this.max,
          lastRefill: now
        };
        this.store.set(ip, bucket);
      } else {
        // Refill tokens based on time passed
        const timePassed = now - bucket.lastRefill;
        const refillRate = this.max / this.windowMs; // tokens per ms
        const tokensToAdd = timePassed * refillRate;

        if (tokensToAdd > 0) {
          bucket.tokens = Math.min(this.max, bucket.tokens + tokensToAdd);
          bucket.lastRefill = now;
        }
      }

      // Calculate state for headers
      // If we have at least 1 token, we will consume 1.
      const remaining = Math.max(0, Math.floor(bucket.tokens) - (bucket.tokens >= 1 ? 1 : 0));
      
      // Calculate retry-after (time until next token is available if we are out)
      let retryAfterSeconds = 0;
      if (bucket.tokens < 1) {
         const timeToNextToken = (1 - bucket.tokens) / (this.max / this.windowMs);
         retryAfterSeconds = Math.ceil(timeToNextToken / 1000);
      } else {
         const timeToFull = ((this.max - bucket.tokens) / (this.max / this.windowMs)) || 0;
         retryAfterSeconds = Math.ceil(timeToFull / 1000); // Or time until reset if tokens are available
      }

      // Set Rate Limit headers
      res.setHeader('X-RateLimit-Limit', this.max);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('Retry-After', retryAfterSeconds);

      if (bucket.tokens < 1) {
        console.warn(`[RateLimiter] Limit exceeded for IP: ${ip} at ${req.originalUrl}`);
        return res.status(429).json({ 
          error: this.message, 
          retryAfter: retryAfterSeconds 
        });
      }

      // Consume one token and proceed
      bucket.tokens -= 1;
      next();
    };
  }
}

module.exports = TokenBucketLimiter;
