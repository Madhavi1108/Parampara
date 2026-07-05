/**
 * Parampara - Village Contribution Reputation System Logic
 *
 * Responsibilities:
 *   1. Fetch contributor records from API: GET /api/reputation
 *   2. Support active contributor profile switching (default: Rahul Sharma, ID 1)
 *   3. Populates stats and dynamically calculates sum total contributions
 *   4. Generates leaderboard table and marks active row
 *   5. Listen to language changes and dynamically update labels
 */

let contributorsData = [];
let activeUserId = 1; // Default to Rahul Sharma (ID 1)

document.addEventListener('DOMContentLoaded', () => {
  loadReputationData();

  // Listen to global language change events emitted by languageSwitcher.js
  window.addEventListener('parampara:langchange', () => {
    if (contributorsData.length > 0) {
      renderPage();
    }
  });
});

/**
 * Fetch contributor data from backend
 */
async function loadReputationData() {
  try {
    const response = await fetch('/api/reputation');
    if (!response.ok) {
      throw new Error(`API returned HTTP error status: ${response.status}`);
    }
    contributorsData = await response.json();
    renderPage();
  } catch (error) {
    console.error('Error fetching reputation data:', error);
    const tbody = document.getElementById('leaderboard-body');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; color: var(--rust-red); padding: 2rem;">
            <i class="ti ti-alert-triangle" style="font-size: 2rem; display: block; margin-bottom: 0.5rem;"></i>
            Failed to load contributor data. Please try again later.
          </td>
        </tr>
      `;
    }
  }
}

/**
 * Retrieve translation for key or return key as fallback
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
 * Map string badge to dynamic translation key
 */
function getBadgeTranslationKey(badgeName) {
  switch (badgeName) {
    case 'Heritage Explorer':
      return 'badge_explorer';
    case 'Story Collector':
      return 'badge_collector';
    case 'Cultural Archivist':
      return 'badge_archivist';
    case 'Heritage Guardian':
      return 'badge_guardian';
    default:
      return badgeName;
  }
}

/**
 * Get styling class for badge tags
 */
function getBadgeClass(badgeName) {
  switch (badgeName) {
    case 'Heritage Explorer':
      return 'tag-explorer';
    case 'Story Collector':
      return 'tag-collector';
    case 'Cultural Archivist':
      return 'tag-archivist';
    case 'Heritage Guardian':
      return 'tag-guardian';
    default:
      return 'tag-explorer';
  }
}

/**
 * Get icons/emojis for the badge progression
 */
function getBadgeIcon(badgeName) {
  switch (badgeName) {
    case 'Heritage Explorer':
      return '🧗';
    case 'Story Collector':
      return '📜';
    case 'Cultural Archivist':
      return '🏛️';
    case 'Heritage Guardian':
      return '🏅';
    default:
      return '🏅';
  }
}

/**
 * Render all section components
 */
function renderPage() {
  renderProfileCard();
  renderLeaderboard();
}

/**
 * Render profile card and statistic values
 */
function renderProfileCard() {
  const activeUser = contributorsData.find((c) => c.id == activeUserId);
  if (!activeUser) return;

  // Update Profile Card
  document.getElementById('user-name').textContent = activeUser.name;

  const badgeKey = getBadgeTranslationKey(activeUser.badge);
  const badgeEmoji = getBadgeIcon(activeUser.badge);
  document.getElementById('user-badge').innerHTML = `${badgeEmoji} ${escapeHtml(translate(badgeKey))}`;

  // Member Since date display
  document.getElementById('user-joined').textContent = activeUser.memberSince;
  document.getElementById('user-score').textContent = activeUser.score;

  // Update Statistics Box
  document.getElementById('stat-stories').textContent = activeUser.stories;
  document.getElementById('stat-photos').textContent = activeUser.photos;
  document.getElementById('stat-items').textContent = activeUser.culturalItems;
  document.getElementById('stat-checkins').textContent = activeUser.checkins;
  document.getElementById('stat-quests').textContent = activeUser.quests || 0;

  // Sum total contributions dynamically
  const total =
    activeUser.stories +
    activeUser.photos +
    activeUser.culturalItems +
    activeUser.checkins +
    (activeUser.quests || 0);
  document.getElementById('stat-total').textContent = total;
}

/**
 * Render dynamic contributors leaderboard table
 */
function renderLeaderboard() {
  const tbody = document.getElementById('leaderboard-body');
  if (!tbody) return;

  tbody.innerHTML = contributorsData
    .map((c, index) => {
      const rank = index + 1;
      let rankContent = `<span class="rank-badge">${rank}</span>`;
      if (rank === 1) rankContent = `<span class="rank-badge rank-1">🥇</span>`;
      else if (rank === 2) rankContent = `<span class="rank-badge rank-2">🥈</span>`;
      else if (rank === 3) rankContent = `<span class="rank-badge rank-3">🥉</span>`;

      const badgeKey = getBadgeTranslationKey(c.badge);
      const badgeClass = getBadgeClass(c.badge);
      const activeClass = c.id == activeUserId ? 'class="active-user-row"' : '';

      return `
        <tr ${activeClass} data-id="${c.id}">
          <td>${rankContent}</td>
          <td style="font-weight: 600;">${escapeHtml(c.name)}</td>
          <td style="font-weight: 700; color: var(--accent-color);">${c.score}</td>
          <td>
            <span class="tag-badge ${badgeClass}">${escapeHtml(translate(badgeKey))}</span>
          </td>
        </tr>
      `;
    })
    .join('');

  // Add click listeners to rows to switch selected profile display
  tbody.querySelectorAll('tr').forEach((row) => {
    row.addEventListener('click', () => {
      activeUserId = row.getAttribute('data-id');
      renderPage();
    });
  });
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
