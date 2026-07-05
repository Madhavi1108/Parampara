const store = require('../data/store');

const reportItem = (req, res) => {
  const { id, type } = req.body;
  const REPORT_THRESHOLD = 3;

  if (!id || !type) {
    return res.status(400).json({ error: 'Item ID and Type are required for reporting' });
  }

  let collection;
  if (type === 'villagePost') {
    collection = store.villagePosts;
  } else if (type === 'culturalItem') {
    collection = store.culturalItems;
  } else {
    return res.status(400).json({ error: 'Invalid item type' });
  }

  // Get raw items based on the type of collection (it might be a proxy or array)
  const items = typeof collection.values === 'function' ? collection.values() : collection;

  const itemIndex = items.findIndex(i => i.id === id);
  if (itemIndex === -1) {
    return res.status(404).json({ error: 'Item not found' });
  }

  const item = items[itemIndex];
  
  // Increment report count
  item.reports = (item.reports || 0) + 1;

  // Auto-hide logic
  if (item.reports >= REPORT_THRESHOLD) {
    item.isHidden = true;
    
    // Broadcast hide event if it's a post
    if (type === 'villagePost') {
      const sseManager = require('../utils/sseManager');
      sseManager.broadcast('HIDE_POST', { id: item.id });
    }
  }

  // If using an array directly, update it. If Proxy, it mutates directly.
  if (Array.isArray(collection)) {
    collection[itemIndex] = item;
  } else if (typeof collection.update === 'function') {
    collection.update(item.id, item);
  }

  return res.json({ 
    success: true, 
    reports: item.reports, 
    isHidden: item.isHidden || false 
  });
};

module.exports = {
  reportItem
};
