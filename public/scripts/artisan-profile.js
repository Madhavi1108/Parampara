// public/scripts/artisan-profile.js

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const artisanId = urlParams.get('id');
  if (!artisanId) {
    document.getElementById('artisan-profile').innerHTML = '<p data-i18n="error_no_id">Artisan ID not provided.</p>';
    return;
  }
  loadArtisan(artisanId);
});

async function loadArtisan(id) {
  try {
    const res = await fetch(`/api/artisans/${id}`);
    if (!res.ok) throw new Error('Network response was not ok');
    const artisan = await res.json();
    renderArtisan(artisan);
  } catch (err) {
    console.error(err);
    const container = document.getElementById('artisan-profile');
    if (container) container.innerHTML = `<p data-i18n="error_loading">Failed to load artisan profile.</p>`;
  }
}

function renderArtisan(artisan) {
  const container = document.getElementById('artisan-profile');
  if (!container) return;
  const { name, craft, experienceYears, biography, portfolio, showContact, contactInfo, recognitionLevel, relatedContent, profileImage } = artisan;

  const contactHTML = showContact && contactInfo ? `
    <p><strong data-i18n="contact_email">Email:</strong> ${contactInfo.email || ''}</p>
    <p><strong data-i18n="contact_phone">Phone:</strong> ${contactInfo.phone || ''}</p>
  ` : '';

  const portfolioHTML = portfolio && portfolio.length ? `
    <div class="grid">
      ${portfolio.map(src => `<img src="${src}" alt="${name} work" loading="lazy" class="lazy-img" onload="this.classList.add('loaded')" />`).join('')}
    </div>
  ` : '';

  const relatedHTML = relatedContent && relatedContent.length ? `
    <ul>
      ${relatedContent.map(item => `<li>${item}</li>`).join('')}
    </ul>
  ` : '';

  container.innerHTML = `
    <section class="profile-header" id="profileHeader">
      <img src="${profileImage || 'https://via.placeholder.com/200'}" alt="${name}" loading="lazy" class="lazy-img" onload="this.classList.add('loaded')" />
      <div class="info">
        <h2>${name}</h2>
        <p data-i18n="craft">Craft: ${craft}</p>
        <p data-i18n="experience">Experience: ${experienceYears} years</p>
        <span class="badge" data-i18n="recognition_${recognitionLevel}">${recognitionLevel}</span>
      </div>
    </section>
    <section class="biography" id="biography">
      <h2 data-i18n="biography_title">Biography</h2>
      <p>${biography || ''}</p>
    </section>
    <section class="portfolio" id="portfolio">
      <h2 data-i18n="portfolio_title">Portfolio</h2>
      ${portfolioHTML}
    </section>
    <section class="contact" id="contactInfo">
      <h2 data-i18n="contact_title">Contact</h2>
      ${contactHTML}
    </section>
    <section class="related" id="relatedContent">
      <h2 data-i18n="related_content_title">Related Content</h2>
      ${relatedHTML}
    </section>
  `;
}
