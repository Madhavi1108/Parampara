const store = require('../data/store');
const sseManager = require('../utils/sseManager');

const getPosts = (req, res) => {
  let posts = typeof store.villagePosts.values === 'function' ? store.villagePosts.values() : store.villagePosts;
  posts = posts.filter(post => !post.isHidden);
  res.json(posts);
};

const streamPosts = (req, res) => {
  sseManager.addClient(req, res);
};

const createPost = (req, res) => {
  if (!req.body.title || !req.body.village) {
    return res.status(400).json({
      error: 'Village and title are required',
    });
  }

  const newPost = {
    id: Date.now().toString(),
    village: req.body.village,
    title: req.body.title,
    content: req.body.content,
    type: req.body.type,
    date: req.body.date,
    timestamp: new Date().toISOString(),
  };

  if (typeof store.villagePosts.push === 'function') {
    store.villagePosts.push(newPost);
  }

  // Broadcast to all connected SSE clients
  sseManager.broadcast('NEW_POST', newPost);

  res.status(201).json(newPost);
};

module.exports = {
  getPosts,
  streamPosts,
  createPost,
};
