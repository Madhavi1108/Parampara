// public/scripts/recommendations.js

class RecommendationUI {
  constructor(options = {}) {
    this.apiBase = options.apiBase || '/api/recommendations';
    this.userId = this.getUserId() || 'user1';
    this.container = options.container || '#recommendations-container';
    this.similarContainer = options.similarContainer || '#similar-content-container';
    this.isLoading = false;
    
    this.init();
  }

  init() {
    this.loadRecommendations();
    this.setupEventListeners();
  }

  getUserId() {
    // Get from localStorage or session
    let userId = localStorage.getItem('userId');
    if (!userId) {
      userId = `user_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('userId', userId);
    }
    return userId;
  }

  async loadRecommendations(limit = 10) {
    const container = document.querySelector(this.container);
    if (!container) return;

    this.setLoading(container, true);

    try {
      const response = await fetch(`${this.apiBase}/contents/${this.userId}?limit=${limit}`);
      const data = await response.json();

      if (data.success) {
        this.renderRecommendations(container, data.recommendations);
      } else {
        this.showError(container, 'Failed to load recommendations');
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
      this.showError(container, 'Error loading recommendations');
    } finally {
      this.setLoading(container, false);
    }
  }

  renderRecommendations(container, recommendations) {
    if (!recommendations || recommendations.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No recommendations available yet. Start exploring content!</p>
        </div>
      `;
      return;
    }

    const html = `
      <div class="recommendations-grid">
        ${recommendations.map(rec => this.renderRecommendationCard(rec)).join('')}
      </div>
    `;

    container.innerHTML = html;
    
    // Add trackers
    container.querySelectorAll('.recommendation-card').forEach(card => {
      const contentId = card.dataset.contentId;
      card.addEventListener('click', () => {
        this.trackInteraction(contentId, 'click');
      });
    });
  }

  renderRecommendationCard(rec) {
    return `
      <div class="recommendation-card" data-content-id="${rec.id}" style="
        background: white;
        border-radius: 10px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        overflow: hidden;
        transition: transform 0.3s, box-shadow 0.3s;
        cursor: pointer;
      ">
        ${rec.image ? `<img src="${rec.image}" alt="${rec.title}" style="width: 100%; height: 200px; object-fit: cover;">` : ''}
        <div style="padding: 15px;">
          <h3 style="margin: 0 0 5px 0; font-size: 18px;">${rec.title || 'Untitled'}</h3>
          <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">${(rec.description || '').substring(0, 100)}...</p>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            ${rec.tags ? rec.tags.map(tag => 
              `<span style="background: #f0f0f0; padding: 2px 10px; border-radius: 15px; font-size: 12px;">${tag}</span>`
            ).join('') : ''}
          </div>
          <div style="margin-top: 10px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 12px; color: #999;">Score: ${Math.round(rec.score * 100)}%</span>
            <div>
              <button onclick="window.recommendationUI.trackInteraction('${rec.id}', 'save')" style="
                background: none;
                border: none;
                cursor: pointer;
                font-size: 18px;
                color: #4CAF50;
              ">❤️</button>
              <button onclick="window.recommendationUI.trackInteraction('${rec.id}', 'share')" style="
                background: none;
                border: none;
                cursor: pointer;
                font-size: 18px;
                color: #2196F3;
              ">📤</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async loadSimilarContent(contentId, limit = 5) {
    const container = document.querySelector(this.similarContainer);
    if (!container) return;

    this.setLoading(container, true);

    try {
      const response = await fetch(`${this.apiBase}/similar/${contentId}?limit=${limit}`);
      const data = await response.json();

      if (data.success) {
        this.renderSimilarContent(container, data.similar);
      }
    } catch (error) {
      console.error('Error loading similar content:', error);
    } finally {
      this.setLoading(container, false);
    }
  }

  renderSimilarContent(container, similar) {
    if (!similar || similar.length === 0) {
      container.innerHTML = '<p>No similar content found</p>';
      return;
    }

    const html = `
      <div class="similar-content-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;">
        ${similar.map(item => `
          <div class="similar-card" style="
            background: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 1px 5px rgba(0,0,0,0.1);
            cursor: pointer;
          " data-content-id="${item.id}">
            <h4 style="margin: 0 0 5px 0;">${item.title || 'Untitled'}</h4>
            <p style="margin: 0; font-size: 12px; color: #666;">Similarity: ${Math.round(item.score * 100)}%</p>
          </div>
        `).join('')}
      </div>
    `;

    container.innerHTML = html;
  }

  async trackInteraction(contentId, action, metadata = {}) {
    try {
      const response = await fetch(`${this.apiBase}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: this.userId,
          contentId,
          action,
          metadata: {
            ...metadata,
            timestamp: new Date().toISOString()
          }
        })
      });

      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Tracked ${action} for content ${contentId}`);
      }
    } catch (error) {
      console.error('Error tracking interaction:', error);
    }
  }

  setLoading(container, isLoading) {
    this.isLoading = isLoading;
    
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
          <p style="margin-top: 10px;">Loading recommendations...</p>
        </div>
      `;
    }
  }

  showError(container, message) {
    container.innerHTML = `
      <div style="
        text-align: center;
        padding: 40px;
        background: #fff3f3;
        border-radius: 10px;
        color: #d32f2f;
      ">
        <p>❌ ${message}</p>
        <button onclick="window.recommendationUI.loadRecommendations()" style="
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

  setupEventListeners() {
    // Global click handler for recommendation cards
    document.addEventListener('click', (e) => {
      const card = e.target.closest('.recommendation-card, .similar-card');
      if (card && card.dataset.contentId) {
        const contentId = card.dataset.contentId;
        this.trackInteraction(contentId, 'view');
        
        // Load similar content if it's a recommendation card
        if (card.classList.contains('recommendation-card')) {
          const similarContainer = document.querySelector(this.similarContainer);
          if (similarContainer) {
            this.loadSimilarContent(contentId);
          }
        }
      }
    });
  }

  // Refresh recommendations
  refresh() {
    this.loadRecommendations();
  }

  // Get metrics
  async getMetrics() {
    try {
      const response = await fetch(`${this.apiBase}/metrics`);
      const data = await response.json();
      return data.metrics;
    } catch (error) {
      console.error('Error getting metrics:', error);
      return null;
    }
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const recommendationUI = new RecommendationUI({
    container: '#recommendations-container',
    similarContainer: '#similar-content-container'
  });
  
  // Make it globally accessible
  window.recommendationUI = recommendationUI;
});

// Add CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .recommendation-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 20px rgba(0,0,0,0.15) !important;
  }
  
  .similar-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 10px rgba(0,0,0,0.15) !important;
  }
  
  .empty-state {
    text-align: center;
    padding: 40px;
    color: #666;
  }
`;
document.head.appendChild(style);