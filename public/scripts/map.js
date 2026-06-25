// Map Page JavaScript

let map;
let markers = [];
let heatmapLayer = null;
let ambientSoundEnabled = true;
let currentSound = null;
let heatmapMarkers = [];

let currentLanguage = localStorage.getItem('language') || 'en';

document.addEventListener('DOMContentLoaded', () => {
  const selector = document.getElementById('language-selector');
  selector.value = currentLanguage;

  // selector.addEventListener("change", (e) => {
  //     currentLanguage = e.target.value;
  //     localStorage.setItem("language", currentLanguage);

  //     // Re-apply language labels on existing style
  //     setMapLanguage(currentLanguage);
  //     addVillageMarkers(); // re-render markers with new language
  //     translatePage();
  // });
  selector.addEventListener('change', (e) => {
    currentLanguage = e.target.value;

    localStorage.setItem('language', currentLanguage);

    if (map && map.isStyleLoaded()) {
      setMapLanguage(currentLanguage);
    }

    if (map) {
      addVillageMarkers();
    }

    translatePage();
  });

  initializeMap();
  setupEventListeners();
  translatePage();
});

const sampleVillages = [
  {
    name: {
      en: 'Sundarbans Village',
      hi: 'सुंदरबन गांव',
      mr: 'सुंदरबन गाव',
    },
    coordinates: [21.9497, 88.8156],
    traditions: {
      en: [
        'Folk tales about tigers',
        'Traditional fishing methods',
        'Honey collection rituals',
      ],
      hi: [
        'बाघों की लोककथाएँ',
        'पारंपरिक मछली पकड़ने की विधियाँ',
        'शहद संग्रह अनुष्ठान',
      ],
      mr: ['वाघांच्या लोककथा', 'पारंपरिक मासेमारी पद्धती', 'मध संकलन विधी'],
    },
    festivals: {
      en: ['Bonbibi Puja', 'Honey Festival'],
      hi: ['बोनबिबी पूजा', 'हनी फेस्टिवल'],
      mr: ['बोनबिबी पूजा', 'हनी फेस्टिवल'],
    },
    crafts: {
      en: ['Coconut shell crafts', 'Traditional boat making'],
      hi: ['नारियल शिल्प', 'पारंपरिक नाव निर्माण'],
      mr: ['नारळ हस्तकला', 'पारंपरिक होडी निर्मिती'],
    },
    description: {
      en: 'A village in the Sundarbans known for its unique relationship with nature and tigers.',
      hi: 'सुंदरबन का एक गांव जो प्रकृति और बाघों के साथ अपने अनोखे संबंध के लिए प्रसिद्ध है।',
      mr: 'निसर्ग आणि वाघांशी असलेल्या अनोख्या नात्यासाठी प्रसिद्ध गाव.',
    },
    ambientSound: 'birds',
  },

  {
    name: {
      en: 'Kantha Village, Bengal',
      hi: 'कांथा गांव, बंगाल',
      mr: 'कांथा गाव, बंगाल',
    },
    coordinates: [22.5726, 88.3639],
    traditions: {
      en: ['Kantha embroidery', 'Oral storytelling', 'Traditional songs'],
      hi: ['कांथा कढ़ाई', 'मौखिक कथाएँ', 'पारंपरिक गीत'],
      mr: ['कांथा भरतकाम', 'लोककथा', 'पारंपरिक गीते'],
    },
    festivals: {
      en: ['Durga Puja', 'Kali Puja'],
      hi: ['दुर्गा पूजा', 'काली पूजा'],
      mr: ['दुर्गा पूजा', 'काली पूजा'],
    },
    crafts: {
      en: ['Kantha stitch work', 'Traditional sarees'],
      hi: ['कांथा सिलाई', 'पारंपरिक साड़ियाँ'],
      mr: ['कांथा शिवणकाम', 'पारंपरिक साड्या'],
    },
    description: {
      en: 'Famous for Kantha embroidery, where old saris are layered and stitched.',
      hi: 'कांथा कढ़ाई के लिए प्रसिद्ध, जिसमें पुरानी साड़ियों को जोड़कर सुंदर डिज़ाइन बनाए जाते हैं।',
      mr: 'कांथा भरतकामासाठी प्रसिद्ध.',
    },
    ambientSound: 'flute',
  },

  {
    name: {
      en: 'Madhubani Village, Bihar',
      hi: 'मधुबनी गांव, बिहार',
      mr: 'मधुबनी गाव, बिहार',
    },
    coordinates: [26.3537, 86.0719],
    traditions: {
      en: ['Madhubani painting', 'Mithila art', 'Folk songs'],
      hi: ['मधुबनी चित्रकला', 'मिथिला कला', 'लोकगीत'],
      mr: ['मधुबनी चित्रकला', 'मिथिला कला', 'लोकगीते'],
    },
    festivals: {
      en: ['Chhath Puja', 'Teej'],
      hi: ['छठ पूजा', 'तीज'],
      mr: ['छठ पूजा', 'तीज'],
    },
    crafts: {
      en: ['Madhubani paintings', 'Traditional pottery'],
      hi: ['मधुबनी पेंटिंग', 'मिट्टी के बर्तन'],
      mr: ['मधुबनी चित्रे', 'मातीची भांडी'],
    },
    description: {
      en: 'Home to the world-famous Madhubani paintings.',
      hi: 'विश्व प्रसिद्ध मधुबनी चित्रकला का केंद्र।',
      mr: 'जगप्रसिद्ध मधुबनी चित्रकलेचे केंद्र.',
    },
    ambientSound: 'flute',
  },

  {
    name: {
      en: 'Dokra Village, Chhattisgarh',
      hi: 'डोकरा गांव, छत्तीसगढ़',
      mr: 'डोकरा गाव, छत्तीसगड',
    },
    coordinates: [21.2787, 81.8661],
    traditions: {
      en: ['Dokra metal craft', 'Tribal dances', 'Harvest songs'],
      hi: ['डोकरा धातु कला', 'जनजातीय नृत्य', 'फसल गीत'],
      mr: ['डोकरा धातुकाम', 'आदिवासी नृत्य', 'पीक गीते'],
    },
    festivals: {
      en: ['Bastar Dussehra', 'Harvest Festival'],
      hi: ['बस्तर दशहरा', 'फसल उत्सव'],
      mr: ['बस्तर दसरा', 'पीक उत्सव'],
    },
    crafts: {
      en: ['Dokra metalwork', 'Bamboo crafts'],
      hi: ['डोकरा धातुकला', 'बांस शिल्प'],
      mr: ['डोकरा धातुकाम', 'बांबू हस्तकला'],
    },
    description: {
      en: 'Known for Dokra metal casting.',
      hi: 'डोकरा धातु ढलाई कला के लिए प्रसिद्ध।',
      mr: 'डोकरा धातुकामासाठी प्रसिद्ध.',
    },
    ambientSound: 'birds',
  },
];

