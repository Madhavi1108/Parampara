// Heritage Paths Page JavaScript

let allPaths = [];
let allItems = [];
let currentPath = null;
let currentStepIndex = 0;

// ── Translation helper
function tPath(key) {
  if (typeof PARAMPARA_TRANSLATIONS === 'undefined') return key;
  const lang =
    localStorage.getItem('parampara_lang') ||
    localStorage.getItem('language') ||
    'en';
  const dict = PARAMPARA_TRANSLATIONS[lang] || PARAMPARA_TRANSLATIONS['en'];
  return (dict && dict[key]) || PARAMPARA_TRANSLATIONS['en'][key] || key;
}

// ── Re-render cards when language changes
window.addEventListener('parampara:langchange', () => {
  displayPaths();
  const modal = document.getElementById('path-player-modal');
  if (modal && modal.classList.contains('active') && currentPath) {
    document.getElementById('path-player-title').textContent =
      pathTitle(currentPath);
    displayPathStep();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  loadPaths();
  loadItems();
  setupEventListeners();
  setupBackToTop();
});

function setupBackToTop() {
  const btn = document.getElementById('backToTopBtn');
  if (!btn) return; // safe — not present on this page
  window.addEventListener('scroll', () => {
    btn.classList.toggle('show', window.scrollY > 300);
  });
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function setupEventListeners() {
  document.getElementById('create-path-btn').addEventListener('click', () => {
    document.getElementById('create-path-modal').classList.add('active');
  });

  document
    .getElementById('close-create-modal')
    .addEventListener('click', () => {
      document.getElementById('create-path-modal').classList.remove('active');
    });

  document
    .getElementById('create-path-form')
    .addEventListener('submit', handleCreatePath);

  document.getElementById('close-player').addEventListener('click', () => {
    document.getElementById('path-player-modal').classList.remove('active');
    currentPath = null;
    currentStepIndex = 0;
  });

  document.getElementById('prev-step').addEventListener('click', () => {
    if (currentStepIndex > 0) {
      currentStepIndex--;
      displayPathStep();
    }
  });

  document.getElementById('next-step').addEventListener('click', () => {
    if (
      currentPath &&
      currentStepIndex < (currentPath.items || []).length - 1
    ) {
      currentStepIndex++;
      displayPathStep();
    }
  });

  const applyFiltersBtn = document.getElementById('apply-filters-btn');
  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', () => {
      loadPaths();
      document.getElementById('clear-filters-btn').style.display = 'inline-block';
    });
  }

  const clearFiltersBtn = document.getElementById('clear-filters-btn');
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
      document.getElementById('theme-filter').value = '';
      document.getElementById('sort-filter').value = '';
      loadPaths();
      clearFiltersBtn.style.display = 'none';
    });
  }
}

// ── Sample paths — keys only, NO hardcoded English
function getSamplePaths() {
  return [
    {
      id: 'path-sample-1',
      titleKey: 'path_sample1_title',
      themeKey: 'path_sample1_theme',
      descKey: 'path_sample1_desc',
      items: ['sample-item-1', 'sample-item-2', 'sample-item-3'],
    },
    {
      id: 'path-sample-2',
      titleKey: 'path_sample2_title',
      themeKey: 'path_sample2_theme',
      descKey: 'path_sample2_desc',
      items: ['sample-item-4', 'sample-item-5'],
    },
  ];
}

