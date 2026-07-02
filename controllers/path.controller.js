const store = require('../data/store');

// Allowed values for query params (whitelist approach)
const ALLOWED_SORT_FIELDS = new Set(['itemCount']);
const ALLOWED_ORDERS = new Set(['asc', 'desc']);

/**
 * GET /api/paths
 * Query params:
 *   theme  — filter by theme (case-insensitive, partial match); trimmed
 *   sort   — "itemCount" to sort by number of connected items (only allowed value)
 *   order  — "asc" | "desc"  (default: "asc"); unknown values default to "asc"
 *
 * Edge cases handled:
 *   - theme is whitespace-only           → treated as no filter
 *   - theme is longer than 200 chars     → 400 Bad Request
 *   - sort value not in whitelist        → sort param silently ignored
 *   - order value not in whitelist       → defaults to "asc"
 *   - paths with missing items/theme     → treated as [] / "" respectively
 *   - store is empty                     → returns []
 */
const getPaths = (req, res, next) => {
  try {
    let { theme = '', sort = '', order = 'asc' } = req.query;

    // ── Sanitise & validate ─────────────────────────────────────────────────
    theme = String(theme).trim();
    sort  = String(sort).trim();
    order = String(order).trim().toLowerCase();

    if (theme.length > 200) {
      return res.status(400).json({ error: 'Query param "theme" exceeds 200 characters.' });
    }

    // Whitelist: ignore unknown sort fields
    if (!ALLOWED_SORT_FIELDS.has(sort)) sort = '';

    // Whitelist: default invalid order to 'asc'
    if (!ALLOWED_ORDERS.has(order)) order = 'asc';

    // ── Start from store ────────────────────────────────────────────────────
    let paths = store.heritagePaths.map((p) => ({
      ...p,
      items: Array.isArray(p.items) ? p.items : [],
      theme: typeof p.theme === 'string' ? p.theme : '',
    }));

    // ── Theme filter (case-insensitive, partial match) ──────────────────────
    if (theme !== '') {
      const needle = theme.toLowerCase();
      paths = paths.filter((p) =>
        p.theme.toLowerCase().includes(needle)
      );
    }

    // ── Sort by item count ──────────────────────────────────────────────────
    if (sort === 'itemCount') {
      const direction = order === 'desc' ? -1 : 1;
      // Stable sort: preserve insertion order for equal counts
      paths = paths
        .map((p, i) => ({ p, i }))
        .sort((a, b) => {
          const diff = a.p.items.length - b.p.items.length;
          return diff !== 0 ? diff * direction : a.i - b.i;
        })
        .map(({ p }) => p);
    }

    res.json(paths);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/paths/themes
 * Returns an array of distinct non-empty themes, alphabetically sorted.
 * Edge cases: paths with undefined/null/empty theme are excluded.
 */
const getPathThemes = (req, res, next) => {
  try {
    const themes = [
      ...new Set(
        store.heritagePaths
          .map((p) => (typeof p.theme === 'string' ? p.theme.trim() : ''))
          .filter(Boolean)
      ),
    ].sort((a, b) => a.localeCompare(b));
    res.json(themes);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/paths
 * Creates a new heritage path.
 * Edge cases:
 *   - title / theme that are only whitespace → 400
 *   - title or theme longer than 200 chars   → 400
 *   - items that are not strings              → filtered out
 *   - duplicate item IDs in items array       → deduplicated
 */
const createPath = (req, res, next) => {
  try {
    const title = String(req.body.title || '').trim();
    const theme = String(req.body.theme || '').trim();
    const description = String(req.body.description || '').trim();

    if (!title || !theme) {
      return res.status(400).json({
        error: 'Missing required fields: title and theme must be non-empty strings.',
      });
    }

    if (title.length > 200) {
      return res.status(400).json({ error: 'Field "title" exceeds 200 characters.' });
    }
    if (theme.length > 200) {
      return res.status(400).json({ error: 'Field "theme" exceeds 200 characters.' });
    }

    // Deduplicate and sanitise items array
    const rawItems = Array.isArray(req.body.items) ? req.body.items : [];
    const items = [...new Set(rawItems.filter((id) => typeof id === 'string' && id.trim()))];

    const newPath = {
      id: Date.now().toString(),
      title,
      description,
      items,
      theme,
    };

    store.heritagePaths.push(newPath);

    res.status(201).json(newPath);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/paths/route
 * Query params: start (id), end (id), theme (optional)
 * Computes shortest path using GraphEngine
 */
const getOptimizedRoute = (req, res, next) => {
  try {
    const { start, end, theme } = req.query;
    
    if (!start || !end) {
      return res.status(400).json({ error: 'Missing required query parameters: start and end.' });
    }

    const GraphEngine = require('../utils/GraphEngine');
    const engine = new GraphEngine(store.culturalItems, store.heritagePaths);

    try {
      const route = engine.findShortestPath(start, end, { theme });
      if (!route) {
        return res.status(404).json({ error: 'No valid route found between the specified locations.' });
      }
      res.json(route);
    } catch (err) {
      if (err.message === 'Invalid start or end location.') {
        return res.status(400).json({ error: err.message });
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPaths,
  getPathThemes,
  createPath,
  getOptimizedRoute,
};
