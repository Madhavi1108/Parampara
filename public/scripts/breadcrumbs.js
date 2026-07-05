// Breadcrumbs Navigation Utility
document.addEventListener('DOMContentLoaded', () => {
  const ROUTE_MAP = {
    'index.html': { name: 'Home', path: 'index.html' },
    'map.html': { name: 'Explore Map', path: 'map.html' },
    'gallery.html': { name: 'Gallery', path: 'gallery.html' },
    'paths.html': { name: 'Heritage Paths', path: 'paths.html' },
    'quest.html': { name: 'Discovery Quest', path: 'quest.html' },
    'trails.html': { name: 'Heritage Trails', path: 'trails.html' },
    'chat.html': { name: 'Talk to Elder', path: 'chat.html' },
    'revival.html': { name: 'Lost Traditions', path: 'revival.html' },
    'risk-dashboard.html': { name: 'Risk', path: 'risk-dashboard.html' },
    'reputation.html': { name: 'Contributor Reputation', path: 'reputation.html' },
    'timeline.html': { name: 'Historical Timeline', path: 'timeline.html' },
    'story-generator.html': { name: 'AI Story Generator', path: 'story-generator.html' },
    'favorites.html': { name: 'My Favorites', path: 'favorites.html' },
    'artisans.html': { name: 'Artisan Directory', path: 'artisans.html' },
    'artisan-profile.html': { name: 'Artisan Profile', path: 'artisan-profile.html', parent: 'artisans.html' },
    'knowledge-vault.html': { name: 'Knowledge Vault', path: 'knowledge-vault.html' },
    'compare.html': { name: 'Compare Traditions', path: 'compare.html' },
    'offline.html': { name: 'Offline', path: 'offline.html' },
    '404.html': { name: 'Page Not Found', path: '404.html' }
  };

  function getPageNameFromPath(path) {
    let filename = path.split('/').pop();
    if (!filename || filename === '') filename = 'index.html';
    
    // Handle query parameters like artisan-profile.html?id=...
    if (filename.includes('?')) {
      filename = filename.split('?')[0];
    }
    if (filename.includes('#')) {
      filename = filename.split('#')[0];
    }
    return filename;
  }

  function generateBreadcrumbs() {
    const currentFilename = getPageNameFromPath(window.location.pathname);
    
    // Do not show breadcrumbs on Home page
    if (currentFilename === 'index.html' || currentFilename === '') return;

    let breadcrumbs = [];
    let currentRoute = ROUTE_MAP[currentFilename];
    
    // If route is unknown, fallback to a capitalized filename
    if (!currentRoute) {
      const fallbackName = currentFilename.replace('.html', '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      currentRoute = { name: fallbackName, path: currentFilename };
    }

    breadcrumbs.push(currentRoute);

    // Trace parents
    let parentFile = currentRoute.parent;
    while (parentFile && ROUTE_MAP[parentFile]) {
      breadcrumbs.unshift(ROUTE_MAP[parentFile]);
      parentFile = ROUTE_MAP[parentFile].parent;
    }

    // Always add Home at the beginning
    breadcrumbs.unshift(ROUTE_MAP['index.html']);

    return breadcrumbs;
  }

  function renderBreadcrumbs(crumbs) {
    if (!crumbs || crumbs.length === 0) return;

    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', 'breadcrumb');
    nav.className = 'parampara-breadcrumb-container';

    const ol = document.createElement('ol');
    ol.className = 'parampara-breadcrumb';

    let jsonLdItems = [];

    crumbs.forEach((crumb, index) => {
      const isLast = index === crumbs.length - 1;
      const li = document.createElement('li');
      li.className = 'parampara-breadcrumb-item';
      
      if (isLast) {
        li.classList.add('active');
      }

      if (!isLast) {
        const a = document.createElement('a');
        a.href = crumb.path;
        if (crumb.name === 'Home') {
          a.innerHTML = '<i class="ti ti-home" aria-hidden="true" style="margin-right:4px;"></i> Home';
        } else {
          a.textContent = crumb.name;
        }
        li.appendChild(a);
      } else {
        li.textContent = crumb.name;
        li.setAttribute('aria-current', 'page');
      }
      
      ol.appendChild(li);

      // JSON-LD structured data
      jsonLdItems.push({
        "@type": "ListItem",
        "position": index + 1,
        "name": crumb.name,
        "item": window.location.origin + '/' + crumb.path
      });
    });

    nav.appendChild(ol);

    // Inject into DOM
    const mainContainer = document.querySelector('main');
    if (mainContainer) {
      // Create a wrapper for breadcrumbs if needed, or just insert it
      mainContainer.insertBefore(nav, mainContainer.firstChild);
    } else {
      // Fallback
      const navbar = document.querySelector('.navbar');
      if (navbar && navbar.nextSibling) {
          navbar.parentNode.insertBefore(nav, navbar.nextSibling);
      } else {
          document.body.insertBefore(nav, document.body.firstChild);
      }
    }

    // Inject JSON-LD
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": jsonLdItems
    });
    document.head.appendChild(script);
  }

  renderBreadcrumbs(generateBreadcrumbs());
});
