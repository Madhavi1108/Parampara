/**
 * A modular frontend rate limiting utility.
 * Can be reused across different forms/components to prevent spam.
 */
class RateLimiter {
  /**
   * @param {number} maxRequests - Maximum allowed requests in the window.
   * @param {number} windowMs - Rolling window duration in milliseconds.
   */
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  /**
   * Checks if a new request is allowed and registers it if so.
   * @returns {{ allowed: boolean, remainingMs: number }}
   */
  check() {
    const now = Date.now();
    
    // Prune timestamps older than the window
    this.requests = this.requests.filter(timestamp => now - timestamp < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      // Calculate remaining wait time based on the oldest request in the current window
      const oldestRequest = this.requests[0];
      const timePassed = now - oldestRequest;
      const remainingMs = this.windowMs - timePassed;
      
      return { allowed: false, remainingMs };
    }

    // Add current request
    this.requests.push(now);
    return { allowed: true, remainingMs: 0 };
  }
}