// ── Sample gallery items so the player has something to show
function getSampleItems() {
  return [
    {
      id: 'sample-item-1',
      title: 'Kantha Running Stitch',
      type: 'visual',
      location: 'Murshidabad, Bengal',
      description:
        'The basic running stitch used in Kantha embroidery, layering old saris to create warmth and beauty.',
      imageUrl: '',
      audioUrl: '',
    },
    {
      id: 'sample-item-2',
      title: 'Nakshi Kantha Motifs',
      type: 'visual',
      location: 'Rajshahi, Bengal',
      description:
        'Intricate motifs depicting fish, lotus flowers, and village life stitched in bright threads.',
      imageUrl: '',
      audioUrl: '',
    },
    {
      id: 'sample-item-3',
      title: "Elder's Story: Origins of Kantha",
      type: 'audio',
      location: 'Birbhum, Bengal',
      description:
        'A village elder recounts how Kantha began as a way to recycle worn saris into quilts for newborns.',
      imageUrl: '',
      audioUrl: '',
    },
    {
      id: 'sample-item-4',
      title: 'Madhubani Fish Motif',
      type: 'visual',
      location: 'Madhubani, Bihar',
      description:
        'Fish are considered auspicious in Mithila culture and appear in almost every Madhubani painting.',
      imageUrl: '',
      audioUrl: '',
    },
    {
      id: 'sample-item-5',
      title: 'Kohbar Room Paintings',
      type: 'visual',
      location: 'Darbhanga, Bihar',
      description:
        'Traditional paintings done on the walls of the bridal chamber, depicting bamboo groves and lotus ponds.',
      imageUrl: '',
      audioUrl: '',
    },
  ];
}

// ── Helpers: resolve display text from API path or sample path ────────────────
function pathTitle(path) {
  return path.titleKey ? tPath(path.titleKey) : path.title || '';
}
function pathTheme(path) {
  return path.themeKey ? tPath(path.themeKey) : path.theme || '';
}
function pathDesc(path) {
  return path.descKey ? tPath(path.descKey) : path.description || '';
}

