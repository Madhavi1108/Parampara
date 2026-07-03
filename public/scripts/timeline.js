/**
 * Parampara - Historical Timeline & Time Travel Mode JS
 *
 * Responsibilities:
 *   1. Fetch timeline milestone records from GET /api/timeline
 *   2. Support horizontal timeline slider interactions (1950, 1980, 2000, 2025)
 *   3. Toggle Time Travel Mode with specialized visual styling and tense switches:
 *      - Active Year = Event Year: Present tense
 *      - Active Year > Event Year: Past tense
 *      - Active Year < Event Year: Future tense prediction
 *   4. Build and render Before/After comparisons
 *   5. Perform search queries and category filtering
 *   6. Update dashboard stats dynamically
 */

let allTimelineEvents = [];
let filteredTimelineEvents = [];
let isTimeTravelMode = false;
const eraYears = [1950, 1980, 2000, 2025];
let activeEraIndex = 3; // Default to 2025 (Index 3)

document.addEventListener('DOMContentLoaded', () => {
  initTimeline();

  // Listen to global language changes
  window.addEventListener('parampara:langchange', () => {
    if (allTimelineEvents.length > 0) {
      updateUI();
    }
  });
});

/**
 * Initialize page states, sliders, and event listeners
 */
function initTimeline() {
  const slider = document.getElementById('time-slider');
  const toggleBtn = document.getElementById('time-travel-toggle-btn');
  const searchInput = document.getElementById('timeline-search');
  const categoryFilter = document.getElementById('category-filter');
  const ticks = document.querySelectorAll('.tick-label');

  // Load data
  fetchTimelineEvents();

  // Slider change
  if (slider) {
    slider.addEventListener('input', (e) => {
      activeEraIndex = parseInt(e.target.value);
      updateSliderUI();
      updateUI();
    });

    // Keyboard support: range inputs natively handle left/right arrow.
    // We add an accessibility check to announce values to screen readers.
    slider.addEventListener('change', (e) => {
      const activeYear = eraYears[activeEraIndex];
      slider.setAttribute('aria-valuetext', `Year ${activeYear}`);
    });
  }

  // Tick click
  ticks.forEach((tick, index) => {
    tick.addEventListener('click', () => {
      activeEraIndex = index;
      if (slider) slider.value = index;
      updateSliderUI();
      updateUI();
    });
  });

  // Time travel toggle
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      isTimeTravelMode = !isTimeTravelMode;
      document.body.classList.toggle('time-travel-active', isTimeTravelMode);
      document.getElementById('time-travel-alert').classList.toggle('hidden', !isTimeTravelMode);
      
      toggleBtn.classList.toggle('active', isTimeTravelMode);
      
      updateSliderUI();
      updateUI();
    });
  }

  // Filters
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      applyFilters();
    });
  }

  if (categoryFilter) {
    categoryFilter.addEventListener('change', () => {
      applyFilters();
    });
  }
}

/**
 * Fetch data from server API
 */
async function fetchTimelineEvents() {
  try {
    const response = await fetch('/api/timeline');
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    allTimelineEvents = await response.json();
    applyFilters();
  } catch (error) {
    console.error('Failed to fetch timeline data:', error);
    const container = document.getElementById('events-container');
    if (container) {
      container.innerHTML = `
        <div style="text-align: center; color: var(--rust-red); padding: 3rem 0;">
          <i class="ti ti-alert-triangle" style="font-size: 3rem; display: block; margin-bottom: 1rem;"></i>
          <h3>Failed to load timeline events</h3>
          <p>Please check your connection and try again.</p>
        </div>
      `;
    }
  }
}

/**
 * Apply category dropdown and search queries
 */
async function applyFilters() {
  const searchQuery = document.getElementById('timeline-search').value.toLowerCase().trim();
  const category = document.getElementById('category-filter').value;

  try {
    const container = document.getElementById('events-container');
    if (container && window.SkeletonEngine) {
      window.SkeletonEngine.show(container, 'timeline', 4, false);
    }
    
    // Simulate delay for skeleton preview
    const delay = new Promise(resolve => setTimeout(resolve, 300));
    const [result] = await Promise.all([
      window.dataWorker.runJob('filterTimelineEvents', {
        items: allTimelineEvents,
        search: searchQuery,
        category
      }),
      delay
    ]);
    
    filteredTimelineEvents = result;

    if (container && window.SkeletonEngine) {
      window.SkeletonEngine.hide(container);
    }
  } catch (error) {
    console.error('Worker filter error:', error);
    const container = document.getElementById('events-container');
    if (container && window.SkeletonEngine) {
      window.SkeletonEngine.hide(container);
    }

    filteredTimelineEvents = allTimelineEvents.filter((event) => {
      const matchesSearch =
        event.item.toLowerCase().includes(searchQuery) ||
        event.title.toLowerCase().includes(searchQuery) ||
        event.description.toLowerCase().includes(searchQuery);

      const matchesCategory = category === 'all' || event.type === category;

      return matchesSearch && matchesCategory;
    });
  }

  updateUI();
}

/**
 * Synchronize slider highlight variables and trigger body theme filter overrides
 */
