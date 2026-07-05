const express = require('express');
const router = express.Router();
const artisanController = require('../controllers/artisan.controller');

// GET /api/artisans - list all artisans
router.get('/', artisanController.getAllArtisans);

// GET /api/artisans/:id - get artisan by id
router.get('/:id', artisanController.getArtisanById);

module.exports = router;
