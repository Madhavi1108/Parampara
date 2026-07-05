/**
 * Parampara - Reusable Cache Layer
 * Provides caching of API responses in localStorage
 */

const CacheManager = {
  // Default TTL: 1 hour (3600000 ms)
  get: async function(url, ttl = 3600000) {
    let cached = null;
    try {
      cached = localStorage.getItem(url);
    } catch (e) {
      console.warn("localStorage is not available.", e);
    }

    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < ttl) {
          // Fire a background request to update the cache (stale-while-revalidate pattern)
          this._revalidate(url);
          return data;
        }
      } catch (e) {
        // Data is corrupted, clear it and fall through to fetch
        console.warn(`Cache corrupted for ${url}, clearing...`);
        this.invalidate(url);
      }
    }
    
    return this._fetchAndCache(url);
  },

  _revalidate: async function(url) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        this._setCache(url, data);
      }
    } catch (e) {
      // Ignore background fetch errors
    }
  },

  _fetchAndCache: async function(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}`);
      }
      const data = await response.json();
      this._setCache(url, data);
      return data;
    } catch (e) {
      console.error(`CacheManager fetch failed: ${e.message}`);
      throw e;
    }
  },

  _setCache: function(url, data) {
    try {
      localStorage.setItem(url, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch(e) {
      // Handle quota exceeded
      console.warn("localStorage quota exceeded. Cannot cache.", e);
      // Try to clean up old cache entries
      this.clearAll();
      try {
        localStorage.setItem(url, JSON.stringify({
          data,
          timestamp: Date.now()
        }));
      } catch (retryErr) {
        console.warn("Still quota exceeded after clearing cache.", retryErr);
      }
    }
  },

  invalidate: function(url) {
    try {
      localStorage.removeItem(url);
    } catch (e) {}
  },

  clearAll: function() {
    try {
      // Clear only URLs tracked by CacheManager (simplest way is to remove all or match /api/)
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('/api/')) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {}
  }
};

window.CacheManager = CacheManager;
