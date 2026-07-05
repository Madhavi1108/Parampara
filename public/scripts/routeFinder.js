// ==========================================
// Route Finder Integration
// ==========================================

let routeLayerId = 'optimized-route-layer';
let routeSourceId = 'optimized-route-source';

function setupRouteFinder() {
  const startSelect = document.getElementById('route-start');
  const endSelect = document.getElementById('route-end');
  const themeSelect = document.getElementById('route-theme');
  const btnFindRoute = document.getElementById('btn-find-route');
  
  if (!startSelect || !endSelect || !themeSelect || !btnFindRoute) return;

  // Populate themes
  fetch('/api/paths/themes')
    .then(res => res.json())
    .then(themes => {
      themes.forEach(theme => {
        const option = document.createElement('option');
        option.value = theme;
        option.textContent = theme;
        themeSelect.appendChild(option);
      });
    })
    .catch(console.error);

  // Populate locations
  let retries = 0;
  const populateLocations = () => {
    // wait until sampleVillages is loaded
    if (!window.sampleVillages || window.sampleVillages.length === 0) {
      if (retries < 10) {
        retries++;
        setTimeout(populateLocations, 500);
      }
      return;
    }
    
    // Sort villages by name
    const sortedVillages = [...window.sampleVillages].sort((a, b) => {
      const nameA = a.name.en || a.name;
      const nameB = b.name.en || b.name;
      return nameA.localeCompare(nameB);
    });

    sortedVillages.forEach(village => {
      const name = village.name.en || village.name;
      const optionStart = document.createElement('option');
      optionStart.value = village.id;
      optionStart.textContent = name;
      startSelect.appendChild(optionStart);
      
      const optionEnd = document.createElement('option');
      optionEnd.value = village.id;
      optionEnd.textContent = name;
      endSelect.appendChild(optionEnd);
    });
  };
  
  populateLocations();

  btnFindRoute.addEventListener('click', async () => {
    const startId = startSelect.value;
    const endId = endSelect.value;
    const theme = themeSelect.value;
    
    if (!startId || !endId) {
      alert('Please select both a start and end location.');
      return;
    }
    
    btnFindRoute.disabled = true;
    btnFindRoute.textContent = 'Routing...';
    
    try {
      let url = `/api/paths/route?start=${startId}&end=${endId}`;
      if (theme) url += `&theme=${encodeURIComponent(theme)}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to find route');
      }
      
      drawOptimizedRoute(data);
    } catch (err) {
      console.error(err);
      alert(err.message);
      
      // Clear previous route on error
      if (map && map.getSource(routeSourceId)) {
        map.getSource(routeSourceId).setData({ type: 'FeatureCollection', features: [] });
      }
      const dashboard = document.getElementById('custom-route-dashboard');
      if (dashboard) dashboard.style.display = 'none';
    } finally {
      btnFindRoute.disabled = false;
      btnFindRoute.textContent = 'Find Route';
    }
  });
}

function drawOptimizedRoute(routeData) {
  if (!map) return;
  
  const coordinates = routeData.route.map(step => [step.item.coordinates[1], step.item.coordinates[0]]);
  
  const geojson = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: coordinates
    }
  };
  
  if (map.getSource(routeSourceId)) {
    map.getSource(routeSourceId).setData(geojson);
  } else {
    map.addSource(routeSourceId, {
      type: 'geojson',
      data: geojson
    });
    
    map.addLayer({
      id: routeLayerId,
      type: 'line',
      source: routeSourceId,
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#e76f51',
        'line-width': 6,
        'line-opacity': 0.8,
        'line-dasharray': [2, 2]
      }
    });
  }
  
  // Fit map to route bounds
  if (coordinates.length > 0) {
    const bounds = new maplibregl.LngLatBounds(coordinates[0], coordinates[0]);
    for (const coord of coordinates) {
      bounds.extend(coord);
    }
    map.fitBounds(bounds, { padding: 100, maxZoom: 8 });
  }
  
  // Update dashboard
  const dashboard = document.getElementById('custom-route-dashboard');
  if (dashboard) {
    dashboard.style.display = 'block';
    document.getElementById('route-distance').textContent = routeData.totalDistanceKm.toFixed(2) + ' km';
    document.getElementById('route-waypoints').textContent = routeData.route.length;
    const timeHours = routeData.totalDistanceKm / 60; // Assume 60km/h
    const timeMins = Math.round(timeHours * 60);
    const timeDisplay = timeMins > 60 ? `${Math.floor(timeMins / 60)}h ${timeMins % 60}m` : `${timeMins} mins`;
    document.getElementById('route-time').textContent = timeDisplay;
  }
}

// Ensure setupRouteFinder runs after initialization
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(setupRouteFinder, 1000); // Wait for map and data
});
