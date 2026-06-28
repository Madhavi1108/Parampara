const express = require('express');
const router = express.Router();

const { chatResponse } = require('../controllers/chat.controller');

const SlidingWindowLimiter = require('../middleware/rateLimiter');

// Strict rate limit for AI Chat (5 reqs / 1 min)
const chatLimiter = new SlidingWindowLimiter({
  windowMs: 60000,
  max: 5,
  message: 'Too many chat messages from this IP, please try again after a minute.'
});

router.post('/', chatLimiter.middleware(), chatResponse);

module.exports = router;
