const express = require('express');
const router = express.Router();
const { generateArchive } = require('../controllers/export.controller');

router.post('/', generateArchive);

module.exports = router;
