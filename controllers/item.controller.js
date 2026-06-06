const store = require("../data/store");

const getItems = (req, res) => {
  res.json(store.culturalItems);
};

const createItem = (req, res) => {
  try {
    const { title, type, location } = req.body;

    if (!title || !type || !location) {
      return res.status(400).json({
        error: "Missing required fields: title, type, location",
      });
    }

    const newItem = {
      id: Date.now().toString(),
      title,
      type,
      location,
      coordinates: req.body.coordinates || null,
      description: req.body.description || "",
      imageUrl: req.body.imageUrl || "",
      audioUrl: req.body.audioUrl || "",
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
    res.status(500).json({
      error: "Error adding item",
    });
  }
};

module.exports = {
  getItems,
  createItem,
};