function updateSliderUI() {
  const activeYear = eraYears[activeEraIndex];
  document.getElementById('current-year-val').textContent = activeYear;

  // Sync tick label active class
  const ticks = document.querySelectorAll('.tick-label');
  ticks.forEach((tick, idx) => {
    tick.classList.toggle('active', idx === activeEraIndex);
  });

  // Apply era theme styling to document body
  document.body.classList.remove('time-travel-1950', 'time-travel-1980', 'time-travel-2000');
  
  if (isTimeTravelMode) {
    if (activeYear === 1950) {
      document.body.classList.add('time-travel-1950');
    } else if (activeYear === 1980) {
      document.body.classList.add('time-travel-1980');
    } else if (activeYear === 2000) {
      document.body.classList.add('time-travel-2000');
    }
  }

  // Update Enter/Exit text on toggle button
  const toggleText = document.querySelector('#time-travel-toggle-btn span');
  if (toggleText) {
    toggleText.textContent = isTimeTravelMode ? translate('time_travel_exit') : translate('time_travel_toggle');
  }
}

/**
 * Render all section changes
 */
function updateUI() {
  renderComparisons();
  renderEvents();
  renderStatistics();
}

/**
 * Render before/after comparisons for filtered assets
 */
function renderComparisons() {
  const container = document.getElementById('comparison-container');
  if (!container) return;

  // Get unique list of items in the current selection
  const uniqueItems = [...new Set(filteredTimelineEvents.map((e) => e.item))];

  if (uniqueItems.length === 0) {
    container.innerHTML = `
      <div style="grid-column: span 3; text-align: center; color: rgba(255,255,255,0.6); padding: 1.5rem;">
        No assets selected to display evolution comparisons.
      </div>
    `;
    return;
  }

  // Build comparison cards for each unique item
  container.innerHTML = uniqueItems
    .map((item) => {
      // Find 1950 milestone and 2025 milestone
      const itemEvents = allTimelineEvents.filter((e) => e.item === item);
      const beforeEvent = itemEvents.find((e) => e.year === 1950);
      const afterEvent = itemEvents.find((e) => e.year === 2025);

      if (!beforeEvent || !afterEvent) return ''; // Skip if missing endpoints

      return `
        <div class="compare-card">
          <span class="compare-tag tag-before">${translate('before_label')}</span>
          <h4>${escapeHtml(item)}</h4>
          <span class="compare-year">Year 1950</span>
          <p class="compare-desc">${escapeHtml(beforeEvent.description)}</p>
        </div>
        
        <div class="vs-badge-wrapper">
          <div class="vs-badge">VS</div>
        </div>
        
        <div class="compare-card">
          <span class="compare-tag tag-after">${translate('after_label')}</span>
          <h4>${escapeHtml(item)}</h4>
          <span class="compare-year">Year 2025</span>
          <p class="compare-desc">${escapeHtml(afterEvent.description)}</p>
        </div>
      `;
    })
    .join('');
}

/**
 * Render the main vertical list of milestones
 */
function renderEvents() {
  const container = document.getElementById('events-container');
  if (!container) return;

  if (filteredTimelineEvents.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: rgba(255,255,255,0.6); padding: 3rem 0;">
        No milestones match your search filters.
      </div>
    `;
    return;
  }

  const activeYear = eraYears[activeEraIndex];

  // Render cards sorted chronologically
  const sortedEvents = [...filteredTimelineEvents].sort((a, b) => a.year - b.year);

  container.innerHTML = sortedEvents
    .map((event) => {
      // Tense description formatting for time travel
      let descriptionText = event.description;
      let cardStyle = '';

      if (isTimeTravelMode) {
        if (event.year === activeYear) {
          descriptionText = event.presentTense;
          cardStyle = 'style="border-color: var(--success); background: rgba(107, 142, 35, 0.15);"';
        } else if (event.year < activeYear) {
          descriptionText = event.pastTense;
        } else {
          // Future predictions
          descriptionText = `🔮 ${event.futureTense}`;
          cardStyle = 'style="opacity: 0.65; border-style: dotted;"';
        }
      }

      return `
        <article class="timeline-event-card" ${cardStyle}>
          <div class="timeline-node-pin"></div>
          <div class="event-card-header">
            <div class="event-header-left">
              <span class="event-emoji">${event.image || '🏛️'}</span>
              <h4 class="event-title">${escapeHtml(event.title)}</h4>
            </div>
            <div>
              <span class="event-item-name">${escapeHtml(event.item)}</span>
              <span class="event-year-tag">${event.year}</span>
            </div>
          </div>
          <p class="event-desc">${escapeHtml(descriptionText)}</p>
          <div class="event-significance-box">
            <span class="significance-title">${translate('historical_significance')}</span>
            <p class="significance-text">${escapeHtml(event.significance)}</p>
          </div>
        </article>
      `;
    })
    .join('');
}

/**
 * Calculate timeline statistics dynamically
 */
function renderStatistics() {
  const totalEventsElement = document.getElementById('stat-total-events');
  const earliestElement = document.getElementById('stat-earliest-event');
  const latestElement = document.getElementById('stat-latest-event');
  const assetsTrackedElement = document.getElementById('stat-assets-tracked');

  if (!totalEventsElement) return;

  totalEventsElement.textContent = filteredTimelineEvents.length;

  if (filteredTimelineEvents.length > 0) {
    const years = filteredTimelineEvents.map((e) => e.year);
    earliestElement.textContent = Math.min(...years);
    latestElement.textContent = Math.max(...years);

    const uniqueAssets = [...new Set(filteredTimelineEvents.map((e) => e.item))];
    assetsTrackedElement.textContent = uniqueAssets.length;
  } else {
    earliestElement.textContent = '-';
    latestElement.textContent = '-';
    assetsTrackedElement.textContent = '0';
  }
}

/**
 * Retrieve translation matching localized language code
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
 * Safe HTML string escape to prevent injection
 */
function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
