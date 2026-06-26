// public/scripts/artisans.js
document.addEventListener('DOMContentLoaded', async () => {
  await loadArtisans();
});

let allArtisans = [];

async function loadArtisans() {
  try {
    const response = await fetch('/api/artisans');
    if (!response.ok) throw new Error('Failed to fetch artisans');
    const data = await response.json();
    allArtisans = data;
    populateFilterOptions();
    renderArtisanGrid(data);
    setupFilters();
  } catch (err) {
    console.error(err);
  }
}

function populateFilterOptions() {
  const craftSet = new Set();
  const villageSet = new Set();
  const regionSet = new Set();
  allArtisans.forEach(a => {
    craftSet.add(a.craft);
    villageSet.add(a.village);
    regionSet.add(a.region);
  });
  const craftFilter = document.getElementById('craftFilter');
  const villageFilter = document.getElementById('villageFilter');
  const regionFilter = document.getElementById('regionFilter');
  addOptions(craftFilter, [...craftSet]);
  addOptions(villageFilter, [...villageSet]);
  addOptions(regionFilter, [...regionSet]);
}

function addOptions(selectElem, values) {
  values.sort();
  values.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v;
    selectElem.appendChild(opt);
  });
}

function setupFilters() {
  const searchInput = document.getElementById('searchInput');
  const craftFilter = document.getElementById('craftFilter');
  const villageFilter = document.getElementById('villageFilter');
  const regionFilter = document.getElementById('regionFilter');
  const experienceFilter = document.getElementById('experienceFilter');

  const filters = [searchInput, craftFilter, villageFilter, regionFilter, experienceFilter];
  filters.forEach(f => f.addEventListener('input', applyFilters));
}

async function applyFilters() {
  const search = document.getElementById('searchInput').value.toLowerCase();
  const craft = document.getElementById('craftFilter').value;
  const village = document.getElementById('villageFilter').value;
  const region = document.getElementById('regionFilter').value;
  const experience = document.getElementById('experienceFilter').value;

  try {
    const grid = document.getElementById('artisanGrid');
    if (grid) grid.style.opacity = '0.5';
    
    const filtered = await window.dataWorker.runJob('filterArtisans', {
      items: allArtisans,
      search,
      craft,
      village,
      region,
      experience
    });
    
    if (grid) grid.style.opacity = '1';
    renderArtisanGrid(filtered);
    updateStats(filtered);
  } catch (error) {
    console.error('Worker filter error:', error);
    const grid = document.getElementById('artisanGrid');
    if (grid) grid.style.opacity = '1';
    
    const filtered = allArtisans.filter(a => {
      const matchesSearch = (a.name && a.name.toLowerCase().includes(search)) || (a.craft && a.craft.toLowerCase().includes(search));
      const matchesCraft = craft === '' || a.craft === craft;
      const matchesVillage = village === '' || a.village === village;
      const matchesRegion = region === '' || a.region === region;
      const matchesExp = experience === '' || experienceLevel(a.experience) === experience;
      return matchesSearch && matchesCraft && matchesVillage && matchesRegion && matchesExp;
    });
    renderArtisanGrid(filtered);
    updateStats(filtered);
  }
}

function experienceLevel(years) {
  if (years <= 5) return 'apprentice';
  if (years <= 15) return 'skilled';
  if (years <= 30) return 'master';
  return 'keeper';
}

function renderArtisanGrid(artisans) {
  const grid = document.getElementById('artisanGrid');
  if (!grid) return;
  grid.innerHTML = artisans.map(a => `
    <div class="card" data-id="${a.id}" role="button" tabindex="0">
      <img src="${a.portfolio && a.portfolio[0] ? a.portfolio[0].image : 'images/default-artisan.jpg'}" alt="${a.name}" loading="lazy" class="lazy-img" onload="this.classList.add('loaded')">
      <div class="content">
        <h3>${escapeHtml(a.name)}</h3>
        <p>${escapeHtml(a.craft)}</p>
        <span class="badge">${experienceLevel(a.experience)}</span>
      </div>
    </div>
  `).join('');
  // Add click listeners for navigation to profile page
  grid.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      window.location.href = `artisan-profile.html?id=${id}`;
    });
    card.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const id = card.dataset.id;
        window.location.href = `artisan-profile.html?id=${id}`;
      }
    });
  });
}

function updateStats(artisans) {
  const statsDiv = document.getElementById('artisan-stats');
  if (!statsDiv) return;
  const total = artisans.length;
  const apprentices = artisans.filter(a => a.experience <= 5).length;
  const skilled = artisans.filter(a => a.experience > 5 && a.experience <= 15).length;
  const masters = artisans.filter(a => a.experience > 15 && a.experience <= 30).length;
  const keepers = artisans.filter(a => a.experience > 30).length;
  statsDiv.innerHTML = `
    <div class="stat"><span class="stat-num">${total}</span> Artisans</div>
    <div class="stat"><span class="stat-num">${apprentices}</span> Apprentices</div>
    <div class="stat"><span class="stat-num">${skilled}</span> Skilled</div>
    <div class="stat"><span class="stat-num">${masters}</span> Masters</div>
    <div class="stat"><span class="stat-num">${keepers}</span> Keepers</div>
  `;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
