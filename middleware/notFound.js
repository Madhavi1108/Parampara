const path = require('path');

const notFound = (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      status: 404,
      message: 'The requested API endpoint could not be found.',
      path: req.path
    });
  }
  res.status(404).sendFile(path.join(__dirname, '../public', '404.html'));
};

module.exports = notFound;