function getTranslation() {
  return translations[currentLanguage];
}

function translatePage() {
  const t = getTranslation();

  const title = document.querySelector('.map-header h2');
  const subtitle = document.querySelector('.map-header p');
  const villageName = document.getElementById('village-name');

  if (title) title.textContent = t.mapTitle;
  if (subtitle) subtitle.textContent = t.mapDescription;
  if (villageName) villageName.textContent = t.selectVillage;
  document.getElementById('info-content').innerHTML =
    `<p>${t.clickVillage}</p>`;

  const heatmapBtn = document.getElementById('toggle-heatmap');

  if (heatmapLayer) {
    heatmapBtn.textContent = t.hideHeatmap;
  } else {
    heatmapBtn.textContent = t.toggleHeatmap;
  }

  // document.getElementById('toggle-sound').textContent = ambientSoundEnabled
  //   ? t.soundOn
  //   : t.soundOff;

  updateMapUnavailableNotice();
}

function showMapUnavailableNotice(message) {
  const mapEl = document.getElementById('map');
  mapEl.innerHTML = '';
  mapEl.classList.add('map-unavailable');

  const notice = document.createElement('div');
  notice.className = 'map-unavailable-notice';
  notice.id = 'map-unavailable-notice';

  const t = getTranslation();
  notice.innerHTML = `
        <p class="map-unavailable-icon">🗺️</p>
        <p class="map-unavailable-message">${message || t.mapConfigMessage}</p>
        <p class="map-unavailable-hint">${t.mapConfigHint}</p>
    `;

  mapEl.appendChild(notice);
}

