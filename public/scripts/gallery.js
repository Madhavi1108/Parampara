// Gallery Page JavaScript

let allItems = [];

// SVG hearts (inline, no font dependency)
const HEART_FILLED = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#e53e3e" stroke="#e53e3e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>';
const HEART_EMPTY  = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>';

document.addEventListener('DOMContentLoaded', () => {
  loadGalleryItems();
  setupEventListeners();
  setupFavDelegation();  // ← single listener handles ALL heart clicks
  setupShareDelegation();
});

// ── Event delegation: one listener on the grid catches every heart-button click
function setupFavDelegation() {
  const grid = document.getElementById('gallery-grid');
  grid.addEventListener('click', function(e) {
    // Walk up from the clicked element to find a .favorite-btn
    const btn = e.target.closest('.favorite-btn');
    if (!btn) return;          // not a heart button click
    e.stopPropagation();       // don't open the item card

    const itemId = btn.dataset.itemId;
    if (!itemId) return;

    const fm = window.FavoritesManager;
    if (!fm) { console.warn('FavoritesManager not loaded'); return; }

    fm.toggleFavorite(itemId);
    const isFav = fm.isFavorite(itemId);

    // Update button visually in-place (no re-render needed)
    btn.innerHTML = isFav ? HEART_FILLED : HEART_EMPTY;
    btn.classList.toggle('favorited', isFav);
    btn.title = isFav ? 'Remove from favorites' : 'Add to favorites';

    console.log('[Parampara] Favorite toggled:', itemId, '→', isFav ? 'ADDED' : 'REMOVED');
  });
}

function setupShareDelegation() {
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;
  grid.addEventListener('click', function(e) {
    const btn = e.target.closest('.share-card-btn');
    if (!btn) return;
    e.stopPropagation(); // prevent opening item card

    const itemId = btn.dataset.itemId;
    if (!itemId) return;

    const item = allItems.find(i => i.id === itemId);
    if (!item) return;

    if (window.ShareManager) {
      window.ShareManager.share({
        title: item.title,
        text: item.description,
        url: window.location.origin + window.location.pathname + '?item=' + encodeURIComponent(item.id)
      });
    } else {
      console.warn('ShareManager not loaded');
    }
  });
}

function setupEventListeners() {
  document.getElementById('add-item-btn').addEventListener('click', () => {
    document.getElementById('add-item-modal').classList.add('active');
  });

  document.getElementById('close-modal').addEventListener('click', () => {
    document.getElementById('add-item-modal').classList.remove('active');
  });

  document
    .getElementById('add-item-form')
    .addEventListener('submit', handleAddItem);

  const debouncedFilterItems = debounce(filterItems, 300);

  document
    .getElementById('search-input')
    .addEventListener('input', debouncedFilterItems);
  document
    .getElementById('type-filter')
    .addEventListener('change', filterItems);
}

async function loadGalleryItems() {
  try {
    const response = await fetch('/api/items');
    allItems = await response.json();
    displayItems(allItems);
  } catch (error) {
    console.error('Error loading items:', error);
    allItems = getSampleItems();
    displayItems(allItems);
  }
}

// ── Translation helper
function tGallery(key) {
  if (typeof PARAMPARA_TRANSLATIONS === 'undefined') return key;
  const lang =
    localStorage.getItem('parampara_lang') ||
    localStorage.getItem('language') ||
    'en';
  const dict = PARAMPARA_TRANSLATIONS[lang] || PARAMPARA_TRANSLATIONS['en'];
  return (dict && dict[key]) || PARAMPARA_TRANSLATIONS['en'][key] || key;
}

function translateType(type) {
  const keyMap = {
    visual: 'modal_type_visual',
    audio: 'modal_type_audio',
    story: 'modal_type_story',
  };
  return tGallery(keyMap[type] || type);
}

function getEmptyStateHtml() {
  return `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-muted);">
            <p style="font-size: 1.2rem; margin-bottom: 1rem;">${tGallery('gallery_empty_title')}</p>
            <p>${tGallery('gallery_empty_desc')}</p>
        </div>
    `;
}

// Re-render on language change
window.addEventListener('parampara:langchange', () => {
  displayItems(getCurrentFilteredItems());
});

