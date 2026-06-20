const express = require('express');
const router = express.Router();
const { getStoryData } = require('../controllers/story.controller');

router.get('/', getStoryData);

module.exports = router;
