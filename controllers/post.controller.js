const store = require('../data/store');

const getPosts = (req, res) => {
  res.json(typeof store.villagePosts.values === 'function' ? store.villagePosts.values() : store.villagePosts);
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

  store.villagePosts.push(newPost);

  // Broadcast to all connected WebSocket clients
  const wss = req.app.get('wss');
  if (wss) {
    const message = JSON.stringify({
      type: 'NEW_POST',
      payload: newPost
    });
    wss.clients.forEach((client) => {
      // ws.OPEN is 1
      if (client.readyState === 1) {
        client.send(message);
      }
    });
  }

  res.status(201).json(newPost);
};

module.exports = {
  getPosts,
  createPost,
};