function updateMapUnavailableNotice() {
  const notice = document.getElementById('map-unavailable-notice');
  if (!notice) {
    return;
  }

  const t = getTranslation();
  notice.querySelector('.map-unavailable-message').textContent =
    t.mapConfigMessage;
  notice.querySelector('.map-unavailable-hint').textContent = t.mapConfigHint;
}

async function initializeMap() {
  try {
    const response = await fetch('/api/map-style');
    const data = await response.json();

    if (!response.ok || data.configured === false) {
      showMapUnavailableNotice(data.message);
      return;
    }

    map = new maplibregl.Map({
      container: 'map',
      style: data,
      center: [78.9629, 22.5937],
      zoom: 5,
    });
    window.map = map;

    map.addControl(new maplibregl.NavigationControl());

    map.on('load', () => {
      setMapLanguage(currentLanguage);
      addVillageMarkers();
      loadCulturalItems();
      initRouting();
    });

    map.on('error', (event) => {
      console.error('Map error:', event.error);
    });
  } catch (error) {
    console.error('Error initializing map:', error);
    showMapUnavailableNotice(getTranslation().mapConfigMessage);
  }
}

function setMapLanguage(lang) {
  if (!map) {
    return;
  }

  const style = map.getStyle();

  if (!style || !style.layers) {
    console.warn('Style not loaded yet');
    return;
  }

  style.layers.forEach((layer) => {
    if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
      if (lang === 'hi') {
        map.setLayoutProperty(layer.id, 'text-field', [
          'coalesce',
          ['get', 'name:hi'],
          ['get', 'name'],
        ]);
      } else if (lang === 'mr') {
        map.setLayoutProperty(layer.id, 'text-field', [
          'coalesce',
          ['get', 'name:mr'],
          ['get', 'name:hi'],
          ['get', 'name'],
        ]);
      } else {
        map.setLayoutProperty(layer.id, 'text-field', ['get', 'name']);
      }
    }
  });
}

function addVillageMarker(village) {
  const el = document.createElement('div');

  el.className = 'marker';

  el.style.width = '20px';
  el.style.height = '20px';
  el.style.borderRadius = '50%';
  el.style.background = '#f4a261';
  el.style.border = '2px solid white';
  el.style.cursor = 'pointer';
  el.style.pointerEvents = 'auto';

  const popup = new maplibregl.Popup({
    closeButton: true,
    closeOnClick: true,
    offset: 25,
  }).setHTML(`
      <h3>${village.name[currentLanguage]}</h3>
      <div class="markdown-body">${renderMarkdown(village.description[currentLanguage])}</div>
  `);

  const marker = new maplibregl.Marker(el)
    .setLngLat([village.coordinates[1], village.coordinates[0]])
    .setPopup(popup)
    .addTo(map);

  marker.getElement().addEventListener('click', (e) => {
    e.stopPropagation();

    popup
      .setLngLat([village.coordinates[1], village.coordinates[0]])
      .addTo(map);

    showVillageInfo(village);
  });

  markers.push({
    id: village.id,
    marker,
    element: el,
  });
}

// Update marker colors based on scores
async function updateMarkerColors() {
  if (!map) return;
  const checkbox = document.getElementById('toggle-heritage-health');
  const showHealth = checkbox && checkbox.checked;

  // If not showing health view, reset to default colors
  if (!showHealth) {
    markers.forEach((m) => {
      m.element.style.background = '#f4a261';
    });
    return;
  }

  // Fetch scores for all villages
  const scorePromises = markers.map((m) =>
    fetch(`/api/heritage-score/village/${m.id}`)
      .then((res) => res.json())
      .catch(() => ({ score: 0, category: 'Endangered' }))
  );
  const results = await Promise.all(scorePromises);

  results.forEach((result, idx) => {
    const el = markers[idx].element;
    let color = '#ff4d4d'; // Endangered (red)
    if (result.category === 'Thriving') color = '#4caf50'; // green
    else if (result.category === 'Stable') color = '#2196f3'; // blue
    else if (result.category === 'Vulnerable') color = '#ff9800'; // orange
    el.style.background = color;
    // Optionally set tooltip
    el.title = `${result.category} (${result.score}/100)`;
  });
}

