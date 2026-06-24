// server/utils/heritageScore.js
// Utility to calculate Living Heritage Score for various entities.
// Scores are deterministic based on existing in‑memory store data.

const store = require('../../data/store');

// Weight percentages (must sum to 100)
const WEIGHTS = {
  activeContributors: 0.25,
  recentUpdates: 0.20,
  audioStory: 0.15,
  documentation: 0.15,
  communityEngagement: 0.15,
  festivalParticipation: 0.10,
};

/**
 * Normalizes a value to 0‑1 range based on a max threshold.
 * @param {number} value
 * @param {number} max
 * @returns {number}
 */
function normalize(value, max) {
  if (max === 0) return 0;
  const n = value / max;
  return n > 1 ? 1 : n;
}

/**
 * Calculates the raw score (0‑100) for a given entity.
 * @param {string} type - one of "village", "tradition", "festival", "craft", "item"
 * @param {object} entity - the data object from the store
 * @returns {number}
 */
function calculateScore(type, entity) {
  // 1. Active Contributors – use total contributors count as proxy.
  const contributorsScore = normalize(store.contributors?.length || 0, 100);

  // 2. Recent Updates – check timestamp within last 30 days.
  let recentUpdatesScore = 0;
  if (entity.timestamp) {
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const age = Date.now() - new Date(entity.timestamp).getTime();
    recentUpdatesScore = age <= thirtyDaysMs ? 1 : 0;
  }

  // 3. Audio Story Availability – true if type is audio.
  const audioStoryScore = entity.type === 'audio' ? 1 : 0;

  // 4. Documentation Completeness – presence of description.
  const documentationScore = entity.description ? 1 : 0;

  // 5. Community Engagement – number of posts referencing this entity (by id).
  const relatedPosts = store.villagePosts.filter(p => p.villageId === entity.id).length;
  const communityEngagementScore = normalize(relatedPosts, 10);

  // 6. Festival/Event Participation – true for festival type.
  const festivalParticipationScore = type === 'festival' ? 1 : 0;

  const rawScore =
    contributorsScore * WEIGHTS.activeContributors * 100 +
    recentUpdatesScore * WEIGHTS.recentUpdates * 100 +
    audioStoryScore * WEIGHTS.audioStory * 100 +
    documentationScore * WEIGHTS.documentation * 100 +
    communityEngagementScore * WEIGHTS.communityEngagement * 100 +
    festivalParticipationScore * WEIGHTS.festivalParticipation * 100;

  // Clamp to 0‑100 and round.
  return Math.round(Math.min(100, Math.max(0, rawScore)));
}

/**
 * Returns the category based on score.
 * @param {number} score
 * @returns {string}
 */
function getCategory(score) {
  if (score >= 90) return 'Thriving';
  if (score >= 70) return 'Stable';
  if (score >= 40) return 'Vulnerable';
  return 'Endangered';
}

/**
 * Public API – fetch score & category for a given type/id.
 * @param {string} type
 * @param {string} id
 * @returns {{score:number, category:string}}
 */
function getScore(type, id) {
  // Resolve entity from the store based on type.
  let entity = null;
  switch (type) {
    case 'village':
      // Villages are not a separate collection; we infer from posts or items that have location.
      // For demo purposes, find first item with matching id.
      entity = store.culturalItems.find(i => i.id === id) || {};
      break;
    case 'tradition':
    case 'festival':
    case 'craft':
    case 'item':
      entity = store.culturalItems.find(i => i.id === id) || {};
      break;
    default:
      entity = {};
  }

  const score = calculateScore(type, entity);
  const category = getCategory(score);
  return { score, category };
}

module.exports = { getScore, calculateScore, getCategory };
