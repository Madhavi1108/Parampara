const express = require('express');
const router = express.Router();
const { globalSearch } = require('../controllers/search.controller');
const { cacheMiddleware } = require('../middleware/lruCache');
const SlidingWindowLimiter = require('../middleware/rateLimiter');

// Rate limiter for search: 30 requests per minute
const searchLimiter = new SlidingWindowLimiter({
  windowMs: 60000,
  max: 30,
  message: 'Too many search requests, please try again later.'
});

// GET /api/search?q=query
router.get('/', searchLimiter.middleware(), cacheMiddleware, globalSearch);

module.exports = router;