// Listen for toggle change
const heritageToggle = document.getElementById('toggle-heritage-health');
if (heritageToggle) {
  heritageToggle.addEventListener('change', updateMarkerColors);
}


function addVillageMarkers() {
  if (!map) return;

  markers.forEach((marker) => marker.remove());
  markers = [];

  sampleVillages.forEach((village) => {
    addVillageMarker(village);
  });
}

function showVillageInfo(village) {
  const t = getTranslation();

  const infoPanel = document.getElementById('village-info');

  const villageName = document.getElementById('village-name');

  const infoContent = document.getElementById('info-content');

  villageName.textContent = village.name[currentLanguage];

  infoContent.innerHTML = `
        <div class="markdown-body">
            <strong>${t.description}:</strong>
           
            ${renderMarkdown(village.description[currentLanguage])}
        </div>

        <div class="village-details">

            <div class="detail-item">
                <h4>🎭 ${t.traditions}</h4>
              ${village.traditions[currentLanguage].join(', ')}
            </div>

            <div class="detail-item">
                <h4>🎉 ${t.festivals}</h4>
                ${village.festivals[currentLanguage].join(', ')}
            </div>

            <div class="detail-item">
                <h4>🎨 ${t.crafts}</h4>
                ${village.crafts[currentLanguage].join(', ')}
            </div>

        </div>

        <div style="margin-top:1.5rem;">
            <a href="trails.html"
               class="btn btn-primary">
               ${t.planVisit}
            </a>
        </div>
    `;

  infoPanel.classList.add('active');
}

function playAmbientSound(type) {
  if (!ambientSoundEnabled) return;
  console.log(`Playing ambient sound: ${type}`);
}

function setupEventListeners() {
  const closeBtn = document.getElementById('close-info');
  const heatmapBtn = document.getElementById('toggle-heatmap');
  const soundBtn = document.getElementById('toggle-sound');

  if (!closeBtn || !heatmapBtn || !soundBtn) {
    console.error('❌ Missing DOM elements:', {
      closeBtn,
      heatmapBtn,
      soundBtn,
    });
    return;
  }

  closeBtn.addEventListener('click', () => {
    document.getElementById('village-info').classList.remove('active');
    if (currentSound) {
      currentSound.pause();
      currentSound = null;
    }
  });

  heatmapBtn.addEventListener('click', toggleHeatmap);
  soundBtn.addEventListener('click', toggleSound);
  // Ensure heritage health view updates when markers are re-added
  const heritageToggle = document.getElementById('toggle-heritage-health');
  if (heritageToggle) {
    heritageToggle.addEventListener('change', updateMarkerColors);
  }
}

function toggleHeatmap() {
  if (!map) {
    return;
  }

  const t = getTranslation();

  if (heatmapLayer) {
    heatmapMarkers.forEach((m) => m.remove());
    heatmapMarkers = [];
    heatmapLayer = null;
    document.getElementById('toggle-heatmap').textContent = t.toggleHeatmap;
  } else {
    heatmapLayer = true;

    sampleVillages.forEach((village) => {
      const intensity = Math.random() * 0.5 + 0.5;
      const size = Math.round(60 * intensity);

      const el = document.createElement('div');
      el.style.cssText = `
                width:${size}px; height:${size}px;
                border-radius:50%;
                background:rgba(244,162,97,${0.35 * intensity});
                border:1px solid rgba(244,162,97,0.6);
                pointer-events:none;
            `;

      const hm = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([village.coordinates[1], village.coordinates[0]])
        .addTo(map);

      heatmapMarkers.push(hm);
    });

    document.getElementById('toggle-heatmap').textContent = t.hideHeatmap;
  }
}

// function toggleSound() {
//   ambientSoundEnabled = !ambientSoundEnabled;
//   const t = getTranslation();

