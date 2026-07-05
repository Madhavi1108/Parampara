const express = require('express');
const router = express.Router();
const { apiCache } = require('../middleware/lruCache');

// GET /api/cache/stats
router.get('/stats', (req, res) => {
  res.json(apiCache.getStats());
});

// POST /api/cache/clear
router.post('/clear', (req, res) => {
  apiCache.clear();
  res.json({ message: 'Cache cleared successfully', stats: apiCache.getStats() });
});

module.exports = router;
