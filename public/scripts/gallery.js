// Gallery Page JavaScript

let allItems = [];

document.addEventListener('DOMContentLoaded', () => {
    loadGalleryItems();
    setupEventListeners();
});

// ── Re-render cards whenever language changes 
// language-switcher.js fires this event on every language switch
window.addEventListener('parampara:langchange', () => {
    displayItems(getCurrentFilteredItems());
});

function setupEventListeners() {
    document.getElementById('add-item-btn').addEventListener('click', () => {
        document.getElementById('add-item-modal').classList.add('active');
    });

    document.getElementById('close-modal').addEventListener('click', () => {
        document.getElementById('add-item-modal').classList.remove('active');
    });

    document.getElementById('add-item-form').addEventListener('submit', handleAddItem);

    document.getElementById('search-input').addEventListener('input', filterItems);
    document.getElementById('type-filter').addEventListener('change', filterItems);
}

async function loadGalleryItems() {
    try {
        const response = await fetch('/api/items');
        allItems = await response.json();
        displayItems(allItems);
    } catch (error) {
        console.error('Error loading items:', error);
        // Show sample items for demo when API is unavailable
        allItems = getSampleItems();
        displayItems(allItems);
    }
}

// ── Translation helper (safe — works even before switcher loads) 
function tGallery(key) {
    if (typeof PARAMPARA_TRANSLATIONS === 'undefined') return key;
    const lang = localStorage.getItem('parampara_lang')
              || localStorage.getItem('language')
              || 'en';
    const dict = PARAMPARA_TRANSLATIONS[lang] || PARAMPARA_TRANSLATIONS['en'];
    return (dict && dict[key]) || (PARAMPARA_TRANSLATIONS['en'][key]) || key;
}

// ── Translate the type badge value 
function translateType(type) {
    const keyMap = {
        'visual': 'modal_type_visual',
        'audio':  'modal_type_audio',
        'story':  'modal_type_story'
    };
    return tGallery(keyMap[type] || type);
}

// ── Translate "No items" empty state 
function getEmptyStateHtml() {
    return `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-muted);">
            <p style="font-size: 1.2rem; margin-bottom: 1rem;">${tGallery('gallery_empty_title')}</p>
            <p>${tGallery('gallery_empty_desc')}</p>
        </div>
    `;
}

function displayItems(items) {
    const galleryGrid = document.getElementById('gallery-grid');

    if (!items || items.length === 0) {
        galleryGrid.innerHTML = getEmptyStateHtml();
        return;
    }

    galleryGrid.innerHTML = items.map(item => `
        <div class="gallery-item" onclick="viewItem('${item.id}')">
            <div class="gallery-item-image">
                ${item.imageUrl
                    ? `<img src="${item.imageUrl}" alt="${escapeHtml(item.title)}" style="width:100%;height:100%;object-fit:cover;">`
                    : `<span>${getTypeIcon(item.type)}</span>`
                }
            </div>
            <div class="gallery-item-content">
                <span class="gallery-item-type">${translateType(item.type)}</span>
                <h3>${escapeHtml(item.title)}</h3>
                <p>${escapeHtml(item.description.substring(0, 100))}${item.description.length > 100 ? '...' : ''}</p>
                <div class="gallery-item-location">
                    📍 <strong>${escapeHtml(item.location)}</strong>
                </div>
                ${item.tags && item.tags.length > 0 ? `
                    <div class="gallery-item-tags">
                        ${item.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function getTypeIcon(type) {
    const icons = { 'visual': '🖼️', 'audio': '🎧', 'story': '📖' };
    return icons[type] || '📄';
}

// ── Returns currently filtered items (used on re-render after lang switch) ────
function getCurrentFilteredItems() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const typeFilter = document.getElementById('type-filter').value;
    let filtered = allItems;
    if (typeFilter !== 'all') {
        filtered = filtered.filter(item => item.type === typeFilter);
    }
    if (searchTerm) {
        filtered = filtered.filter(item =>
            item.title.toLowerCase().includes(searchTerm) ||
            item.description.toLowerCase().includes(searchTerm) ||
            item.location.toLowerCase().includes(searchTerm) ||
            (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
        );
    }
    return filtered;
}

function filterItems() {
    displayItems(getCurrentFilteredItems());
}

async function handleAddItem(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
        title:       formData.get('title'),
        type:        formData.get('type'),
        location:    formData.get('location'),
        description: formData.get('description'),
        imageUrl:    formData.get('imageUrl') || '',
        audioUrl:    formData.get('audioUrl') || '',
        tags:        formData.get('tags')
                       ? formData.get('tags').split(',').map(t => t.trim())
                       : []
    };

    try {
        const response = await fetch('/api/items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
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
    const item = allItems.find(i => i.id === id);
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

// ── Sample items shown when API is not available ──────────────────────────────
function getSampleItems() {
    return [
        {
            id: '1',
            type: 'visual',
            title: 'Kantha Embroidery Patterns',
            description: 'Traditional Kantha embroidery from rural Bengal, featuring intricate running stitch patterns depicting village life and nature.',
            location: 'Kantha Village, Bengal',
            imageUrl: '',
            tags: ['embroidery', 'textile']
        },
        {
            id: '2',
            type: 'audio',
            title: 'Folk Songs of Rajasthan',
            description: 'A collection of traditional folk songs passed down through generations in rural Rajasthan.',
            location: 'Jaisalmer, Rajasthan',
            imageUrl: '',
            tags: ['music', 'folk', 'oral-tradition']
        },
        {
            id: '3',
            type: 'story',
            title: 'The Blue Door Legend',
            description: 'An ancient story explaining why villagers in certain regions paint their doors blue to ward off evil spirits.',
            location: 'Jodhpur, Rajasthan',
            imageUrl: '',
            tags: ['legend', 'tradition', 'architecture']
        }
    ];
}
