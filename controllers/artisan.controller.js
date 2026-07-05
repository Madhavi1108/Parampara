const store = require('../data/store');

// Get all artisans
exports.getAllArtisans = (req, res, next) => {
  try {
    const artisans = store.artisans || [];
    res.json(artisans);
  } catch (err) {
    next(err);
  }
};

// Get artisan by ID
exports.getArtisanById = (req, res, next) => {
  try {
    const { id } = req.params;
    const artisan = (store.artisans || []).find((a) => a.id === id);
    if (!artisan) {
      const error = new Error('Artisan not found');
      error.status = 404;
      throw error;
    }
    res.json(artisan);
  } catch (err) {
    next(err);
  }
};
