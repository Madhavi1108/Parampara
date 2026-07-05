const MAP_STYLES = {
  en: `https://api.maptiler.com/maps/streets/style.json?key=${process.env.MAPTILER_KEY}`,

  hi: `https://api.maptiler.com/maps/streets/style.json?key=${process.env.MAPTILER_KEY}&language=hi`,

  mr: `https://api.maptiler.com/maps/streets/style.json?key=${process.env.MAPTILER_KEY}&language=mr`,
};

module.exports = MAP_STYLES;
