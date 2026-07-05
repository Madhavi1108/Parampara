const store = require('../data/store');

/**
 * GET /api/gallery
 * Retrieves a list of cultural items for the gallery.
 */
const getGallery = (req, res, next) => {
  try {
    const culturalAssets = store.culturalItems || [];
    res.json(culturalAssets);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGallery,
};
