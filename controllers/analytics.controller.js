const store = require('../data/store');

/**
 * Handle incoming batch of anonymous telemetry events
 */
const receiveAnalytics = (req, res, next) => {
  try {
    const { events } = req.body;
    
    if (!events || !Array.isArray(events)) {
      return res.status(400).json({ error: 'Invalid payload format.' });
    }

    const { analytics } = store;

    events.forEach(evt => {
      // Bound the raw events array size to prevent memory leaks in the backend
      if (analytics.events.length >= 1000) {
        analytics.events.shift(); 
      }
      analytics.events.push(evt);

      // Perform simple in-memory aggregations
      if (evt.event === 'page_view') {
        const path = evt.path || 'unknown';
        analytics.pageViews[path] = (analytics.pageViews[path] || 0) + 1;
      }
      
      if (evt.event === 'click' || evt.event === 'button_click' || evt.event === 'item_view' || evt.event === 'search') {
        const key = evt.event + ':' + (evt.data?.action || evt.data?.label || evt.data?.itemId || evt.data?.query || 'unknown');
        analytics.interactions[key] = (analytics.interactions[key] || 0) + 1;
      }
    });

    // sendBeacon ignores responses, but fetch might care
    res.status(202).json({ success: true, received: events.length });
  } catch (err) {
    console.error('[Telemetry] Error processing analytics payload:', err);
    res.status(500).json({ success: false });
  }
};

/**
 * Endpoint to retrieve aggregated analytics data (for an admin dashboard)
 */
const getAnalyticsStats = (req, res, next) => {
  try {
    const { analytics } = store;
    res.json({
      pageViews: analytics.pageViews,
      interactions: analytics.interactions,
      recentEvents: analytics.events.length
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  receiveAnalytics,
  getAnalyticsStats
};
