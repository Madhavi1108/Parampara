/**
 * Custom Geospatial Clustering Engine
 * Groups map markers dynamically based on geographic distance and zoom level.
 * Uses Web Mercator projection to calculate precise pixel distances.
 */

class ClusterEngine {
  constructor(options = {}) {
    this.radius = options.radius || 50; // pixels
    this.points = [];
  }

  load(points) {
    this.points = points;
  }

  // Convert longitude/latitude to Web Mercator pixel coordinates at a given zoom
  lngLatToPixel(lng, lat, zoom) {
    const scale = 256 * Math.pow(2, zoom);
    const x = ((lng + 180) / 360) * scale;
    const sin = Math.sin((lat * Math.PI) / 180);
    // Clip sin to avoid Infinity at poles
    const clipSin = Math.max(Math.min(sin, 0.9999), -0.9999);
    const y = (0.5 - Math.log((1 + clipSin) / (1 - clipSin)) / (4 * Math.PI)) * scale;
    return { x, y };
  }

  getClusters(bounds, zoom) {
    const clusters = [];
    
    // Add margin to bounds for seamless panning
    const w = bounds.getWest() - 0.5;
    const e = bounds.getEast() + 0.5;
    const s = bounds.getSouth() - 0.5;
    const n = bounds.getNorth() + 0.5;

    // Filter visible points first to save computation
    const visiblePoints = this.points.filter(p => {
      const lng = p.coordinates[1];
      const lat = p.coordinates[0];
      return lng >= w && lng <= e && lat >= s && lat <= n;
    });

    // Project points to pixel space
    const projectedPoints = visiblePoints.map(p => {
      const lng = p.coordinates[1];
      const lat = p.coordinates[0];
      const pix = this.lngLatToPixel(lng, lat, Math.floor(zoom));
      return { ...p, pixX: pix.x, pixY: pix.y, lng, lat };
    });

    // Greedy clustering
    for (const p of projectedPoints) {
      let merged = false;
      for (const cluster of clusters) {
        const dx = p.pixX - cluster.pixX;
        const dy = p.pixY - cluster.pixY;
        const distSq = dx * dx + dy * dy;
        
        if (distSq <= this.radius * this.radius) {
          cluster.points.push(p);
          // Recalculate cluster center of mass
          cluster.pixX = (cluster.pixX * (cluster.points.length - 1) + p.pixX) / cluster.points.length;
          cluster.pixY = (cluster.pixY * (cluster.points.length - 1) + p.pixY) / cluster.points.length;
          cluster.lng = (cluster.lng * (cluster.points.length - 1) + p.lng) / cluster.points.length;
          cluster.lat = (cluster.lat * (cluster.points.length - 1) + p.lat) / cluster.points.length;
          merged = true;
          break;
        }
      }
      
      if (!merged) {
        clusters.push({
          isCluster: true,
          pixX: p.pixX,
          pixY: p.pixY,
          lng: p.lng,
          lat: p.lat,
          points: [p]
        });
      }
    }

    // Format output to match standard marker usage
    return clusters.map(c => {
      if (c.points.length === 1) {
        return { isCluster: false, data: c.points[0] };
      }
      return {
        isCluster: true,
        count: c.points.length,
        coordinates: [c.lat, c.lng], // [lat, lng] format
        points: c.points,
        // Bounds calculation for zooming into cluster
        bounds: c.points.reduce((acc, point) => {
          return {
            minLng: Math.min(acc.minLng, point.lng),
            maxLng: Math.max(acc.maxLng, point.lng),
            minLat: Math.min(acc.minLat, point.lat),
            maxLat: Math.max(acc.maxLat, point.lat)
          };
        }, {
          minLng: Infinity, maxLng: -Infinity,
          minLat: Infinity, maxLat: -Infinity
        })
      };
    });
  }
}

window.ClusterEngine = ClusterEngine;
