/**
 * Parampara TelemetryTracker
 * Lightweight, privacy-friendly analytics system.
 * Captures anonymous usage events, batches them locally in localStorage,
 * and syncs them periodically or on page unload using navigator.sendBeacon.
 */

class TelemetryTracker {
  constructor() {
    this.endpoint = '/api/analytics';
    this.storageKey = 'parampara_telemetry_queue';
    this.sessionId = this._getOrCreateSessionId();
    this.flushIntervalMs = 15000; // 15 seconds
    
    this.queue = this._loadQueue();
    
    // Bind methods
    this.track = this.track.bind(this);
    this._flush = this._flush.bind(this);
    
    this._initAutoTracking();
    this._startPeriodicSync();
    
    // Ensure we track page leave and flush before unload
    window.addEventListener('beforeunload', () => {
      this.track('page_leave', { path: window.location.pathname });
      this._flush();
    });
    
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this._flush();
      }
    });

    // Track initial page view
    this.track('page_view', { path: window.location.pathname });
  }

  _getOrCreateSessionId() {
    let sid = sessionStorage.getItem('parampara_session');
    if (!sid) {
      sid = Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem('parampara_session', sid);
    }
    return sid;
  }

  _loadQueue() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  _saveQueue() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.queue));
    } catch (e) {
      // Ignore quota exceeded errors
    }
  }

  track(eventName, data = {}) {
    const event = {
      event: eventName,
      data,
      path: window.location.pathname,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString()
    };
    
    this.queue.push(event);
    this._saveQueue();
  }

  _flush() {
    if (this.queue.length === 0) return;

    const payload = JSON.stringify({ events: this.queue });
    const blob = new Blob([payload], { type: 'application/json' });
    
    let success = false;
    
    if (navigator.sendBeacon) {
      success = navigator.sendBeacon(this.endpoint, blob);
    }
    
    if (success) {
      this.queue = [];
      this._saveQueue();
    } else {
      // Fallback to fetch if sendBeacon failed or is unavailable
      fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true
      }).then((res) => {
        if (res.ok) {
          this.queue = [];
          this._saveQueue();
        }
      }).catch(err => {
        console.warn('Telemetry sync failed, will retry later.', err);
        // Leave queue intact for retry
      });
    }
  }

  _startPeriodicSync() {
    setInterval(() => this._flush(), this.flushIntervalMs);
  }

  _initAutoTracking() {
    // Auto-track clicks on specific elements
    document.addEventListener('click', (e) => {
      // Track elements with data-telemetry attribute
      const el = e.target.closest('[data-telemetry]');
      if (el) {
        const action = el.getAttribute('data-telemetry');
        const label = el.getAttribute('data-telemetry-label') || el.innerText || '';
        this.track('click', { action, label: label.trim().substring(0, 50) });
        return;
      }

      // Auto-track generic buttons if no data attribute
      const btn = e.target.closest('button');
      if (btn) {
        const label = btn.innerText || btn.getAttribute('aria-label') || btn.id || 'unknown_button';
        this.track('button_click', { label: label.trim().substring(0, 50) });
      }
    });
  }
}

// Initialize globally
window.Telemetry = new TelemetryTracker();
