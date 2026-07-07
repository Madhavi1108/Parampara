const express = require('express');
const router = express.Router();
const archiveController = require('../controllers/archive.controller');

// Key Management Routes
router.post('/keys', archiveController.registerPublicKey);
router.get('/keys/:userId', archiveController.getPublicKey);
router.get('/keys', archiveController.getAllPublicKeys);

// Archive Routes
router.post('/', archiveController.createArchive);
router.get('/', archiveController.getAccessibleArchives);

module.exports = router;
