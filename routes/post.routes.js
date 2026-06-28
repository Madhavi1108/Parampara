const express = require('express');

const router = express.Router();

const { getPosts, createPost } = require('../controllers/post.controller');
const moderateContent = require('../middleware/moderation');

router.get('/', getPosts);

router.post('/', moderateContent({ action: 'block', fields: ['title', 'content', 'village'] }), createPost);

module.exports = router;
