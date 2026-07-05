const express = require('express');
const router = express.Router();

const { reportItem } = require('../controllers/moderation.controller');
const SlidingWindowLimiter = require('../middleware/rateLimiter');

// Rate limit for reporting to prevent spam (20 reqs / 1 min)
const reportLimiter = new SlidingWindowLimiter({
  windowMs: 60000,
  max: 20,
  message: 'Too many reports from this IP, please try again after a minute.'
});

router.post('/report', reportLimiter.middleware(), reportItem);

module.exports = router;
