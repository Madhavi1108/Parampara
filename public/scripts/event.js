// public/scripts/events.js

class EventDiscoveryUI {
  constructor(options = {}) {
    this.apiBase = options.apiBase || '/api/events';
    this.userId = this.getUserId();
    this.container = options.container || '#events-container';
    this.mapContainer = options.mapContainer || '#events-map';
    this.currentFilters = {};
    this.selectedEvent = null;
    
    this.init();
  }

  getUserId() {
    let userId = localStorage.getItem('userId');
    if (!userId) {
      userId = `user_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('userId', userId);
    }
    return userId;
  }

  init() {
    this.loadEvents();
    this.loadNotifications();
    this.setupEventListeners();
    this.setupSubscription();
  }

  async loadEvents(filters = {}) {
    const container = document.querySelector(this.container);
    if (!container) return;

    this.setLoading(container, true);

    try {
      const params = new URLSearchParams({
        ...this.currentFilters,
        ...filters
      });
      const response = await fetch(`${this.apiBase}?${params}`);
      const data = await response.json();

      if (data.success) {
        this.renderEvents(container, data.events);
        this.currentFilters = { ...this.currentFilters, ...filters };
      }
    } catch (error) {
      console.error('Error loading events:', error);
      this.showError(container, 'Failed to load events');
    } finally {
      this.setLoading(container, false);
    }
  }

  renderEvents(container, events) {
    if (!events || events.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No events found. Check back later!</p>
          <button onclick="window.eventUI.loadEvents()">🔄 Refresh</button>
        </div>
      `;
      return;
    }

    const html = `
      <div class="events-grid">
        ${events.map(event => this.renderEventCard(event)).join('')}
      </div>
    `;

    container.innerHTML = html;

    // Add event listeners to cards
    container.querySelectorAll('.event-card').forEach(card => {
      card.addEventListener('click', () => {
        const eventId = card.dataset.eventId;
        this.showEventDetails(eventId);
      });
    });
  }

