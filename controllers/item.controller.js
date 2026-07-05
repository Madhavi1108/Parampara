/**
 * Parampara - Cultural Item Controller
 * Handles retrieval, full-text searching, filtering, pagination, 
 * and insertion of rural cultural heritage assets.
 */

const store = require('../data/store');

/**
 * Retrieves a list of cultural items with optional search, category filters, and pagination.
 * 
 * @param {Object} req Express request object containing query parameters.
 * @param {Object} res Express response object.
 */
const getItems = (req, res) =>
{
    try
    {
        let culturalAssets = store.culturalItems || [];

        // Filter out hidden items
        culturalAssets = culturalAssets.filter(item => !item.isHidden);

        // Extract and parse pagination config & query variables
        var activePage = parseInt(req.query.page, 10) || 1;
        var itemsPerPageLimit = parseInt(req.query.limit, 10) || 10;
        var categoryTypeFilter = req.query.type;
        var fullTextSearchQuery = req.query.search;

        // Utilize the TF-IDF indexing search engine for full-text queries
        if (fullTextSearchQuery)
        {
            culturalAssets = store.searchEngine.search(fullTextSearchQuery, 'culturalItem');
        }

        // Filter items based on specified type category (skip if set to 'all')
        if (categoryTypeFilter && categoryTypeFilter !== 'all')
        {
            culturalAssets = culturalAssets.filter(function(asset)
            {
                return asset.type === categoryTypeFilter;
            });
        }

        var yearFilter = req.query.year;
        if (yearFilter && yearFilter !== 'All') {
            culturalAssets = culturalAssets.filter(function(asset) {
                return asset.year && asset.year.toString() === yearFilter.toString();
            });
        }

        // Calculate metadata limits for pagination offset boundaries
        var totalMatchedItems = culturalAssets.length;
        var totalPagesCount = Math.ceil(totalMatchedItems / itemsPerPageLimit);
        var paginationOffset = (activePage - 1) * itemsPerPageLimit;
        var paginationUpperLimit = paginationOffset + itemsPerPageLimit;
        
        // Slice active assets block for client response
        var pagedCulturalItems = culturalAssets.slice(paginationOffset, paginationUpperLimit);

        // Send formatted pagination response
        res.json({
            data: pagedCulturalItems,
            meta: {
                currentPage: activePage,
                limit: itemsPerPageLimit,
                totalItems: totalMatchedItems,
                totalPages: totalPagesCount
            }
        });
    }
    catch (fetchError)
    {
        console.error('[Item Controller] Failed to fetch cultural items:', fetchError);
        res.status(500).json({ error: 'Error fetching items' });
    }
};

/**
 * Creates and stores a new cultural item in the registry.
 * 
 * @param {Object} req Express request object containing item payload in body.
 * @param {Object} res Express response object.
 */
const createItem = (req, res) =>
{
    try
    {
        var title = req.body.title;
        var type = req.body.type;
        var location = req.body.location;

        // Enforce presence of essential fields
        if (!title || !type || !location)
        {
            return res.status(400).json({
                error: 'Missing required fields: title, type, location',
            });
        }

        // Build the structured item object
        var createdAsset = {};
        createdAsset.id = Date.now().toString();
        createdAsset.title = title;
        createdAsset.type = type;
        createdAsset.location = location;
        createdAsset.coordinates = req.body.coordinates || null;
        createdAsset.description = req.body.description || '';
        createdAsset.imageUrl = req.body.imageUrl || '',
        createdAsset.audioUrl = req.body.audioUrl || '',
        createdAsset.tags = Array.isArray(req.body.tags)
            ? req.body.tags
            : req.body.tags
                ? [req.body.tags]
                : [];
        createdAsset.timestamp = new Date().toISOString();

        // Store in memory database
        store.culturalItems.push(createdAsset);

        // Return the newly created asset
        res.status(201).json(createdAsset);
    }
    catch (insertionError)
    {
        console.error('[Item Controller] Failed to create item:', insertionError);
        res.status(500).json({
            error: 'Error adding item',
        });
    }
};

module.exports = {
    getItems,
    createItem,
};
