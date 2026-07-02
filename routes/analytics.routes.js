const express = require('express');
const router = express.Router();
const { receiveAnalytics, getAnalyticsStats } = require('../controllers/analytics.controller');

// Receives batched telemetry payloads
router.post('/', receiveAnalytics);

// Fetches aggregated analytics stats
router.get('/stats', getAnalyticsStats);

module.exports = router;
