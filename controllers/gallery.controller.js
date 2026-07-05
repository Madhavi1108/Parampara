const store = require('../data/store');

/**
 * GET /api/gallery
 * Retrieves a list of cultural items for the gallery with pagination support.
 */
const getGallery = (req, res, next) => {
  try {
    const culturalAssets = store.culturalItems || [];

    // Parse pagination parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;

    const totalItems = culturalAssets.length;
    const totalPages = Math.ceil(totalItems / limit);
    const offset = (page - 1) * limit;

    // Slice active assets for the requested page
    const pagedAssets = culturalAssets.slice(offset, offset + limit);

    res.json({
      success: true,
      data: pagedAssets,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGallery,
};
