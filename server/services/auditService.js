// server/services/auditService.js

/**
 * Creates an event log and stores it in the auditLog cache.
 */
function logAuditEvent(auditLogCache, eventType, resource, resourceId, previousValue, updatedValue) {
  const event = {
    eventId: Date.now().toString() + Math.random().toString(36).substr(2, 5),
    timestamp: new Date().toISOString(),
    eventType,
    resource,
    resourceId,
    previousValue: previousValue ? JSON.parse(JSON.stringify(previousValue)) : null,
    updatedValue: updatedValue ? JSON.parse(JSON.stringify(updatedValue)) : null
  };
  
  auditLogCache.push(event);
}

/**
 * Wraps an LRUCache instance to automatically log audit events on set/delete.
 */
function createAuditProxy(resourceName, cacheInstance, auditLogCache) {
  // Save original methods
  const originalSet = cacheInstance.set.bind(cacheInstance);
  const originalDelete = cacheInstance.delete.bind(cacheInstance);
  const originalClear = cacheInstance.clear.bind(cacheInstance);
  
  // Override set
  cacheInstance.set = (key, value) => {
    const existingValue = cacheInstance.get(key);
    const eventType = existingValue ? 'UPDATE' : 'CREATE';
    
    // Perform the set
    originalSet(key, value);
    
    // Log it
    logAuditEvent(auditLogCache, eventType, resourceName, key, existingValue, value);
  };
  
  // Override delete
  cacheInstance.delete = (key) => {
    const existingValue = cacheInstance.get(key);
    
    if (existingValue) {
      logAuditEvent(auditLogCache, 'DELETE', resourceName, key, existingValue, null);
    }
    
    return originalDelete(key);
  };
  
  // Override clear (log each item as deleted)
  cacheInstance.clear = () => {
    const allValues = cacheInstance.values();
    allValues.forEach(val => {
      const key = val.id || 'unknown';
      logAuditEvent(auditLogCache, 'DELETE', resourceName, key, val, null);
    });
    originalClear();
  };
  
  return cacheInstance;
}

module.exports = {
  createAuditProxy,
  logAuditEvent
};
