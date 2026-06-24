// Map Page JavaScript
let map;
let markers = [];
let heatmapLayer = null;
let ambientSoundEnabled = true;
let toggleSound = true;
let currentSound = null;
let heatmapMarkers = [];

let currentLanguage =
  localStorage.getItem('parampara_lang') ||
  localStorage.getItem('language') ||
  'en';

document.addEventListener('DOMContentLoaded', () => {
  const selector = document.getElementById('language-selector');

  if (selector) {
    selector.value = currentLanguage;

    selector.addEventListener('change', (e) => {
      currentLanguage = e.target.value;

      localStorage.setItem('parampara_lang', currentLanguage);
      localStorage.setItem('language', currentLanguage);

      if (map && map.isStyleLoaded()) {
        setMapLanguage(currentLanguage);
      }

      if (map) {
        addVillageMarkers();
      }

      translatePage();
    });
  }

  initializeMap();
  setupEventListeners();
  translatePage();
});

�गीते'],
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

  // Base style for marker
  el.style.width = '20px';
  el.style.height = '20px';
  el.style.borderRadius = '50%';
  el.style.border = '2px solid white';
  el.style.cursor = 'pointer';
  el.style.pointerEvents = 'auto';

  // Determine color based on heritage score (default if not loaded)
  const defaultColor = '#f4a261';
  el.style.background = defaultColor;

  const marker = new maplibregl.Marker(el)
    .setLngLat([village.coordinates[1], village.coordinates[0]])
    .addTo(map);

  // Attach click handler
  marker.getElement().addEventListener('click', (e) => {
    e.stopPropagation();
    showVillageInfo(village);
    // playAmbientSound(village.ambientSound);
  });

  // Store reference for later color updates
  markers.push({ id: village.id, marker, element: el });
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
  if (!map) {
    return;
  }

  // Remove existing markers
  markers.forEach((m) => m.remove());
  markers = [];

  sampleVillages.forEach((village) => addVillageMarker(village));
}

function showVillageInfo(village) {
  const t = getTranslation();

  const infoPanel = document.getElementById('village-info');

  const villageName = document.getElementById('village-name');

  const infoContent = document.getElementById('info-content');

  villageName.textContent = village.name[currentLanguage];

  infoContent.innerHTML = `
        <p>
            <strong>${t.description}:</strong>
           
            ${village.description[currentLanguage]}
        </p>

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

    items.forEach((item) => {
      if (item.coordinates && item.coordinates.length === 2) {
        const el = document.createElement('div');
        el.className = 'cultural-marker';

        new maplibregl.Marker(el)
          .setLngLat([item.coordinates[1], item.coordinates[0]])
          .addTo(map);

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
        <p><strong>${t.description}:</strong> ${item.description || ''}</p>
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

const ambientMusic = new Audio("assets/sounds/ambientSound.mp3");

ambientMusic.loop = true;
ambientMusic.volume = 0.3;

let toggle_btn = document.getElementById('toggle-sound');
function soundToggler() {
  toggleSound = !toggleSound;
  if(toggleSound){
    ambientMusic.pause()
    toggle_btn.textContent = "Ambient Sound : ON"
  }else{
    ambientMusic.play()
    toggle_btn.textContent = "Ambient Sound : OFF"
  }
}

toggle_btn.addEventListener("click", () => {
  toggle_btn.textContent = ""
  soundToggler()
});