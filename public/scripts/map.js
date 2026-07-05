// Map Page JavaScript

let map;
let markers = [];
let heatmapLayer = null;
let ambientSoundEnabled = true;
let currentSound = null;
let heatmapMarkers = [];
let draw = null;
let culturalMarkers = []; // Track cultural item markers to allow clearing
let currentLanguage = localStorage.getItem('language') || 'en';

// Flyover state
let flyoverActive = false;
let flyoverPaused = false;
let flyoverCoordinates = [];
let flyoverIndex = 0;
let flyoverTimeout = null;

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

  window.mapTimeMachine = new TimeMachineEngine({
    containerId: 'map-time-machine-container',
    eras: ['All', '1950', '1980', '2000', '2025']
  });

  window.mapActiveEra = 'All';

  window.addEventListener('parampara:timemachine:change', (e) => {
    const selectedEra = window.mapTimeMachine.getCurrentEra();
    if (window.mapActiveEra !== selectedEra) {
      window.mapActiveEra = selectedEra;
      // Re-load cultural items based on the new era
      loadCulturalItems();
    }
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
    const response = await fetch('/api/map-style?t=' + Date.now());
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

    map.on('load', async () => {
      setMapLanguage(currentLanguage);
      addVillageMarkers();
      
      // Update clusters and items on zoom and move
      map.on('zoomend', () => {
          addVillageMarkers();
          loadCulturalItems();
      });
      map.on('moveend', () => {
          addVillageMarkers();
          loadCulturalItems();
      });
      
      await loadCulturalItems();
      checkFlyover();
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

  const marker = new maplibregl.Marker({ element: el })
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


function addVillageMarkers(filteredVillages = sampleVillages) {
  if (!map) return;

  markers.forEach((m) => {
    if (m.marker) m.marker.remove();
    else m.remove();
  });
  markers = [];

  if (!window.clusterEngine) {
    window.clusterEngine = new window.ClusterEngine({ radius: 50 });
  }

  window.clusterEngine.load(filteredVillages);
  
  const bounds = map.getBounds();
  const zoom = map.getZoom();
  
  const clusters = window.clusterEngine.getClusters(bounds, zoom);
  
  clusters.forEach((cluster) => {
    if (cluster.isCluster) {
      addClusterMarker(cluster);
    } else {
      addVillageMarker(cluster.data);
    }
  });
}

function addClusterMarker(cluster) {
  const el = document.createElement('div');
  el.className = 'cluster-marker';
  el.style.width = '35px';
  el.style.height = '35px';
  el.style.borderRadius = '50%';
  el.style.background = '#e76f51';
  el.style.color = 'white';
  el.style.display = 'flex';
  el.style.alignItems = 'center';
  el.style.justifyContent = 'center';
  el.style.fontWeight = 'bold';
  el.style.cursor = 'pointer';
  el.style.border = '2px solid white';
  el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
  el.innerText = cluster.count;
  el.style.pointerEvents = 'auto';
  
  const marker = new maplibregl.Marker({ element: el })
    .setLngLat([cluster.coordinates[1], cluster.coordinates[0]])
    .addTo(map);
    
  marker.getElement().addEventListener('click', (e) => {
    e.stopPropagation();
    map.fitBounds([
      [cluster.bounds.minLng, cluster.bounds.minLat],
      [cluster.bounds.maxLng, cluster.bounds.maxLat]
    ], { padding: 50 });
  });
  
  markers.push({
    isCluster: true,
    marker,
    element: el
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

  // Toggle heatmap functionality... (existing code below)
  setupSpatialSearch();
}

function setupSpatialSearch() {
  const findNearbyBtn = document.getElementById('btn-find-nearby');
  const radiusSelect = document.getElementById('radius-select');
  
  if (!findNearbyBtn || !radiusSelect) return;
  
  findNearbyBtn.addEventListener('click', async () => {
    try {
      const originalText = findNearbyBtn.innerHTML;
      findNearbyBtn.innerHTML = '<i class="ti ti-loader ti-spin"></i> Locating...';
      findNearbyBtn.disabled = true;
      
      const position = await window.SpatialUtils.getUserLocation();
      const userLat = position.coords.latitude;
      const userLon = position.coords.longitude;
      const radiusKm = parseFloat(radiusSelect.value);
      
      // Filter villages based on distance
      const nearbyVillages = sampleVillages.filter(village => {
        const [villageLat, villageLon] = village.coordinates;
        const distance = window.SpatialUtils.calculateHaversineDistance(userLat, userLon, villageLat, villageLon);
        return distance <= radiusKm;
      });
      
      // Update markers
      addVillageMarkers(nearbyVillages);
      
      // Fly to user location
      if (map) {
        map.flyTo({
          center: [userLon, userLat],
          zoom: radiusKm <= 10 ? 11 : 9,
          essential: true
        });
      }
      
      findNearbyBtn.innerHTML = '<i class="ti ti-check"></i> Found ' + nearbyVillages.length;
      setTimeout(() => {
        findNearbyBtn.innerHTML = originalText;
        findNearbyBtn.disabled = false;
      }, 3000);
      
    } catch (error) {
      console.error('Location error:', error);
      alert('Could not determine your location. Please check browser permissions.');
      findNearbyBtn.innerHTML = '<i class="ti ti-map-pin"></i> Find Nearby';
      findNearbyBtn.disabled = false;
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
    // Clear existing cultural markers
    culturalMarkers.forEach(m => m.remove());
    culturalMarkers = [];

    let url = '/api/items?limit=1000';
    if (window.mapActiveEra && window.mapActiveEra !== 'All') {
      url += `&year=${window.mapActiveEra}`;
    }

    // Attach bounding box query parameters for optimized spatial search
    const bounds = map.getBounds();
    if (bounds) {
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      url += `&bounds=${sw.lng},${sw.lat},${ne.lng},${ne.lat}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to load cultural items');
    }

    const result = await response.json();
    const items = result.data || result; // handle paginated or flat array

    items.forEach((item) => {
      if (item.coordinates && item.coordinates.length === 2) {
        const el = document.createElement('div');
        el.className = 'cultural-marker';

        const marker = new maplibregl.Marker({
          element: el,
        })
          .setLngLat([item.coordinates[1], item.coordinates[0]])
          .addTo(map);

        culturalMarkers.push(marker);

        el.addEventListener('click', () => {
          showPopup(item);
        });
      }
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

// ── Cinematic Flyover Logic ──────────────────────────────────────────────────
async function checkFlyover() {
  const params = new URLSearchParams(window.location.search);
  const flyoverId = params.get('flyover');
  if (!flyoverId) return;

  try {
    const response = await fetch('/api/paths');
    const paths = await response.json();
    const targetPath = paths.find(p => p.id === flyoverId);

    if (!targetPath || !targetPath.items || targetPath.items.length === 0) {
      console.warn('Flyover path not found or empty');
      return;
    }

    const itemsRes = await fetch('/api/items?limit=1000');
    const itemsData = await itemsRes.json();
    const allItems = itemsData.data || itemsData; // Support paginated response if backend uses it

    flyoverCoordinates = targetPath.items.map(itemId => {
      const item = allItems.find(i => i.id === itemId);
      return item && item.coordinates && item.coordinates.length === 2 ? [item.coordinates[1], item.coordinates[0]] : null;
    }).filter(c => c !== null);

    if (flyoverCoordinates.length < 2) {
      console.warn('Not enough coordinates for flyover');
      return;
    }

    startFlyover();
  } catch (err) {
    console.error('Error starting flyover:', err);
  }
}

function startFlyover() {
  flyoverActive = true;
  flyoverPaused = false;
  flyoverIndex = 0;

  // Add route layer
  if (!map.getSource('flyover-route')) {
    map.addSource('flyover-route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: flyoverCoordinates
        }
      }
    });

    map.addLayer({
      id: 'flyover-route-line',
      type: 'line',
      source: 'flyover-route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#e53e3e',
        'line-width': 4,
        'line-dasharray': [2, 4]
      }
    });
  }

  // Show UI
  const controls = document.getElementById('flyover-controls');
  if (controls) controls.style.display = 'flex';
  
  const pauseBtn = document.getElementById('btn-flyover-pause');
  const stopBtn = document.getElementById('btn-flyover-stop');
  if (pauseBtn) {
    pauseBtn.textContent = 'Pause';
    pauseBtn.addEventListener('click', toggleFlyoverPause);
  }
  if (stopBtn) stopBtn.addEventListener('click', stopFlyover);

  flyToNextPoint();
}

function toggleFlyoverPause() {
  flyoverPaused = !flyoverPaused;
  const btn = document.getElementById('btn-flyover-pause');
  if (flyoverPaused) {
    if (btn) btn.textContent = 'Resume';
    map.stop(); // Stop camera animation
    if (flyoverTimeout) clearTimeout(flyoverTimeout);
  } else {
    if (btn) btn.textContent = 'Pause';
    flyToNextPoint();
  }
}

function stopFlyover() {
  flyoverActive = false;
  if (flyoverTimeout) clearTimeout(flyoverTimeout);
  map.stop();
  map.easeTo({ pitch: 0, bearing: 0 });
  
  if (map.getLayer('flyover-route-line')) map.removeLayer('flyover-route-line');
  if (map.getSource('flyover-route')) map.removeSource('flyover-route');
  
  const controls = document.getElementById('flyover-controls');
  if (controls) controls.style.display = 'none';
  
  // Remove pause/stop event listeners to avoid duplicates if run again
  const pauseBtn = document.getElementById('btn-flyover-pause');
  const stopBtn = document.getElementById('btn-flyover-stop');
  if (pauseBtn) pauseBtn.removeEventListener('click', toggleFlyoverPause);
  if (stopBtn) stopBtn.removeEventListener('click', stopFlyover);
  
  // Remove flyover param from URL
  const url = new URL(window.location);
  url.searchParams.delete('flyover');
  window.history.replaceState({}, '', url);
}

function flyToNextPoint() {
  if (!flyoverActive || flyoverPaused) return;

  if (flyoverIndex >= flyoverCoordinates.length) {
    // End of route
    stopFlyover();
    return;
  }

  const target = flyoverCoordinates[flyoverIndex];
  
  // Calculate bearing to next point for cinematic effect
  let bearing = 0;
  if (flyoverIndex < flyoverCoordinates.length - 1) {
    const next = flyoverCoordinates[flyoverIndex + 1];
    bearing = calculateBearing(target[1], target[0], next[1], next[0]);
  } else if (flyoverIndex > 0) {
    const prev = flyoverCoordinates[flyoverIndex - 1];
    bearing = calculateBearing(prev[1], prev[0], target[1], target[0]);
  }

  map.flyTo({
    center: target,
    zoom: 9,
    pitch: 60,
    bearing: bearing,
    speed: 0.3, // slow cinematic speed
    curve: 1,
    essential: true
  });

  // When move ends, wait a bit and go to next
  map.once('moveend', () => {
    if (!flyoverActive || flyoverPaused) return;
    
    // Increment index and schedule next flight
    flyoverIndex++;
    flyoverTimeout = setTimeout(() => {
      flyToNextPoint();
    }, 3000); // 3 second pause at each point to let user look around
  });
}

function calculateBearing(startLat, startLng, destLat, destLng) {
  startLat = startLat * Math.PI / 180;
  startLng = startLng * Math.PI / 180;
  destLat = destLat * Math.PI / 180;
  destLng = destLng * Math.PI / 180;

  const y = Math.sin(destLng - startLng) * Math.cos(destLat);
  const x = Math.cos(startLat) * Math.sin(destLat) -
            Math.sin(startLat) * Math.cos(destLat) * Math.cos(destLng - startLng);
  
  let brng = Math.atan2(y, x);
  brng = brng * 180 / Math.PI;
  return (brng + 360) % 360;
}
// --- Heritage Path Routing ---
function initRouting() {
  if (typeof MapboxDraw !== 'undefined') {
    draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        line_string: true,
        polygon: true,
        point: true,
        trash: true,
        combine_features: true,
        uncombine_features: true
      },
      styles: [
        {
          "id": "gl-draw-line",
          "type": "line",
          "filter": ["all", ["==", "$type", "LineString"], ["!=", "mode", "static"]],
          "layout": { "line-cap": "round", "line-join": "round" },
          "paint": { "line-color": "#f4a261", "line-width": 4, "line-dasharray": [0.2, 2] }
        },
        {
          "id": "gl-draw-polygon-fill",
          "type": "fill",
          "filter": ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
          "paint": { "fill-color": "#e76f51", "fill-outline-color": "#e76f51", "fill-opacity": 0.3 }
        },
        {
          "id": "gl-draw-polygon-stroke-active",
          "type": "line",
          "filter": ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
          "layout": { "line-cap": "round", "line-join": "round" },
          "paint": { "line-color": "#f4a261", "line-width": 2 }
        },
        {
          "id": "gl-draw-point-active",
          "type": "circle",
          "filter": ["all", ["==", "$type", "Point"], ["!=", "mode", "static"]],
          "paint": { "circle-radius": 6, "circle-color": "#e76f51" }
        }
      ]
    });
    map.addControl(draw, 'top-left');

    map.on('draw.create', updateRouteMetrics);
    map.on('draw.delete', updateRouteMetrics);
    map.on('draw.update', updateRouteMetrics);

    const savedRoute = localStorage.getItem('parampara_custom_routes');
    if (savedRoute) {
        try {
            draw.add(JSON.parse(savedRoute));
            updateRouteMetrics();
        } catch (e) {
            console.error("Failed to load saved routes", e);
        }
    }

    setupCustomRouteControls();
  } else {
    console.warn("MapboxDraw is not loaded.");
  }
}

function setupCustomRouteControls() {
  const btnExport = document.getElementById('btn-export-route');
  const btnImport = document.getElementById('btn-import-route');
  const importInput = document.getElementById('import-route-input');

  if (btnExport) {
    btnExport.addEventListener('click', () => {
      if (!draw) return;
      const data = draw.getAll();
      if (data.features.length > 0) {
        const json = JSON.stringify(data);
        const blob = new Blob([json], { type: "application/geo+json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "custom_heritage_route.geojson";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        alert("No routes to export. Please draw a route first.");
      }
    });
  }

  if (btnImport) {
    btnImport.addEventListener('click', () => {
      importInput.click();
    });
  }

  if (importInput) {
    importInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const geojson = JSON.parse(event.target.result);
          
          if (geojson.type === 'FeatureCollection' || geojson.type === 'Feature') {
             draw.add(geojson);
             
             if (geojson.features && geojson.features.length > 0) {
                 const coordinates = [];
                 geojson.features.forEach(f => {
                     if(f.geometry && f.geometry.coordinates) {
                         if(f.geometry.type === 'Point') {
                             coordinates.push(f.geometry.coordinates);
                         } else if (f.geometry.type === 'LineString') {
                             coordinates.push(...f.geometry.coordinates);
                         } else if (f.geometry.type === 'Polygon') {
                             coordinates.push(...f.geometry.coordinates[0]);
                         }
                     }
                 });

                 if(coordinates.length > 0) {
                     const bounds = coordinates.reduce(function(b, coord) {
                         return b.extend(coord);
                     }, new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));
                     
                     map.fitBounds(bounds, { padding: 50 });
                 }
             }
             alert("Route imported successfully!");
          } else {
            alert("Invalid GeoJSON format.");
          }
        } catch (err) {
          console.error("Error parsing GeoJSON:", err);
          alert("Error parsing the file. Make sure it's a valid GeoJSON file.");
        }
        importInput.value = '';
      };
      reader.readAsText(file);
    });
  }
}

function updateRouteMetrics() {
  if (!draw) return;
  const data = draw.getAll();
  
  localStorage.setItem('parampara_custom_routes', JSON.stringify(data));
  
  const dashboard = document.getElementById('custom-route-dashboard');
  if (!dashboard) return;

  if (data.features.length === 0) {
    dashboard.style.display = 'none';
    return;
  }
  
  dashboard.style.display = 'block';
  
  let totalDistance = 0;
  let waypoints = 0;
  
  if (typeof turf !== 'undefined') {
    data.features.forEach(feature => {
      if (feature.geometry.type === 'LineString') {
         totalDistance += turf.length(feature, {units: 'kilometers'});
         waypoints += feature.geometry.coordinates.length;
      } else if (feature.geometry.type === 'Point') {
         waypoints += 1;
      }
    });
  }
  
  const distanceStr = totalDistance.toFixed(2) + ' km';
  const timeHours = totalDistance / 5;
  const timeMins = Math.round(timeHours * 60);
  
  document.getElementById('route-distance').textContent = distanceStr;
  document.getElementById('route-time').textContent = timeMins + ' mins';
  document.getElementById('route-waypoints').textContent = waypoints;
}

