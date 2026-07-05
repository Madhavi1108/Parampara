const express = require('express');

const router = express.Router();

const { getPosts, streamPosts, createPost } = require('../controllers/post.controller');
const moderateContent = require('../middleware/moderation');

router.get('/', getPosts);

router.get('/stream', streamPosts);

router.post('/', moderateContent({ action: 'block', fields: ['title', 'content', 'village'] }), createPost);

module.exports = router;
