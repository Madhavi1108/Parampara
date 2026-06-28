const express = require('express');

const router = express.Router();

const { getItems, createItem } = require('../controllers/item.controller');
const { cacheMiddleware } = require('../middleware/lruCache');

const SlidingWindowLimiter = require('../middleware/rateLimiter');

// Strict rate limit for creating items (10 reqs / 1 min)
const createItemLimiter = new SlidingWindowLimiter({
  windowMs: 60000,
  max: 10,
  message: 'Too many item creation requests from this IP, please try again after a minute.'
});

router.get('/', cacheMiddleware, getItems);

router.post('/', createItemLimiter.middleware(), createItem);

module.exports = router;
