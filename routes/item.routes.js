const express = require('express');

const router = express.Router();

const { getItems, createItem } = require('../controllers/item.controller');
const moderateContent = require('../middleware/moderation');
const { cacheMiddleware } = require('../middleware/lruCache');

const HeuristicRateLimiter = require('../middleware/rateLimiter');

// Strict rate limit for creating items (20 tokens / 1 min)
const createItemLimiter = new HeuristicRateLimiter({
  windowMs: 60000,
  maxTokens: 20,
  message: 'Too many item creation requests from this IP, please try again after a minute.'
});

router.get('/', cacheMiddleware, getItems);

router.post(
  '/',
  createItemLimiter.middleware(),
  moderateContent({ action: 'block', fields: ['title', 'description', 'location'] }),
  createItem
);

module.exports = router;