  renderEventCard(event) {
    const statusColors = {
      upcoming: '#4CAF50',
      ongoing: '#FF9800',
      completed: '#9E9E9E',
      cancelled: '#f44336'
    };

    return `
      <div class="event-card" data-event-id="${event.id}" style="
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        overflow: hidden;
        transition: transform 0.3s, box-shadow 0.3s;
        cursor: pointer;
        border-left: 4px solid ${statusColors[event.status] || '#4CAF50'};
      ">
        <div style="padding: 15px;">
          <div style="display: flex; justify-content: space-between; align-items: start;">
            <h3 style="margin: 0 0 5px 0; font-size: 18px;">${event.title}</h3>
            <span style="
              background: ${statusColors[event.status] || '#4CAF50'};
              color: white;
              padding: 2px 10px;
              border-radius: 12px;
              font-size: 11px;
            ">${event.status}</span>
          </div>
          <p style="color: #666; font-size: 14px; margin: 5px 0;">${event.description.substring(0, 100)}...</p>
          <div style="display: flex; gap: 15px; margin: 10px 0; font-size: 13px; color: #555;">
            <span>📅 ${new Date(event.date).toLocaleDateString()}</span>
            <span>📍 ${event.location.name}</span>
            <span>👥 ${event.rsvpCount || 0}/${event.capacity}</span>
          </div>
          <div style="display: flex; gap: 5px; flex-wrap: wrap;">
            ${event.tags ? event.tags.map(tag => 
              `<span style="background: #f0f0f0; padding: 2px 10px; border-radius: 12px; font-size: 11px;">${tag}</span>`
            ).join('') : ''}
          </div>
          <div style="margin-top: 10px; display: flex; gap: 10px;">
            <button onclick="event.stopPropagation(); window.eventUI.rsvpToEvent('${event.id}')" style="
              flex: 1;
              padding: 6px 12px;
              background: #4CAF50;
              color: white;
              border: none;
              border-radius: 5px;
              cursor: pointer;
            ">
              ✅ RSVP
            </button>
            ${event.virtual && event.virtual.enabled ? `
              <button onclick="event.stopPropagation(); window.eventUI.joinVirtualEvent('${event.id}')" style="
                flex: 1;
                padding: 6px 12px;
                background: #2196F3;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
              ">
                🎥 Join Live
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  async rsvpToEvent(eventId) {
    try {
      const response = await fetch(`${this.apiBase}/${eventId}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: this.userId })
      });

      const data = await response.json();

      if (data.success) {
        this.showToast('✅ RSVP successful!', 'success');
        this.loadEvents(this.currentFilters);
      } else {
        this.showToast('❌ ' + data.error, 'error');
      }
    } catch (error) {
      console.error('Error RSVPing:', error);
      this.showToast('❌ Error RSVPing', 'error');
    }
  }

  async joinVirtualEvent(eventId) {
    try {
      const response = await fetch(`${this.apiBase}/${eventId}/stream`, {
        method: 'POST'
      });

      const data = await response.json();

      if (data.success && data.stream) {
        window.open(data.stream.streamUrl, '_blank');
        this.showToast('🎥 Joining virtual event...', 'info');
      }
    } catch (error) {
      console.error('Error joining virtual event:', error);
      this.showToast('❌ Error joining event', 'error');
    }
  }

  async showEventDetails(eventId) {
    try {
      const response = await fetch(`${this.apiBase}/${eventId}`);
      const data = await response.json();

      if (data.success) {
        this.selectedEvent = data.event;
        this.showEventModal(data.event);
      }
    } catch (error) {
      console.error('Error loading event details:', error);
    }
  }

  showEventModal(event) {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 99999;
    `;
    modal.innerHTML = `
      <div style="
        background: white;
        padding: 30px;
        border-radius: 15px;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        font-family: Arial, sans-serif;
      ">
        <h2 style="margin-top: 0;">${event.title}</h2>
        <p><strong>📅 Date:</strong> ${new Date(event.date).toLocaleString()}</p>
        <p><strong>📍 Location:</strong> ${event.location.name}</p>
        <p><strong>📝 Description:</strong> ${event.description}</p>
        <p><strong>👥 Attendees:</strong> ${event.rsvpCount}/${event.capacity}</p>
        ${event.virtual && event.virtual.enabled ? `
          <p><strong>🎥 Virtual:</strong> Available</p>
        ` : ''}
        <div style="margin-top: 20px; display: flex; gap: 10px;">
          <button onclick="this.closest('.modal').remove(); window.eventUI.rsvpToEvent('${event.id}')" style="
            flex: 1;
            padding: 10px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
          ">
            ✅ RSVP
          </button>
          <button onclick="this.closest('.modal').remove()" style="
            flex: 1;
            padding: 10px;
            background: #f44336;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
          ">
            Close
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  async loadNotifications() {
    try {
      const response = await fetch(`${this.apiBase}/user/${this.userId}/notifications`);
      const data = await response.json();

      if (data.success && data.notifications.length > 0) {
        const unread = data.notifications.filter(n => !n.read);
        if (unread.length > 0) {
          this.showNotificationBadge(unread.length);
        }
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }

  showNotificationBadge(count) {
    const badge = document.createElement('div');
    badge.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f44336;
      color: white;
      padding: 8px 15px;
      border-radius: 20px;
      z-index: 99998;
      font-size: 14px;
      cursor: pointer;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    badge.textContent = `🔔 ${count} new events`;
    badge.onclick = () => {
      this.loadEvents({ status: 'upcoming' });
      badge.remove();
    };
    document.body.appendChild(badge);
  }

  async setupSubscription() {
    try {
      // Get user location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const { latitude, longitude } = position.coords;
          
          await fetch(`${this.apiBase}/subscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: this.userId,
              preferences: {
                categories: ['festival', 'ceremony', 'workshop', 'exhibition', 'performance', 'ritual', 'celebration', 'gathering'],
                radius: 50,
                notificationMethods: ['push'],
                location: { lat: latitude, lng: longitude }
              }
            })
          });
        });
      }
    } catch (error) {
      console.error('Error setting up subscription:', error);
    }
  }

  setupEventListeners() {
    // Filter controls
    document.addEventListener('change', (e) => {
      if (e.target.closest('#event-category-filter')) {
        const category = e.target.closest('#event-category-filter').value;
        this.loadEvents({ category: category || undefined });
      }
    });

    // Search
    document.addEventListener('input', (e) => {
      if (e.target.id === 'event-search') {
        const search = e.target.value;
        this.loadEvents({ search: search || undefined });
      }
    });
  }

  setLoading(container, isLoading) {
    if (isLoading) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px;">
          <div style="
            display: inline-block;
            width: 40px;
            height: 40px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #4CAF50;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          "></div>
          <p style="margin-top: 10px;">Loading events...</p>
        </div>
      `;
    }
  }

  showError(container, message) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; background: #fff3f3; border-radius: 10px;">
        <p style="color: #f44336;">❌ ${message}</p>
        <button onclick="window.eventUI.loadEvents()" style="
          margin-top: 10px;
          padding: 8px 20px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
        ">Retry</button>
      </div>
    `;
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 12px 24px;
      background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
      color: white;
      border-radius: 8px;
      z-index: 99999;
      animation: slideIn 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const eventUI = new EventDiscoveryUI({
    container: '#events-container'
  });
  window.eventUI = eventUI;
});

// Add CSS
const style = document.createElement('style');
style.textContent = `
  .events-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 20px;
    padding: 20px;
  }
  .event-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 20px rgba(0,0,0,0.15) !important;
  }
  .empty-state {
    text-align: center;
    padding: 60px;
    color: #666;
  }
  .empty-state button {
    margin-top: 10px;
    padding: 8px 20px;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
`;
document.head.appendChild(style);