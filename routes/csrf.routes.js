const express = require('express');
const router = express.Router();
const csrfController = require('../controllers/csrf.controller');

router.get('/', csrfController.getCsrfToken);

module.exports = router;
