const express = require('express');

const router = express.Router();

const {
  createPath,
  getPaths,
  getPathThemes,
  getOptimizedRoute,
} = require('../controllers/path.controller');

// GET /api/paths/themes — must be before any :id-style routes
router.get('/themes', getPathThemes);

// GET /api/paths/route — route computation
router.get('/route', getOptimizedRoute);

router.get('/', getPaths);

router.post('/', createPath);

module.exports = router;
