
// routes/archive.routes.js
const express = require('express');
const router = express.Router();
const CommunityArchiveService = require('../services/communityArchiveService');

let archiveService = null;

const getService = () => {
  if (!archiveService) {
    archiveService = new CommunityArchiveService();
  }
  return archiveService;
};

/**
 * POST /api/archive/memory
 * Submit new memory
 */
router.post('/memory', async (req, res, next) => {
  try {
    const { memoryData, userId } = req.body;

    if (!memoryData || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: memoryData, userId'
      });
    }

    const service = getService();
    const memory = await service.submitMemory(memoryData, userId);

    res.json({
      success: true,
      memory,
      message: 'Memory submitted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/archive/memories
 * Get memories with filters
 */
router.get('/memories', (req, res, next) => {
  try {
    const filters = {
      category: req.query.category,
      status: req.query.status,
      search: req.query.search,
      location: req.query.location,
      sortBy: req.query.sortBy
    };

    const service = getService();
    const memories = service.getMemories(filters);

    res.json({
      success: true,
      memories,
      count: memories.length,
      filters,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/archive/memory/:memoryId
 * Get memory by ID
 */
router.get('/memory/:memoryId', (req, res, next) => {
  try {
    const { memoryId } = req.params;
    const service = getService();
    const memory = service.getMemory(memoryId);

    if (!memory) {
      return res.status(404).json({
        success: false,
        error: 'Memory not found'
      });
    }

    res.json({
      success: true,
      memory,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/archive/memory/:memoryId/vote
 * Vote on a memory
 */
router.post('/memory/:memoryId/vote', (req, res, next) => {
  try {
    const { memoryId } = req.params;
    const { userId, voteType } = req.body;

    if (!userId || !voteType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, voteType'
      });
    }

    const service = getService();
    const memory = service.voteMemory(memoryId, userId, voteType);

    res.json({
      success: true,
      memory,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/archive/queue
 * Get verification queue
 */
router.get('/queue', (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      priority: req.query.priority ? parseInt(req.query.priority) : null
    };

    const service = getService();
    const queue = service.getVerificationQueue(filters);

    res.json({
      success: true,
      queue,
      count: queue.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/archive/verify
 * Verify a memory
 */
router.post('/verify', async (req, res, next) => {
  try {
    const { memoryId, expertId, decision, notes } = req.body;

    if (!memoryId || !expertId || !decision) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: memoryId, expertId, decision'
      });
    }

    const service = getService();
    const memory = await service.verifyMemory(memoryId, expertId, decision, notes);

    res.json({
      success: true,
      memory,
      message: `Memory ${decision}ed successfully`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/archive/exhibitions
 * Get exhibitions
 */
router.get('/exhibitions', (req, res, next) => {
  try {
    const filters = {
      status: req.query.status
    };

    const service = getService();
    const exhibitions = service.getExhibitions(filters);

    res.json({
      success: true,
      exhibitions,
      count: exhibitions.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/archive/timelines
 * Get timelines
 */
router.get('/timelines', (req, res, next) => {
  try {
    const { memoryId } = req.query;
    const service = getService();
    const timelines = service.getTimelines(memoryId);

    res.json({
      success: true,
      timelines,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/archive/categories
 * Get archive categories
 */
router.get('/categories', (req, res, next) => {
  try {
    const service = getService();
    const categories = service.archiveCategories;

    res.json({
      success: true,
      categories,
      count: categories.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/archive/stats
 * Get archive statistics
 */
router.get('/stats', (req, res, next) => {
  try {
    const service = getService();
    const stats = service.getStatistics();

    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/archive/preservation
 * Get preservation status
 */
router.get('/preservation', (req, res, next) => {
  try {
    const service = getService();
    const status = service.getPreservationStatus();

    res.json({
      success: true,
      status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/archive/backup
 * Create backup
 */
router.post('/backup', async (req, res, next) => {
  try {
    const service = getService();
    const backup = await service.createBackup();

    res.json({
      success: true,
      backup,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/archive/restore
 * Restore from backup
 */
router.post('/restore', async (req, res, next) => {
  try {
    const { backupId } = req.body;

    if (!backupId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: backupId'
      });
    }

    const service = getService();
    const backup = await service.restoreFromBackup(backupId);

    res.json({
      success: true,
      backup,
      message: 'Restore successful',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/archive/search
 * Search archive
 */
router.get('/search', (req, res, next) => {
  try {
    const { q, limit } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: q'
      });
    }

    const service = getService();
    const results = service.searchArchive(q, { limit: parseInt(limit) || 50 });

    res.json({
      success: true,
      query: q,
      results,
      count: results.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

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

