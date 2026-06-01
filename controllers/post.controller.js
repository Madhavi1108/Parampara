const store = require("../data/store");

const getPosts = (req, res) => {
  res.json(store.villagePosts);
};

const createPost = (req, res) => {

  if (!req.body.title || !req.body.village) {
    return res.status(400).json({
      error: "Village and title are required"
    });
  }

  const newPost = {
    id: Date.now().toString(),
    village: req.body.village,
    title: req.body.title,
    content: req.body.content,
    type: req.body.type,
    date: req.body.date,
    timestamp: new Date().toISOString()
  };

  store.villagePosts.push(newPost);

  res.status(201).json(newPost);
};

module.exports = {
  getPosts,
  createPost
};