// routes/heritageScore.routes.js
// Route to expose Living Heritage Score for various entities.

const express = require('express');
const router = express.Router();

const { getScore } = require('../server/utils/heritageScore');

/**
 * GET /api/heritage-score/:type/:id
 * Returns { score, category }
 */
router.get('/:type/:id', (req, res, next) => {
  try {
    const { type, id } = req.params;
    const result = getScore(type, id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