function displayItems(items) {
  const galleryGrid = document.getElementById('gallery-grid');

  if (!items || items.length === 0) {
    galleryGrid.innerHTML = getEmptyStateHtml();
    return;
  }

  galleryGrid.innerHTML = items
    .map((item) => {
      const isFav = !!(window.FavoritesManager && window.FavoritesManager.isFavorite(item.id));
      const heartSvg = isFav ? HEART_FILLED : HEART_EMPTY;

      return `
        <div class="gallery-item" data-item-id="${escapeHtml(item.id)}">
            <div class="gallery-item-image" style="position:relative;">
                ${
                  item.imageUrl
                    ? `<img src="${item.imageUrl}" alt="${escapeHtml(item.title)}" loading="lazy" class="lazy-img" onload="this.classList.add('loaded')" style="width:100%;height:100%;object-fit:cover;">`
                    : `<span>${getTypeIcon(item.type)}</span>`
                }
                <button
                  class="share-card-btn"
                  data-item-id="${escapeHtml(item.id)}"
                  aria-label="Share this item"
                  title="Share this item"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>
                </button>
                <button
                  class="favorite-btn${isFav ? ' favorited' : ''}"
                  data-item-id="${escapeHtml(item.id)}"
                  aria-label="${isFav ? 'Remove from favorites' : 'Add to favorites'}"
                  title="${isFav ? 'Remove from favorites' : 'Add to favorites'}"
                >
                    ${heartSvg}
                </button>
            </div>
            <div class="gallery-item-content" onclick="viewItem('${escapeHtml(item.id)}'); event.stopPropagation();" style="cursor:pointer;">
                <span class="gallery-item-type">${translateType(item.type)}</span>
                <div class="gallery-item-location">
                    <span class="gallery-item-location-marker">📍</span> <strong>${escapeHtml(item.location)}</strong>
                </div>
                <h3>${escapeHtml(item.title)}</h3>
                <div class="markdown-body" style="font-size:0.9rem; margin-bottom:1rem;">${renderMarkdown(item.description.substring(0, 100) + (item.description.length > 100 ? '...' : ''), true)}</div>
                ${
                  item.tags && item.tags.length > 0
                    ? `
                    <div class="gallery-item-tags">
                        ${item.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
                    </div>
                `
                    : ''
                }
            </div>
        </div>
    `;
    })
    .join('');
}

function getTypeIcon(type) {
  const icons = { visual: '🖼️', audio: '🎧', story: '📖' };
  return icons[type] || '📄';
}

function getCurrentFilteredItems() {
  const searchTerm = document
    .getElementById('search-input')
    .value.toLowerCase();
  const typeFilter = document.getElementById('type-filter').value;
  let filtered = allItems;
  if (typeFilter !== 'all') {
    filtered = filtered.filter((item) => item.type === typeFilter);
  }
  if (searchTerm) {
    filtered = filtered.filter(
      (item) =>
        item.title.toLowerCase().includes(searchTerm) ||
        item.description.toLowerCase().includes(searchTerm) ||
        item.location.toLowerCase().includes(searchTerm) ||
        (item.tags &&
          item.tags.some((tag) => tag.toLowerCase().includes(searchTerm)))
    );
  }
  return filtered;
}

function filterItems() {
  displayItems(getCurrentFilteredItems());
}

async function handleAddItem(e) {
  e.preventDefault();

  document.querySelectorAll('.field-error').forEach((el) => el.remove());
  document
    .querySelectorAll('.input-error')
    .forEach((el) => el.classList.remove('input-error'));

  const formData = new FormData(e.target);
  const title = formData.get('title').trim();
  const type = formData.get('type');
  const location = formData.get('location').trim();
  const description = formData.get('description').trim();
  const imageUrl = formData.get('imageUrl').trim();
  const audioUrl = formData.get('audioUrl').trim();

  let hasError = false;

  function showError(fieldName, message) {
    const input = e.target.querySelector(`[name="${fieldName}"]`);
    input.classList.add('input-error');
    const error = document.createElement('span');
    error.className = 'field-error';
    error.textContent = message;
    input.parentNode.appendChild(error);
    hasError = true;
  }

  function isValidUrl(str) {
    try { new URL(str); return true; } catch { return false; }
  }

  if (!title) showError('title', 'Title is required.');
  if (!location) showError('location', 'Location/Village is required.');
  if (!description) showError('description', 'Description is required.');
  if (imageUrl && !isValidUrl(imageUrl))
    showError('imageUrl', 'Please enter a valid URL (e.g. https://example.com/image.jpg).');
  if (audioUrl && !isValidUrl(audioUrl))
    showError('audioUrl', 'Please enter a valid URL.');

  if (hasError) return;

  const data = {
    title, type, location, description,
    imageUrl: imageUrl || '',
    audioUrl: audioUrl || '',
    tags: formData.get('tags')
      ? formData.get('tags').split(',').map((t) => t.trim())
      : [],
  };

  try {
    const response = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      const newItem = await response.json();
      allItems.push(newItem);
      displayItems(allItems);
      e.target.reset();
      document.getElementById('add-item-modal').classList.remove('active');
      alert(tGallery('gallery_item_added'));
    } else {
      alert(tGallery('gallery_item_error'));
    }
  } catch (error) {
    console.error('Error adding item:', error);
    alert(tGallery('gallery_item_error'));
  }
}

function viewItem(id) {
  const item = allItems.find((i) => i.id === id);
  if (item) {
    alert(`${tGallery('gallery_viewing')}: ${item.title}\n\n${item.description}`);
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getSampleItems() {
  return [
    {
      id: '1',
      type: 'visual',
      title: 'Kantha Embroidery Patterns',
      description: 'Traditional Kantha embroidery from rural Bengal, featuring intricate running stitch patterns depicting village life and nature.',
      location: 'Kantha Village, Bengal',
      imageUrl: '',
      tags: ['embroidery', 'textile'],
    },
    {
      id: '2',
      type: 'audio',
      title: 'Folk Songs of Rajasthan',
      description: 'A collection of traditional folk songs passed down through generations in rural Rajasthan.',
      location: 'Jaisalmer, Rajasthan',
      imageUrl: '',
      tags: ['music', 'folk', 'oral-tradition'],
    },
    {
      id: '3',
      type: 'story',
      title: 'The Blue Door Legend',
      description: 'An ancient story explaining why villagers in certain regions paint their doors blue to ward off evil spirits.',
      location: 'Jodhpur, Rajasthan',
      imageUrl: '',
      tags: ['legend', 'tradition', 'architecture'],
    },
  ];
}
