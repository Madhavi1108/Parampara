const { generateToken } = require('../middleware/csrf');

const getCsrfToken = (req, res) => {
  const token = generateToken();
  res.json({ csrfToken: token });
};

module.exports = {
  getCsrfToken
};
