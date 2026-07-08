// public/scripts/analyticsDashboard.js

class AnalyticsDashboardUI {
  constructor(options = {}) {
    this.apiBase = options.apiBase || '/api/analytics';
    this.container = options.container || '#dashboard-container';
    this.charts = {};
    this.currentDashboard = null;
    
    this.init();
  }

  init() {
    this.renderInterface();
    this.loadDashboard();
    this.loadMetrics();
    this.loadTrends();
    this.setupEventListeners();
    console.log('✅ Analytics Dashboard UI initialized');
  }

  renderInterface() {
    const container = document.querySelector(this.container);
    if (!container) return;

    container.innerHTML = `
      <div class="dashboard-interface">
        <div class="dashboard-header">
          <h2>📊 Cultural Heritage Analytics</h2>
          <div class="dashboard-actions">
            <button id="btn-refresh" class="btn btn-primary">🔄 Refresh</button>
            <button id="btn-export" class="btn btn-secondary">📥 Export</button>
            <button id="btn-report" class="btn btn-info">📄 Generate Report</button>
          </div>
        </div>

        <!-- Metrics Grid -->
        <div class="metrics-grid" id="metrics-grid">
          <!-- Metrics will be loaded here -->
        </div>

        <!-- Charts -->
        <div class="charts-grid">
          <div class="chart-container">
            <h4>📈 Cultural Trends</h4>
            <div id="trend-chart" class="chart"></div>
          </div>
          <div class="chart-container">
            <h4>🎯 Category Distribution</h4>
            <div id="category-chart" class="chart"></div>
          </div>
          <div class="chart-container">
            <h4>🌍 Regional Distribution</h4>
            <div id="region-chart" class="chart"></div>
          </div>
          <div class="chart-container">
            <h4>📊 Engagement Metrics</h4>
            <div id="engagement-chart" class="chart"></div>
          </div>
        </div>

        <!-- Reports Section -->
        <div class="reports-section" id="reports-section">
          <h4>📄 Recent Reports</h4>
          <div id="reports-list">
            <p>No reports generated yet</p>
          </div>
        </div>
      </div>
    `;
  }

