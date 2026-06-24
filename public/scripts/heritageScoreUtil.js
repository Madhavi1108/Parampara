// public/scripts/heritageScoreUtil.js
// Utility to fetch Living Heritage Scores and cache results

const _heritageScoreCache = {};

/**
 * Get score and category for a given type and id.
 * @param {'village'|'item'|'tradition'|'festival'|'craft'} type
 * @param {string} id
 * @returns {Promise<{score:number, category:string}>}
 */
async function getHeritageScore(type, id) {
  const cacheKey = `${type}:${id}`;
  if (_heritageScoreCache[cacheKey]) {
    return _heritageScoreCache[cacheKey];
  }
  try {
    const response = await fetch(`/api/heritage-score/${type}/${id}`);
    const data = await response.json();
    _heritageScoreCache[cacheKey] = data;
    return data;
  } catch (e) {
    const fallback = { score: 0, category: 'Endangered' };
    _heritageScoreCache[cacheKey] = fallback;
    return fallback;
  }
}

// Expose globally for other scripts
window.heritageScoreUtil = { getScore: getHeritageScore };
