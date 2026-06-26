const express = require('express');

const router = express.Router();

const {
  createPath,
  getPaths,
  getPathThemes,
} = require('../controllers/path.controller');

// GET /api/paths/themes — must be before any :id-style routes
router.get('/themes', getPathThemes);

router.get('/', getPaths);

router.post('/', createPath);

module.exports = router;
