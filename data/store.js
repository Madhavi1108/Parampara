const LRUCache = require('../server/utils/lruCache');
const { createAuditProxy } = require('../server/services/auditService');

const auditLog = new LRUCache(5000);

const store = {
  auditLog,
  culturalItems: createAuditProxy('culturalItems', new LRUCache(2000), auditLog),
  heritagePaths: createAuditProxy('heritagePaths', new LRUCache(1000), auditLog),
  userProgress: {}, // Keep as object for fast lookup by userId
  villagePosts: createAuditProxy('villagePosts', new LRUCache(1000), auditLog),
  contributors: createAuditProxy('contributors', new LRUCache(500), auditLog),
  timelineEvents: createAuditProxy('timelineEvents', new LRUCache(500), auditLog),
  storySourceData: createAuditProxy('storySourceData', new LRUCache(500), auditLog),
  artisans: createAuditProxy('artisans', new LRUCache(500), auditLog),
  analytics: {
    pageViews: {},
    events: [],
    interactions: {}
  }
};

module.exports = store;