//   document.getElementById('toggle-sound').textContent = ambientSoundEnabled
//     ? t.soundOn
//     : t.soundOff;

//   if (!ambientSoundEnabled && currentSound) {
//     currentSound.pause();
//     currentSound = null;
//   }
// }

async function loadCulturalItems() {
  if (!map) {
    return;
  }

  try {
    const response = await fetch('/api/items');

    if (!response.ok) {
      throw new Error('Failed to load cultural items');
    }

    const items = await response.json();

    const features = items
      .filter((item) => item.coordinates && item.coordinates.length === 2)
      .map((item) => ({
        type: 'Feature',
        properties: {
          id: item.id,
          title: item.title,
          description: item.description || '',
          location: item.location || '',
          tags: item.tags ? item.tags.join(',') : '',
          type: item.type
        },
        geometry: {
          type: 'Point',
          coordinates: [item.coordinates[1], item.coordinates[0]], // [lng, lat]
        },
      }));

    const geojsonData = {
      type: 'FeatureCollection',
      features: features,
    };

    if (map.getSource('cultural-items')) {
      map.getSource('cultural-items').setData(geojsonData);
      return;
    }

    map.addSource('cultural-items', {
      type: 'geojson',
      data: geojsonData,
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50,
    });

    map.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'cultural-items',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          '#f4a261',
          10,
          '#e76f51',
          50,
          '#264653'
        ],
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          15,
          10,
          20,
          50,
          25
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff'
      },
    });

    map.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: 'cultural-items',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-size': 12,
      },
      paint: {
        'text-color': '#ffffff'
      }
    });

    map.addLayer({
      id: 'unclustered-point',
      type: 'circle',
      source: 'cultural-items',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': '#2a9d8f',
        'circle-radius': 8,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
      },
    });

    map.on('click', 'clusters', (e) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['clusters'],
      });
      const clusterId = features[0].properties.cluster_id;
      map.getSource('cultural-items').getClusterExpansionZoom(
        clusterId,
        (err, zoom) => {
          if (err) return;

          map.easeTo({
            center: features[0].geometry.coordinates,
            zoom: zoom,
          });
        }
      );
    });

    map.on('click', 'unclustered-point', (e) => {
      const coordinates = e.features[0].geometry.coordinates.slice();
      const props = e.features[0].properties;

      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }

      const item = {
        title: props.title,
        description: props.description,
        location: props.location,
        tags: props.tags ? props.tags.split(',') : []
      };
      
      map.flyTo({ center: coordinates, zoom: 15 });
      showPopup(item);
    });

    map.on('mouseenter', 'clusters', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'clusters', () => {
      map.getCanvas().style.cursor = '';
    });

    map.on('mouseenter', 'unclustered-point', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'unclustered-point', () => {
      map.getCanvas().style.cursor = '';
    });

  } catch (error) {
    console.error('Error loading cultural items:', error);
  }
}

function showPopup(item) {
  const t = getTranslation();
  const infoPanel = document.getElementById('village-info');
  const villageName = document.getElementById('village-name');
  const infoContent = document.getElementById('info-content');

  villageName.textContent = item.title;

  const tagsHtml =
    item.tags && item.tags.length > 0
      ? `<p><strong>${t.tags}:</strong> ${item.tags.join(', ')}</p>`
      : '';

  infoContent.innerHTML = `
        <div class="markdown-body"><strong>${t.description}:</strong><br> ${renderMarkdown(item.description || '')}</div>
        <p><strong>${t.location}:</strong> ${item.location || ''}</p>
        ${tagsHtml}
    `;

  infoPanel.classList.add('active');
}

// ── Re-render map and elements when language changes globally
window.addEventListener('parampara:langchange', (e) => {
  const newLang = e.detail.lang;
  if (currentLanguage === newLang) return;
  currentLanguage = newLang;

  const selector = document.getElementById('language-selector');
  if (selector) selector.value = currentLanguage;

  if (map && map.isStyleLoaded()) {
    setMapLanguage(currentLanguage);
  }

  if (map) {
    addVillageMarkers();
  }

  translatePage();
});

