/**
 * Parampara - Cultural Heritage Risk Monitoring Dashboard Logic
 *
 * Responsibilities:
 *   1. Fetch cultural items from the backend API: GET /api/risk-dashboard
 *   2. Compute dynamic preservation risk score for each item using rule-based metrics.
 *   3. Render summary counts (Total, High, Medium, Low risk).
 *   4. Dynamically generate detail cards for each heritage tradition.
 *   5. Listen to language change events and re-translate dynamic contents.
 *   6. Fall back to local mock data when the live API is unavailable.
 */

// Global state to store loaded cultural assets
let culturalAssets = [];

// Tracks whether currently rendered data is mock/fallback data
let isUsingMockData = false;

/**
 * Local mock dataset used as a fallback when the live API
 * is unreachable or returns no usable data.
 */
const MOCK_HERITAGE_ASSETS = [
  {
    name: 'Kantha Embroidery Patterns',
    location: 'Kantha Village, Bengal',
    artisans: 12,
    records: 18,
    lastUpdated: '2026-05-15',
    engagement: 85,
  },
  {
    name: 'Dokra Metal Craft',
    location: 'Dhamtari, Chhattisgarh',
    artisans: 3,
    records: 5,
    lastUpdated: '2024-01-10',
    engagement: 40,
  },
  {
    name: 'Madhubani Paintings',
    location: 'Madhubani, Bihar',
    artisans: 25,
    records: 30,
    lastUpdated: '2026-06-01',
    engagement: 90,
  },
  {
    name: 'Sikki Grass Craft',
    location: 'Bihar',
    artisans: 4,
    records: 7,
    lastUpdated: '2025-08-20',
    engagement: 55,
  },
  {
    name: 'Kathputli String Puppetry',
    location: 'Rajasthan',
    artisans: 2,
    records: 2,
    lastUpdated: '2023-03-12',
    engagement: 22,
  },
];

document.addEventListener('DOMContentLoaded', () => {
  // Load and render initial dashboard data
  loadDashboardData();

  // Listen to global language change events emitted by languageSwitcher.js
  window.addEventListener('parampara:langchange', () => {
    if (culturalAssets.length > 0) {
      renderDashboard(culturalAssets);
      if (isUsingMockData) {
        showMockDataBanner();
      }
    }
  });
});

/**
 * Helper function to retrieve translated terms from global translations dictionary
 * @param {string} key - Translation lookup key
 * @returns {string} Translated text in current language, or fallback
 */
function translate(key) {
  const currentLang =
    localStorage.getItem('parampara_lang') ||
    localStorage.getItem('language') ||
    'en';
  if (typeof PARAMPARA_TRANSLATIONS === 'undefined') return key;

  const dict =
    PARAMPARA_TRANSLATIONS[currentLang] || PARAMPARA_TRANSLATIONS['en'];
  return dict[key] !== undefined
    ? dict[key]
    : PARAMPARA_TRANSLATIONS['en'][key] || key;
}

/**
 * Fetch cultural asset data from server API endpoint.
 * Falls back to local mock data if the API is unavailable or returns no data.
 */
