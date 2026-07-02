const store = require('../data/store');

const globalSearch = (req, res, next) => {
  try {
    const query = req.query.q;
    const type = req.query.type; // Optional: filter by type (e.g., 'culturalItem', 'heritagePath')
    const limit = parseInt(req.query.limit) || 20;

    if (!query) {
      return res.status(400).json({ error: 'Search query (q) is required' });
    }

    // Search across all indexed content using the TF-IDF search engine
    let results = store.searchEngine.search(query, type);

    // Limit results
    if (results.length > limit) {
      results = results.slice(0, limit);
    }

    res.json({
      query,
      type: type || 'all',
      count: results.length,
      data: results
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  globalSearch
};