const ambientMusic = new Audio('assets/sounds/ambientSound.mp3');

ambientMusic.loop = true;
ambientMusic.volume = 0.3;

function soundToggler() {
  toggleSound = !toggleSound;
  if (toggleSound) {
    ambientMusic.pause();
    toggle_btn.textContent = 'Ambient Sound : ON';
  } else {
    ambientMusic.play();
    toggle_btn.textContent = 'Ambient Sound : OFF';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const toggle_btn = document.getElementById('toggle-sound');

  if (toggle_btn) {
    toggle_btn.addEventListener('click', () => {
      toggle_btn.textContent = '';
      soundToggler();
    });
  }
});


// --- Heritage Path Routing ---
let routeMarkers = [];

async function initRouting() {
  const urlParams = new URLSearchParams(window.location.search);
  const pathId = urlParams.get('pathId');
  if (!pathId) return;

  try {
    const pathsRes = await fetch('/api/paths');
    if (!pathsRes.ok) throw new Error('Failed to fetch paths');
    const paths = await pathsRes.json();
    const currentPath = paths.find(p => p.id === pathId);

    if (!currentPath || !currentPath.items || currentPath.items.length === 0) return;

    const itemsRes = await fetch('/api/items');
    if (!itemsRes.ok) throw new Error('Failed to fetch items');
    const items = await itemsRes.json();

    const pathItems = currentPath.items.map(id => items.find(i => i.id === id)).filter(i => i && i.coordinates);

    if (pathItems.length < 2) {
      console.warn('Not enough items with coordinates to draw a route.');
      return;
    }

    // Hide normal village markers
    markers.forEach(m => m.marker.remove());

    drawRoute(pathItems, currentPath);
    addClearRouteButton();
  } catch (error) {
    console.error('Routing error:', error);
  }
}

async function drawRoute(pathItems, pathInfo) {
  // 1. Plot specific markers for the path
  pathItems.forEach((item, index) => {
    const el = document.createElement('div');
    el.className = 'route-marker';
    el.innerHTML = `<div style="background: #e76f51; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${index + 1}</div>`;

    const popupHTML = `<h3>${item.title || item.name?.en || 'Location'}</h3><p>${item.location || ''}</p>`;
    const marker = new maplibregl.Marker(el)
      .setLngLat([item.coordinates[1], item.coordinates[0]])
      .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(popupHTML))
      .addTo(map);
      
    routeMarkers.push(marker);
  });

  // 2. Fetch Route from OSRM
  const coordinatesStr = pathItems.map(item => `${item.coordinates[1]},${item.coordinates[0]}`).join(';');
  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordinatesStr}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(osrmUrl);
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) return;

    const routeGeoJSON = data.routes[0].geometry;

    // 3. Draw Line on Map
    map.addSource('route', {
      'type': 'geojson',
      'data': {
        'type': 'Feature',
        'properties': {},
        'geometry': routeGeoJSON
      }
    });

    map.addLayer({
      'id': 'route-line',
      'type': 'line',
      'source': 'route',
      'layout': {
        'line-join': 'round',
        'line-cap': 'round'
      },
      'paint': {
        'line-color': '#e76f51',
        'line-width': 5,
        'line-opacity': 0.8
      }
    });

    // 4. Fit bounds
    const coordinates = routeGeoJSON.coordinates;
    const bounds = coordinates.reduce(function(bounds, coord) {
      return bounds.extend(coord);
    }, new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));

    map.fitBounds(bounds, {
      padding: 50
    });
  } catch (err) {
    console.error('Error drawing route:', err);
  }
}

function addClearRouteButton() {
  const controlsDiv = document.querySelector('.map-controls');
  if (controlsDiv) {
    const clearBtn = document.createElement('button');
    clearBtn.className = 'btn btn-secondary';
    clearBtn.style.marginLeft = '1rem';
    clearBtn.style.background = '#e76f51';
    clearBtn.style.color = 'white';
    clearBtn.textContent = '❌ Clear Route';
    clearBtn.onclick = () => {
      window.location.href = 'map.html'; // simplest way to reset the map state
    };
    controlsDiv.appendChild(clearBtn);
  }
}
