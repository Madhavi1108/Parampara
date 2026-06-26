const LRUCache = require('../server/utils/lruCache');

const store = {
  culturalItems: new LRUCache(2000), // Max 2000 items
  heritagePaths: new LRUCache(1000), // Max 1000 paths
  userProgress: {}, // Keep as object for fast lookup by userId
  villagePosts: new LRUCache(1000),
  contributors: new LRUCache(500),
  timelineEvents: new LRUCache(500),
  storySourceData: new LRUCache(500),
  artisans: new LRUCache(500),
};

module.exports = store;
