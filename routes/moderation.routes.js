
// routes/moderation.routes.js
const express = require('express');
const router = express.Router();
const ContentModerationService = require('../server/services/contentModerationServices');
const { reportItem } = require('../controllers/moderation.controller');
const SlidingWindowLimiter = require('../middleware/rateLimiter');

// Rate limit for reporting to prevent spam (20 reqs / 1 min)
const reportLimiter = new SlidingWindowLimiter({
    windowMs: 60000,
    max: 20,
    message: 'Too many reports from this IP, please try again after a minute.'
});

let moderationService = null;

// Initialize moderation service
const getService = () =>
{
    if (!moderationService)
    {
        moderationService = new ContentModerationService();
    }
    return moderationService;
};

/**
 * POST /api/moderation/moderate
 * Moderate content
 */
router.post('/moderate', async (req, res, next) =>
{
    try
    {
        const { content, contentType, userId } = req.body;

        if (!content)
        {
            return res.status(400).json({
                success: false,
                error: 'Content is required'
            });
        }

        const service = getService();
        const result = await service.moderateContent(content, contentType || 'text', userId);

        res.json({
            success: true,
            result,
            timestamp: new Date().toISOString()
        });
    }
    catch (error)
    {
        next(error);
    }
});

/**
 * GET /api/moderation/queue
 * Get review queue
 */
router.get('/queue', (req, res, next) =>
{
    try
    {
        const status = req.query.status;
        const priority = req.query.priority;
        const service = getService();
        const queue = service.getReviewQueue({ status, priority });

        res.json({
            success: true,
            queue,
            count: queue.length,
            timestamp: new Date().toISOString()
        });
    }
    catch (error)
    {
        next(error);
    }
});

/**
 * POST /api/moderation/review
 * Review content manually
 */
router.post('/review', async (req, res, next) =>
{
    try
    {
        const { contentId, reviewerId, decision, notes } = req.body;

        if (!contentId || !reviewerId || !decision)
        {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: contentId, reviewerId, decision'
            });
        }

        const service = getService();
        const result = await service.reviewContent(contentId, reviewerId, decision, notes);

        res.json({
            success: true,
            result,
            timestamp: new Date().toISOString()
        });
    }
    catch (error)
    {
        next(error);
    }
});

/**
 * GET /api/moderation/reputation/:userId
 * Get user reputation
 */
router.get('/reputation/:userId', (req, res, next) =>
{
    try
    {
        const { userId } = req.params;
        const service = getService();
        const reputation = service.getUserReputation(userId);

        res.json({
            success: true,
            userId,
            reputation,
            timestamp: new Date().toISOString()
        });
    }
    catch (error)
    {
        next(error);
    }
});

/**
 * POST /api/moderation/train
 * Train moderation model
 */
router.post('/train', async (req, res, next) =>
{
    try
    {
        const service = getService();
        const result = await service.trainModel();

        res.json({
            success: true,
            ...result,
            timestamp: new Date().toISOString()
        });
    }
    catch (error)
    {
        next(error);
    }
});

/**
 * GET /api/moderation/stats
 * Get moderation statistics
 */
router.get('/stats', (req, res, next) =>
{
    try
    {
        const service = getService();
        const stats = service.getStatistics();

        res.json({
            success: true,
            stats,
            timestamp: new Date().toISOString()
        });
    }
    catch (error)
    {
        next(error);
    }
});

/**
 * GET /api/moderation/status
 * Get model status
 */
router.get('/status', (req, res, next) =>
{
    try
    {
        const service = getService();
        const status = service.getModelStatus();

        res.json({
            success: true,
            status,
            timestamp: new Date().toISOString()
        });
    }
    catch (error)
    {
        next(error);
    }
});

router.post('/report', reportLimiter.middleware(), reportItem);

module.exports = router;