async function loadDashboardData() {
  const gridContainer = document.getElementById('assets-grid');
  try {
    const response = await fetch('/api/risk-dashboard');
    if (!response.ok) {
      throw new Error(`API returned HTTP error status: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('API returned empty or invalid data');
    }

    culturalAssets = data;
    isUsingMockData = false;
    renderDashboard(culturalAssets);
  } catch (error) {
    console.warn(
      'Live API data unavailable, falling back to mock data:',
      error.message
    );

    try {
      culturalAssets = MOCK_HERITAGE_ASSETS;
      isUsingMockData = true;
      renderDashboard(culturalAssets);
      showMockDataBanner();
    } catch (renderError) {
      // True last-resort fallback: even mock data rendering failed
      console.error('Failed to render fallback mock data:', renderError);
      if (gridContainer) {
        gridContainer.innerHTML = `
          <div class="error-state">
            <i class="ti ti-exclamation-circle" style="font-size: 3rem; color: var(--rust-red); display: block; margin-bottom: 1rem;"></i>
            <h3>Failed to load dashboard data</h3>
            <p>Please check your connection and try again later.</p>
          </div>
        `;
      }
    }
  }
}

/**
 * Display a small non-blocking banner above the asset grid
 * indicating that sample/mock data is being shown instead of live data.
 */
function showMockDataBanner() {
  // Avoid duplicate banners if already present
  if (document.getElementById('mock-data-banner')) return;

  const assetsSection = document.querySelector('.assets-section');
  if (!assetsSection) return;

  const banner = document.createElement('div');
  banner.id = 'mock-data-banner';
  banner.className = 'mock-data-banner';
  banner.innerHTML = `
    <i class="ti ti-info-circle"></i>
    <span>Showing sample data — live data unavailable</span>
  `;

  assetsSection.insertBefore(banner, assetsSection.firstChild);
}

/**
 * Rule-based risk score calculation
 * Max score is 100.
 *
 * Rules:
 *   1. Active Artisans: Less than 5 artisans increases risk significantly.
 *   2. Documentation Records: Low amount of archives/documentation records increases risk.
 *   3. Last Documented Activity: Older than 1 year increases risk.
 *   4. Community Engagement Score: Low engagement increases risk.
 *
 * @param {Object} item - Heritage item details
 * @returns {number} Calculated risk score (0-100)
 */
function calculateRiskScore(item) {
  let score = 0;

  // Rule 1: Active Artisans
  if (item.artisans < 3) {
    score += 30; // Critical threat: less than 3 master artisans left
  } else if (item.artisans < 5) {
    score += 20; // High threat: less than 5 artisans
  } else if (item.artisans < 10) {
    score += 10; // Medium threat: less than 10 artisans
  }

  // Rule 2: Documentation Records (lower records = higher risk)
  if (item.records < 3) {
    score += 25; // Critical: barely documented
  } else if (item.records < 6) {
    score += 15; // High: low documentation records
  } else if (item.records < 10) {
    score += 5; // Moderate: partial documentation
  }

  // Rule 3: Last activity older than 1 year (current year is 2026)
  const lastDate = new Date(item.lastUpdated);
  const currentDate = new Date();
  const diffTime = Math.abs(currentDate - lastDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const diffYears = diffDays / 365.25;

  if (diffYears > 2) {
    score += 25; // Inactive for more than 2 years
  } else if (diffYears > 1) {
    score += 15; // Inactive for more than 1 year
  }

  // Rule 4: Community Engagement Score (lower score = higher risk)
  if (item.engagement < 30) {
    score += 25; // Extremely low engagement and awareness
  } else if (item.engagement < 50) {
    score += 15; // Low engagement
  } else if (item.engagement < 70) {
    score += 5; // Modest engagement
  }

  // Cap score at 100
  return Math.min(score, 100);
}

/**
 * Map numeric score to a categorised Risk Status
 * @param {number} score - The calculated score
 * @returns {string} 'high' | 'medium' | 'low'
 */
function getRiskCategory(score) {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

/**
 * Render all dashboard segments: summary cards & heritage grid cards
 * @param {Array} items - List of cultural items
 */
function renderDashboard(items) {
  const gridContainer = document.getElementById('assets-grid');
  if (!gridContainer) return;

  if (items.length === 0) {
    gridContainer.innerHTML = `
      <div class="loading-state">
        <p>No heritage items found in the digital archive.</p>
      </div>
    `;
    return;
  }

  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;

  // Process all items and construct visual markup
  const cardsHtml = items
    .map((item) => {
      // 1. Calculate dynamic risk score and status
      const score = calculateRiskScore(item);
      const category = getRiskCategory(score);

      // 2. Count risk metrics
      if (category === 'high') highCount++;
      else if (category === 'medium') mediumCount++;
      else lowCount++;

      // 3. Setup risk badge class, icon, and translation label
      let badgeClass;
      let badgeIcon;
      let badgeLabelKey;

      if (category === 'high') {
        badgeClass = 'high-risk';
        badgeIcon = 'ti-alert-octagon';
        badgeLabelKey = 'high_risk_label';
      } else if (category === 'medium') {
        badgeClass = 'medium-risk';
        badgeIcon = 'ti-alert-triangle';
        badgeLabelKey = 'medium_risk_label';
      } else {
        badgeClass = 'low-risk';
        badgeIcon = 'ti-shield-check';
        badgeLabelKey = 'low_risk_label';
      }

      // 4. Setup engagement meter color range
      let engagementClass = 'high-engagement';
      if (item.engagement < 30) {
        engagementClass = 'low-engagement';
      } else if (item.engagement < 70) {
        engagementClass = 'medium-engagement';
      }

      // Format date beautifully
      const formattedDate = formatDate(item.lastUpdated);

      // Construct the card UI block
      return `
      <article class="asset-card">
        <div class="asset-card-header">
          <div>
            <h3 class="asset-card-title">${escapeHtml(item.name)}</h3>
            <span class="asset-location"><i class="ti ti-map-pin"></i> ${escapeHtml(item.location)}</span>
          </div>
          <span class="risk-badge ${badgeClass}">
            <i class="ti ${badgeIcon}"></i> ${escapeHtml(translate(badgeLabelKey))}
          </span>
        </div>
        
        <div class="asset-card-body">
          <div class="asset-details-grid">
            <div class="detail-item">
              <span class="detail-label">${escapeHtml(translate('active_artisans'))}</span>
              <span class="detail-value">${item.artisans}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">${escapeHtml(translate('documentation_records'))}</span>
              <span class="detail-value">${item.records}</span>
            </div>
            <div class="detail-item" style="grid-column: span 2;">
              <span class="detail-label">${escapeHtml(translate('last_documented_activity'))}</span>
              <span class="detail-value">${formattedDate}</span>
            </div>
          </div>

          <div class="engagement-meter">
            <div class="engagement-header">
              <span class="engagement-label">${escapeHtml(translate('community_engagement_score'))}</span>
              <span class="engagement-value">${item.engagement}%</span>
            </div>
            <div class="meter-bg">
              <div class="meter-fill ${engagementClass}" style="width: ${item.engagement}%;"></div>
            </div>
          </div>
        </div>
      </article>
    `;
    })
    .join('');

  // Update summary counts in the DOM
  document.getElementById('total-count').textContent = items.length;
  document.getElementById('high-count').textContent = highCount;
  document.getElementById('medium-count').textContent = mediumCount;
  document.getElementById('low-count').textContent = lowCount;

  // Insert cards markup
  gridContainer.innerHTML = cardsHtml;
}

/**
 * Safe HTML string escape to prevent injection
 */
function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Format timestamp values to human readable locales
 */
function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  // Format date using browser locale
  const currentLang =
    localStorage.getItem('parampara_lang') ||
    localStorage.getItem('language') ||
    'en';
  return date.toLocaleDateString(
    currentLang === 'hi' ? 'hi-IN' : currentLang === 'mr' ? 'mr-IN' : 'en-US',
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }
  );
}