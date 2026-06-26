const store = require('../data/store');

const getItems = (req, res) => {
  try {
    let items = store.culturalItems || [];

    // Parse query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const type = req.query.type;
    const search = req.query.search;

    // Apply filtering
    if (type && type !== 'all') {
      items = items.filter(item => item.type === type);
    }
    
    if (search) {
      const lowerSearch = search.toLowerCase();
      items = items.filter(item => 
        item.title.toLowerCase().includes(lowerSearch) ||
        item.description.toLowerCase().includes(lowerSearch) ||
        item.location.toLowerCase().includes(lowerSearch) ||
        (item.tags && item.tags.some(tag => tag.toLowerCase().includes(lowerSearch)))
      );
    }

    // Pagination
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedItems = items.slice(startIndex, endIndex);

    res.json({
      data: paginatedItems,
      meta: {
        currentPage: page,
        limit,
        totalItems,
        totalPages
      }
    });
  } catch (error) {
    console.error('Failed to fetch items:', error);
    res.status(500).json({ error: 'Error fetching items' });
  }
};

const createItem = (req, res) => {
  try {
    const { title, type, location } = req.body;

    if (!title || !type || !location) {
      return res.status(400).json({
        error: 'Missing required fields: title, type, location',
      });
    }

    const newItem = {
      id: Date.now().toString(),
      title,
      type,
      location,
      coordinates: req.body.coordinates || null,
      description: req.body.description || '',
      imageUrl: req.body.imageUrl || '',
      audioUrl: req.body.audioUrl || '',
      tags: Array.isArray(req.body.tags)
        ? req.body.tags
        : req.body.tags
          ? [req.body.tags]
          : [],
      timestamp: new Date().toISOString(),
    };

    store.culturalItems.push(newItem);

    res.status(201).json(newItem);
  } catch (error) {
    console.error('Failed to create item:', error);
    res.status(500).json({
      error: 'Error adding item',
    });
  }
};

module.exports = {
  getItems,
  createItem,
};
