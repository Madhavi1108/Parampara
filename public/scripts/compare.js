// Compare Items Logic
let allItems = [];
let item1 = null;
let item2 = null;

document.addEventListener('DOMContentLoaded', async () => {
  await loadItems();
  
  const select1 = document.getElementById('select-item-1');
  const select2 = document.getElementById('select-item-2');
  
  select1.addEventListener('change', (e) => {
    item1 = allItems.find(i => i.id === e.target.value);
    renderComparison();
  });
  
  select2.addEventListener('change', (e) => {
    item2 = allItems.find(i => i.id === e.target.value);
    renderComparison();
  });
});

async function loadItems() {
  try {
    const response = await fetch('/api/items');
    allItems = await response.json();
    populateSelects();
  } catch (error) {
    console.error('Failed to load items:', error);
  }
}

function populateSelects() {
  const select1 = document.getElementById('select-item-1');
  const select2 = document.getElementById('select-item-2');
  
  // Group items by category (type) for better select organization
  const grouped = allItems.reduce((acc, item) => {
    acc[item.type] = acc[item.type] || [];
    acc[item.type].push(item);
    return acc;
  }, {});
  
  let optionsHtml = '<option value="">Select an Item...</option>';
  
  for (const [type, items] of Object.entries(grouped)) {
    const typeName = type.charAt(0).toUpperCase() + type.slice(1);
    optionsHtml += `<optgroup label="${typeName}">`;
    items.forEach(item => {
      optionsHtml += `<option value="${item.id}">${escapeHtml(item.title)}</option>`;
    });
    optionsHtml += `</optgroup>`;
  }
  
  select1.innerHTML = optionsHtml;
  select2.innerHTML = optionsHtml;
}

function renderComparison() {
  renderSlot(1, item1);
  renderSlot(2, item2);
  
  // Apply smart highlights if both items are loaded
  if (item1 && item2) {
    applyHighlights();
  }
}

function renderSlot(slotIndex, item) {
  const contentContainer = document.getElementById(`compare-content-${slotIndex}`);
  
  if (!item) {
    contentContainer.innerHTML = `
      <div class="compare-placeholder">
        <i class="ti ti-photo"></i>
        <p>Select an item to begin comparison</p>
      </div>`;
    return;
  }
  
  const imageHtml = item.imageUrl 
    ? `<div class="compare-image-container"><img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.title)}"></div>`
    : `<div class="compare-image-container" style="display:flex;align-items:center;justify-content:center;font-size:3rem;background:#eee;">${getTypeIcon(item.type)}</div>`;

  const tagsHtml = (item.tags || []).map(tag => 
    `<span class="compare-tag" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</span>`
  ).join('');

  contentContainer.innerHTML = `
    ${imageHtml}
    <h3 class="compare-title">${escapeHtml(item.title)}</h3>
    
    <div class="compare-attribute">
      <span class="compare-attribute-label">Type</span>
      <div class="compare-attribute-value" data-attr="type">${escapeHtml(item.type.toUpperCase())}</div>
    </div>
    
    <div class="compare-attribute">
      <span class="compare-attribute-label">Region / Location</span>
      <div class="compare-attribute-value" data-attr="location">${escapeHtml(item.location)}</div>
    </div>
    
    <div class="compare-attribute">
      <span class="compare-attribute-label">Tags</span>
      <div class="compare-tags">${tagsHtml || '<em>None</em>'}</div>
    </div>
    
    <div class="compare-attribute">
      <span class="compare-attribute-label">Description</span>
      <div class="compare-attribute-value markdown-body" style="font-size:0.9rem;">${typeof renderMarkdown === 'function' ? renderMarkdown(item.description) : escapeHtml(item.description)}</div>
    </div>
  `;
}

function applyHighlights() {
  const content1 = document.getElementById('compare-content-1');
  const content2 = document.getElementById('compare-content-2');
  
  // Highlight Type Match
  if (item1.type.toLowerCase() === item2.type.toLowerCase()) {
    content1.querySelector('[data-attr="type"]').classList.add('trait-match');
    content2.querySelector('[data-attr="type"]').classList.add('trait-match');
  }
  
  // Highlight Location Match
  if (item1.location.toLowerCase().trim() === item2.location.toLowerCase().trim()) {
    content1.querySelector('[data-attr="location"]').classList.add('trait-match');
    content2.querySelector('[data-attr="location"]').classList.add('trait-match');
  }
  
  // Highlight Tag Matches
  const tags1 = item1.tags || [];
  const tags2 = item2.tags || [];
  const sharedTags = tags1.filter(t => tags2.includes(t));
  
  sharedTags.forEach(tag => {
    const el1 = content1.querySelector(`[data-tag="${escapeHtml(tag)}"]`);
    const el2 = content2.querySelector(`[data-tag="${escapeHtml(tag)}"]`);
    if (el1) el1.classList.add('trait-match');
    if (el2) el2.classList.add('trait-match');
  });
}

function escapeHtml(unsafe) {
  if (!unsafe) return '';
  const div = document.createElement('div');
  div.textContent = String(unsafe);
  return div.innerHTML;
}

function getTypeIcon(type) {
  const icons = { visual: '🖼️', audio: '🎧', story: '📖' };
  return icons[type] || '📄';
}
