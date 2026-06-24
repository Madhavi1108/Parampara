const path = require('path');

const notFound = (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Route not found' });
  }
  res.status(404).sendFile(path.join(__dirname, '../public', '404.html'));
};

module.exports = notFound;
