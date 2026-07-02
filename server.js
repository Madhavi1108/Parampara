// import dotenv from "dotenv";
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');

const app = express();

const itemRoutes = require('./routes/item.routes');
const pathRoutes = require('./routes/path.routes');
const progressRoutes = require('./routes/progress.routes');
const postRoutes = require('./routes/post.routes');
const chatRoutes = require('./routes/chat.routes');
const checkinRoutes = require('./routes/checkin.routes');
const artisanRoutes = require('./routes/artisan.routes');
const storyRoutes = require('./routes/story.routes');
const auditRoutes = require('./routes/audit.routes');
const csrfRoutes = require('./routes/csrf.routes');
const cacheRoutes = require('./routes/cache.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const searchRoutes = require('./routes/search.routes');
const { csrfProtection } = require('./middleware/csrf');

const store = require('./data/store');

const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const SlidingWindowLimiter = require('./middleware/rateLimiter');

const initializeSampleData = require('./config/sampleData');

const PORT = process.env.PORT || 3000;

// Middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'https://unpkg.com', 'https://cdn.jsdelivr.net', 'https://cdnjs.cloudflare.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://unpkg.com'],
        imgSrc: [
          "'self'",
          'data:',
          'blob:',
          'https://unpkg.com',
          'https://api.maptiler.com',
          'https://cdn.sanity.io',
          'https://encrypted-tbn0.gstatic.com',
          'https://cdn.shopify.com',
        ],
        connectSrc: ["'self'", 'https://api.maptiler.com'],
        workerSrc: ["'self'", 'blob:'],
        childSrc: ["'self'", 'blob:'],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
  })
);

app.use(cors());

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(express.static(path.join(__dirname, 'public')));

// Initialize Data
initializeSampleData();

// Home Route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
const translationsData = require('./data/translationsData');

app.get('/api/language', (req, res) => {
  res.json({
    default: 'en',
    supported: ['en', 'hi', 'mr'],
  });
});

app.get('/api/translations', (req, res) => {
  res.json(translationsData);
});

// CSRF Token Route
app.use('/api/csrf-token', csrfRoutes);

// Apply CSRF protection globally for state-changing routes
app.use(csrfProtection);

// Global API Rate Limiter (100 reqs / 1 min)
const globalLimiter = new SlidingWindowLimiter({
  windowMs: 60000,
  max: 100,
  message: 'Too many API requests from this IP, please try again after a minute.'
});
app.use('/api', globalLimiter.middleware());

// API Routes
app.use('/api/items', itemRoutes);

// Heritage Score API
const heritageScoreRoutes = require('./routes/heritageScore.routes');
app.use('/api/heritage-score', heritageScoreRoutes);


app.use('/api/paths', pathRoutes);

app.use('/api/progress', progressRoutes);

app.use('/api/posts', postRoutes);

app.use('/api/chat', chatRoutes);

app.use('/api/checkin', checkinRoutes);

app.use('/api/story-generator', storyRoutes);
app.use('/api/artisans', artisanRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/cache', cacheRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/search', searchRoutes);

const exportRoutes = require('./routes/export.routes');
app.use('/api/export', exportRoutes);

app.get('/api/reputation', (req, res, next) => {
  try {
    const contributors = store.contributors || [];
    const calculated = contributors.map((c) => {
      const score =
        (c.stories || 0) * 20 +
        (c.photos || 0) * 10 +
        (c.culturalItems || 0) * 30 +
        (c.checkins || 0) * 5 +
        (c.quests || 0) * 15;

      let badge = 'Heritage Explorer';
      if (score >= 400) {
        badge = 'Heritage Guardian';
      } else if (score >= 250) {
        badge = 'Cultural Archivist';
      } else if (score >= 100) {
        badge = 'Story Collector';
      }

      return {
        id: c.id,
        name: c.name,
        stories: c.stories || 0,
        photos: c.photos || 0,
        culturalItems: c.culturalItems || 0,
        checkins: c.checkins || 0,
        quests: c.quests || 0,
        score,
        badge,
        memberSince: c.memberSince,
      };
    });

    // Sort by score descending
    calculated.sort((a, b) => b.score - a.score);

    res.json(calculated);
  } catch (error) {
    next(error);
  }
});

app.get('/api/timeline', (req, res, next) => {
  try {
    let events = store.timelineEvents || [];

    if (req.query.item) {
      const itemFilter = req.query.item.toLowerCase();
      events = events.filter((e) => e.item.toLowerCase() === itemFilter);
    }

    if (req.query.type) {
      const typeFilter = req.query.type.toLowerCase();
      events = events.filter((e) => e.type.toLowerCase() === typeFilter);
    }

    res.json(events);
  } catch (error) {
    next(error);
  }
});

app.get('/api/risk-dashboard', (req, res, next) => {
  try {
    const items = store.culturalItems || [];
    const responseData = items.map((item) => ({
      name: item.title,
      location: item.location,
      artisans: item.artisans !== undefined ? item.artisans : 5,
      records: item.records !== undefined ? item.records : 3,
      lastUpdated:
        item.lastUpdated ||
        (item.timestamp
          ? item.timestamp.split('T')[0]
          : new Date().toISOString().split('T')[0]),
      engagement: item.engagement !== undefined ? item.engagement : 50,
    }));
    res.json(responseData);
  } catch (error) {
    next(error);
  }
});

app.get('/api/map-style', async (req, res) => {
  if (!process.env.MAPTILER_KEY) {
    // FALLBACK TO OSM IF KEY IS MISSING (Return raw style object like MapTiler does)
    return res.json({
      version: 8,
      sources: {
        'osm': {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '&copy; OpenStreetMap Contributors',
        },
      },
      layers: [
        {
          id: 'osm-layer',
          type: 'raster',
          source: 'osm',
          minzoom: 0,
          maxzoom: 19,
        },
      ],
    });
  }

  try {
    const response = await fetch(
      `https://api.maptiler.com/maps/streets/style.json?key=${process.env.MAPTILER_KEY}`
    );

    if (!response.ok) {
      return res.status(502).json({
        configured: false,
        message:
          'Unable to load map tiles. Please verify your MAPTILER_KEY is valid.',
      });
    }

    const style = await response.json();
    res.json(style);
  } catch (error) {
    res.status(502).json({
      configured: false,
      message: 'Unable to load map tiles. Please try again later.',
    });
  }
});

// 404 Middleware
app.use(notFound);

// Error Middleware
app.use(errorHandler);



// Start Server
const server = app.listen(PORT, () => {
  console.log(`✨ Parampara server running on http://localhost:${PORT}`);
});