async function loadPaths() {
  try {
    const themeFilter = document.getElementById('theme-filter')?.value.trim() || '';
    const sortFilter = document.getElementById('sort-filter')?.value || '';
    
    let url = '/api/paths?';
    if (themeFilter) url += `theme=${encodeURIComponent(themeFilter)}&`;
    if (sortFilter) {
      const [sortBy, order] = sortFilter.split('_');
      url += `sortBy=${sortBy}&order=${order}&`;
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error('API error');
    const data = await response.json();
    allPaths = data.map((p) => ({ ...p, items: p.items || [] }));
    displayPaths();
  } catch (error) {
    console.error('Error loading paths, using samples:', error);
    allPaths = getSamplePaths();
    displayPaths();
  }
}

async function loadItems() {
  try {
    const response = await fetch('/api/items');
    if (!response.ok) throw new Error('API error');
    allItems = await response.json();
  } catch (error) {
    console.error('Error loading items, using samples:', error);
    allItems = getSampleItems();
  }
  populateItemsSelector();
}

function displayPaths() {
  const pathsList = document.getElementById('paths-list');

  if (!allPaths || allPaths.length === 0) {
    pathsList.innerHTML = `
            <div style="text-align:center;padding:3rem;color:var(--text-muted);">
                <p style="font-size:1.2rem;margin-bottom:1rem;">${tPath('paths_empty_title')}</p>
                <p>${tPath('paths_empty_desc')}</p>
            </div>`;
    return;
  }

  pathsList.innerHTML = allPaths
    .map((path) => {
      const items = path.items || [];
      return `
        <div class="path-card" onclick="playPath('${path.id}')">
            <div class="path-card-header">
                <div>
                    <h3>${escapeHtml(pathTitle(path))}</h3>
                    <span class="path-card-theme">${escapeHtml(pathTheme(path))}</span>
                </div>
            </div>
            <p>${escapeHtml(pathDesc(path))}</p>
            <div class="path-card-stats" style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <span>📚 ${items.length} ${tPath('paths_items_label')}</span>
                    <span>⏱️ ~${Math.ceil(items.length * 3)} ${tPath('paths_min_label')}</span>
                </div>
                <button class="btn btn-primary" onclick="event.stopPropagation(); window.location.href='map.html?pathId=${path.id}';" style="padding: 0.25rem 0.75rem; font-size: 0.9rem;">
                    🗺️ View Route
                </button>
            </div>
        </div>`;
    })
    .join('');
}

function populateItemsSelector() {
  const itemsSelector = document.getElementById('available-items');
  if (!allItems || allItems.length === 0) {
    itemsSelector.innerHTML = `<p style="color:var(--text-muted);">${tPath('paths_no_items')}</p>`;
    return;
  }
  itemsSelector.innerHTML = allItems
    .map(
      (item) => `
        <div class="item-checkbox">
            <input type="checkbox" name="path-items" value="${item.id}" id="item-${item.id}">
            <label for="item-${item.id}">${escapeHtml(item.title)} — ${escapeHtml(item.location)}</label>
        </div>
    `
    )
    .join('');
}

async function handleCreatePath(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const selectedItems = Array.from(
    document.querySelectorAll('input[name="path-items"]:checked')
  ).map((cb) => cb.value);

  if (selectedItems.length === 0) {
    alert(tPath('paths_select_items_alert'));
    return;
  }

  const data = {
    title: formData.get('title'),
    theme: formData.get('theme'),
    description: formData.get('description'),
    items: selectedItems,
  };

  try {
    const response = await fetch('/api/paths', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (response.ok) {
      const newPath = await response.json();
      newPath.items = newPath.items || [];
      allPaths.push(newPath);
      displayPaths();
      e.target.reset();
      document.getElementById('create-path-modal').classList.remove('active');
      alert(tPath('paths_created_success'));
    } else {
      alert(tPath('paths_created_error'));
    }
  } catch (error) {
    console.error('Error creating path:', error);
    alert(tPath('paths_created_error'));
  }
}

function playPath(pathId) {
  currentPath = allPaths.find((p) => p.id === pathId);
  if (!currentPath) return;
  currentPath.items = currentPath.items || [];
  currentStepIndex = 0;
  document.getElementById('path-player-title').textContent =
    pathTitle(currentPath);
  document.getElementById('path-player-modal').classList.add('active');
  displayPathStep();
}

function displayPathStep() {
  const items = currentPath ? currentPath.items || [] : [];

  if (!currentPath || items.length === 0) {
    document.getElementById('path-content').innerHTML =
      `<p style="text-align:center;padding:2rem;color:var(--text-muted);">${tPath('paths_no_steps')}</p>`;
    document.getElementById('path-progress-text').textContent =
      `${tPath('path_step_label')} 0 ${tPath('path_step_of_label')} 0`;
    document.getElementById('prev-step').disabled = true;
    document.getElementById('next-step').disabled = true;
    return;
  }

  const stepItemId = items[currentStepIndex];
  const stepItem = allItems.find((item) => item.id === stepItemId);

  if (!stepItem) {
    document.getElementById('path-content').innerHTML =
      `<p>${tPath('paths_item_not_found')}</p>`;
    return;
  }

  const progress = ((currentStepIndex + 1) / items.length) * 100;
  document.getElementById('path-progress-fill').style.width = `${progress}%`;
  document.getElementById('path-progress-text').textContent =
    `${tPath('path_step_label')} ${currentStepIndex + 1} ${tPath('path_step_of_label')} ${items.length}`;

  const audioHTML = stepItem.audioUrl
    ? `
        <div class="path-step-audio">
            <audio controls class="audio-player">
                <source src="${stepItem.audioUrl}" type="audio/mpeg">
                ${tPath('paths_audio_unsupported')}
            </audio>
        </div>`
    : '';

  document.getElementById('path-content').innerHTML = `
        <div class="path-step">
            ${
              stepItem.imageUrl
                ? `<img src="${stepItem.imageUrl}" alt="${escapeHtml(stepItem.title)}" class="path-step-image lazy-img" loading="lazy" onload="this.classList.add('loaded')">`
                : `<div style="text-align:center;font-size:4rem;padding:2rem;">🖼️</div>`
            }
            <h4>${escapeHtml(stepItem.title)}</h4>
            <p><strong>${tPath('paths_location_label')}:</strong> ${escapeHtml(stepItem.location)}</p>
            <div class="markdown-body">${renderMarkdown(stepItem.description)}</div>
            ${audioHTML}
        </div>`;

  document.getElementById('prev-step').disabled = currentStepIndex === 0;
  document.getElementById('next-step').disabled =
    currentStepIndex === items.length - 1;

  const audioPlayer = document.querySelector('#path-content .audio-player');
  if (audioPlayer && typeof window.setupAudioVisualizer === 'function') {
    window.setupAudioVisualizer(audioPlayer);
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

window.playPath = playPath;