  async loadDashboard() {
    try {
      const response = await fetch(`${this.apiBase}/dashboard`);
      const data = await response.json();

      if (data.success) {
        this.currentDashboard = data.dashboard;
        this.renderCharts(data.dashboard);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  }

  async loadMetrics() {
    try {
      const response = await fetch(`${this.apiBase}/metrics`);
      const data = await response.json();

      if (data.success) {
        this.renderMetrics(data.metrics);
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  }

  renderMetrics(metrics) {
    const container = document.getElementById('metrics-grid');
    if (!container) return;

    const metricCards = [
      { label: 'Cultural Score', value: Math.round(metrics.cultural.culturalScore), icon: '🏆' },
      { label: 'Total Artifacts', value: metrics.cultural.totalArtifacts, icon: '📜' },
      { label: 'Total Stories', value: metrics.cultural.totalStories, icon: '📖' },
      { label: 'Total Users', value: metrics.community.totalUsers, icon: '👥' },
      { label: 'Active Users', value: metrics.community.activeUsers, icon: '📊' },
      { label: 'Engagement Rate', value: `${Math.round(metrics.community.engagementRate)}%`, icon: '🎯' },
      { label: 'Cultural Preservation', value: `${Math.round(metrics.impact.culturalPreservation)}%`, icon: '🛡️' },
      { label: 'Page Views', value: metrics.platform.pageViews.toLocaleString(), icon: '👁️' }
    ];

    container.innerHTML = metricCards.map(metric => `
      <div class="metric-card" style="
        background: white;
        padding: 20px;
        border-radius: 12px;
        text-align: center;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      ">
        <div style="font-size: 32px;">${metric.icon}</div>
        <div class="metric-value" style="font-size: 28px; font-weight: bold; color: #2E7D32;">${metric.value}</div>
        <div class="metric-label" style="color: #666; font-size: 14px;">${metric.label}</div>
      </div>
    `).join('');
  }

  async loadTrends() {
    try {
      const response = await fetch(`${this.apiBase}/trends?period=year`);
      const data = await response.json();

      if (data.success) {
        this.renderTrendChart(data.trends);
        this.renderEngagementChart(data.trends);
      }
    } catch (error) {
      console.error('Error loading trends:', error);
    }
  }

  renderCharts(dashboard) {
    if (!dashboard || !dashboard.widgets) return;

    // Load data for each chart
    this.loadTrends();
    this.loadDataPoints();
  }

  renderTrendChart(trends) {
    const container = document.getElementById('trend-chart');
    if (!container) return;

    // Simple chart rendering using canvas
    const canvas = document.createElement('canvas');
    canvas.width = 500;
    canvas.height = 250;
    container.innerHTML = '';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Draw axes
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Draw data
    if (trends && trends.length > 0) {
      const maxValue = Math.max(...trends.map(t => Math.max(t.culturalScore, t.userEngagement)));
      const stepX = (width - padding * 2) / (trends.length - 1);
      
      // Draw cultural score line
      ctx.strokeStyle = '#4CAF50';
      ctx.lineWidth = 2;
      ctx.beginPath();
      trends.forEach((trend, i) => {
        const x = padding + i * stepX;
        const y = height - padding - (trend.culturalScore / maxValue) * (height - padding * 2);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Draw user engagement line
      ctx.strokeStyle = '#2196F3';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      trends.forEach((trend, i) => {
        const x = padding + i * stepX;
        const y = height - padding - (trend.userEngagement / maxValue) * (height - padding * 2);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw labels
      ctx.fillStyle = '#333';
      ctx.font = '10px Arial';
      trends.forEach((trend, i) => {
        const x = padding + i * stepX;
        ctx.fillText(trend.month, x - 10, height - padding + 15);
      });

      // Legend
      ctx.fillStyle = '#4CAF50';
      ctx.fillRect(width - 180, 10, 10, 10);
      ctx.fillStyle = '#333';
      ctx.font = '11px Arial';
      ctx.fillText('Cultural Score', width - 165, 20);

      ctx.fillStyle = '#2196F3';
      ctx.fillRect(width - 180, 30, 10, 10);
      ctx.fillStyle = '#333';
      ctx.fillText('User Engagement', width - 165, 40);
    }
  }

  renderEngagementChart(trends) {
    const container = document.getElementById('engagement-chart');
    if (!container) return;

    const canvas = document.createElement('canvas');
    canvas.width = 500;
    canvas.height = 250;
    container.innerHTML = '';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;

    ctx.clearRect(0, 0, width, height);

    if (trends && trends.length > 0) {
      const maxValue = Math.max(...trends.map(t => t.retention || 0));
      const stepX = (width - padding * 2) / (trends.length - 1);
      
      ctx.strokeStyle = '#FF9800';
      ctx.lineWidth = 2;
      ctx.beginPath();
      trends.forEach((trend, i) => {
        const x = padding + i * stepX;
        const y = height - padding - ((trend.retention || 0) / maxValue) * (height - padding * 2);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Fill area
      ctx.strokeStyle = '#FF9800';
      ctx.fillStyle = 'rgba(255, 152, 0, 0.1)';
      ctx.beginPath();
      const firstX = padding;
      const lastX = padding + (trends.length - 1) * stepX;
      ctx.moveTo(firstX, height - padding);
      trends.forEach((trend, i) => {
        const x = padding + i * stepX;
        const y = height - padding - ((trend.retention || 0) / maxValue) * (height - padding * 2);
        ctx.lineTo(x, y);
      });
      ctx.lineTo(lastX, height - padding);
      ctx.closePath();
      ctx.fill();

      // Labels
      ctx.fillStyle = '#333';
      ctx.font = '10px Arial';
      trends.forEach((trend, i) => {
        const x = padding + i * stepX;
        ctx.fillText(trend.month, x - 10, height - padding + 15);
      });

      ctx.fillStyle = '#333';
      ctx.font = '11px Arial';
      ctx.fillText('User Retention Rate', padding, 20);
    }
  }

  async loadDataPoints() {
    try {
      const response = await fetch(`${this.apiBase}/data-points`);
      const data = await response.json();

      if (data.success) {
        this.renderCategoryChart(data.dataPoints);
        this.renderRegionChart(data.dataPoints);
      }
    } catch (error) {
      console.error('Error loading data points:', error);
    }
  }

  renderCategoryChart(dataPoints) {
    const container = document.getElementById('category-chart');
    if (!container) return;

    // Count categories
    const categories = {};
    dataPoints.forEach(dp => {
      categories[dp.category] = (categories[dp.category] || 0) + 1;
    });

    const total = dataPoints.length;
    const colors = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336', '#00BCD4'];

    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 250;
    container.innerHTML = '';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const radius = 100;

    ctx.clearRect(0, 0, width, height);

    let startAngle = -Math.PI / 2;
    const entries = Object.entries(categories);
    entries.forEach(([category, count], index) => {
      const sliceAngle = (count / total) * 2 * Math.PI;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = colors[index % colors.length];
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label
      const midAngle = startAngle + sliceAngle / 2;
      const labelX = cx + (radius * 0.65) * Math.cos(midAngle);
      const labelY = cy + (radius * 0.65) * Math.sin(midAngle);
      ctx.fillStyle = 'white';
      ctx.font = '11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round((count / total) * 100)}%`, labelX, labelY);

      startAngle += sliceAngle;
    });

    // Legend
    let legendY = 10;
    entries.forEach(([category, count], index) => {
      ctx.fillStyle = colors[index % colors.length];
      ctx.fillRect(width - 100, legendY, 12, 12);
      ctx.fillStyle = '#333';
      ctx.font = '10px Arial';
      ctx.fillText(`${category} (${count})`, width - 84, legendY + 10);
      legendY += 20;
    });
  }

  renderRegionChart(dataPoints) {
    const container = document.getElementById('region-chart');
    if (!container) return;

    // Count regions
    const regions = {};
    dataPoints.forEach(dp => {
      regions[dp.region] = (regions[dp.region] || 0) + 1;
    });

    const max = Math.max(...Object.values(regions));
    const colors = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336'];

    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 250;
    container.innerHTML = '';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    ctx.clearRect(0, 0, width, height);

    // Draw bars
    const entries = Object.entries(regions);
    const barWidth = chartWidth / entries.length * 0.6;
    const gap = chartWidth / entries.length;

    entries.forEach(([region, count], index) => {
      const x = padding + index * gap + (gap - barWidth) / 2;
      const barHeight = (count / max) * chartHeight;
      const y = height - padding - barHeight;

      ctx.fillStyle = colors[index % colors.length];
      ctx.fillRect(x, y, barWidth, barHeight);

      // Label
      ctx.fillStyle = '#333';
      ctx.font = '11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(region, x + barWidth / 2, height - padding + 15);
      ctx.fillText(count, x + barWidth / 2, y - 5);
    });
  }

  async generateReport() {
    const reportType = prompt('Enter report type (cultural_overview, community_engagement, impact_assessment, platform_analytics):', 'cultural_overview');
    if (!reportType) return;

    try {
      const response = await fetch(`${this.apiBase}/report/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportType })
      });

      const data = await response.json();

      if (data.success) {
        this.showToast('✅ Report generated successfully!', 'success');
        this.loadReports();
      }
    } catch (error) {
      console.error('Error generating report:', error);
      this.showToast('❌ Error generating report', 'error');
    }
  }

  async loadReports() {
    try {
      const response = await fetch(`${this.apiBase}/reports`);
      const data = await response.json();

      if (data.success) {
        this.renderReports(data.reports);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
    }
  }

  renderReports(reports) {
    const container = document.getElementById('reports-list');
    if (!container) return;

    if (!reports || reports.length === 0) {
      container.innerHTML = '<p>No reports generated yet</p>';
      return;
    }

    const recent = reports.slice(-5).reverse();
    container.innerHTML = recent.map(report => `
      <div style="
        background: white;
        padding: 15px;
        border-radius: 8px;
        margin-bottom: 10px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
      ">
        <div>
          <strong>${report.type}</strong>
          <span style="font-size: 12px; color: #888; margin-left: 10px;">
            ${new Date(report.generatedAt).toLocaleString()}
          </span>
        </div>
        <button onclick="window.dashboardUI.exportReport('${report.id}')" style="
          padding: 5px 15px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
        ">📥 Export</button>
      </div>
    `).join('');
  }

  async exportReport(reportId) {
    try {
      window.open(`${this.apiBase}/report/${reportId}/export`, '_blank');
      this.showToast('📥 Report exported!', 'success');
    } catch (error) {
      console.error('Error exporting report:', error);
      this.showToast('❌ Error exporting report', 'error');
    }
  }

  setupEventListeners() {
    // Refresh
    document.addEventListener('click', (e) => {
      if (e.target.id === 'btn-refresh' || e.target.closest('#btn-refresh')) {
        this.loadMetrics();
        this.loadTrends();
        this.loadDataPoints();
        this.loadReports();
        this.showToast('🔄 Dashboard refreshed!', 'info');
      }
    });

    // Export
    document.addEventListener('click', (e) => {
      if (e.target.id === 'btn-export' || e.target.closest('#btn-export')) {
        this.exportCurrentDashboard();
      }
    });

    // Generate Report
    document.addEventListener('click', (e) => {
      if (e.target.id === 'btn-report' || e.target.closest('#btn-report')) {
        this.generateReport();
      }
    });
  }

  async exportCurrentDashboard() {
    try {
      const response = await fetch(`${this.apiBase}/metrics`);
      const data = await response.json();
      
      if (data.success) {
        let csv = 'Metric,Value\n';
        Object.entries(data.metrics).forEach(([category, metrics]) => {
          Object.entries(metrics).forEach(([key, value]) => {
            csv += `${category}.${key},${value}\n`;
          });
        });
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showToast('📥 Dashboard exported!', 'success');
      }
    } catch (error) {
      console.error('Error exporting dashboard:', error);
      this.showToast('❌ Error exporting dashboard', 'error');
    }
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 12px 24px;
      background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
      color: white;
      border-radius: 8px;
      z-index: 99999;
      animation: slideIn 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const dashboardUI = new AnalyticsDashboardUI({
    container: '#dashboard-container'
  });
  window.dashboardUI = dashboardUI;
});

// Add CSS
const style = document.createElement('style');
style.textContent = `
  .dashboard-interface { max-width: 1400px; margin: 0 auto; padding: 20px; }
  .dashboard-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px; }
  .dashboard-actions { display: flex; gap: 10px; flex-wrap: wrap; }
  .metrics-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 15px; margin: 20px 0; }
  .metric-card { transition: transform 0.3s; }
  .metric-card:hover { transform: translateY(-5px); box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important; }
  .charts-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(500px, 1fr)); gap: 20px; margin: 20px 0; }
  .chart-container { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
  .chart-container h4 { margin: 0 0 15px 0; color: #333; }
  .chart { min-height: 250px; display: flex; align-items: center; justify-content: center; }
  .chart canvas { width: 100% !important; height: auto !important; max-width: 100%; }
  .reports-section { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin: 20px 0; }
  .btn { padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-weight: 500; transition: background 0.3s; }
  .btn-primary { background: #4CAF50; color: white; }
  .btn-primary:hover { background: #388E3C; }
  .btn-secondary { background: #FF9800; color: white; }
  .btn-secondary:hover { background: #F57C00; }
  .btn-info { background: #2196F3; color: white; }
  .btn-info:hover { background: #1976D2; }
  @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @media (max-width: 768px) {
    .dashboard-header { flex-direction: column; align-items: stretch; }
    .dashboard-actions { justify-content: stretch; }
    .dashboard-actions .btn { flex: 1; }
    .charts-grid { grid-template-columns: 1fr; }
  }
`;
document.head.appendChild(style);