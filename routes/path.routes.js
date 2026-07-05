const express = require('express');

const router = express.Router();

const {
  createPath,
  getPaths,
  getPathThemes,
  getOptimizedRoute,
} = require('../controllers/path.controller');
const { cacheMiddleware } = require('../middleware/lruCache');

// GET /api/paths/themes — must be before any :id-style routes
router.get('/themes', cacheMiddleware, getPathThemes);

// GET /api/paths/route — route computation
router.get('/route', cacheMiddleware, getOptimizedRoute);

router.get('/', cacheMiddleware, getPaths);

router.post('/', createPath);

module.exports = router;
