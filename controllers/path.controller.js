const store = require("../data/store");

const getPaths = (req, res) => {
  res.json(store.heritagePaths);
};

const createPath = (req, res) => {
  try {
    if (!req.body.title || !req.body.theme) {
      return res.status(400).json({
        error: "Missing required fields: title, theme",
      });
    }

    const newPath = {
      id: Date.now().toString(),
      title: req.body.title,
      description: req.body.description || "",
      items: Array.isArray(req.body.items)
        ? req.body.items
        : [],
      theme: req.body.theme,
    };

    store.heritagePaths.push(newPath);

    res.json(newPath);
  } catch (error) {
    res.status(500).json({
      error: "Error creating path",
    });
  }
};

module.exports = {
  getPaths,
  createPath,
};