// public/scripts/marketplace.js

class MarketplaceUI {
  constructor(options = {}) {
    this.apiBase = options.apiBase || '/api/marketplace';
    this.userId = this.getUserId();
    this.container = options.container || '#marketplace-container';
    this.currentView = 'products';
    this.filters = {};
    
    this.init();
  }

  getUserId() {
    let userId = localStorage.getItem('userId');
    if (!userId) {
      userId = `user_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('userId', userId);
    }
    return userId;
  }

  init() {
    this.renderInterface();
    this.loadCategories();
    this.loadProducts();
    this.loadStats();
    this.loadCart();
    this.setupEventListeners();
    console.log('✅ Marketplace UI initialized');
  }

  renderInterface() {
    const container = document.querySelector(this.container);
    if (!container) return;

    container.innerHTML = `
      <div class="marketplace-interface">
        <div class="marketplace-header">
          <h2>🏺 Artisan Marketplace</h2>
          <div class="marketplace-actions">
            <button id="btn-cart" class="btn btn-info">
              🛒 Cart (<span id="cart-count">0</span>)
            </button>
            <button id="btn-artisans" class="btn btn-secondary">
              👥 Artisans
            </button>
            <button id="btn-products" class="btn btn-primary">
              📦 Products
            </button>
          </div>
        </div>

        <!-- Filters -->
        <div class="marketplace-filters">
          <input type="text" id="filter-search" placeholder="🔍 Search products..." />
          <select id="filter-category">
            <option value="">All Categories</option>
          </select>
          <select id="filter-sort">
            <option value="newest">Newest</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
            <option value="popular">Most Popular</option>
          </select>
          <button id="btn-apply-filters" class="btn btn-primary">Apply</button>
        </div>

        <!-- Products Grid -->
        <div id="products-grid" class="products-grid">
          <div class="loading">Loading products...</div>
        </div>

        <!-- Cart Modal -->
        <div class="modal" id="cart-modal" style="display: none;">
          <div class="modal-content">
            <span class="modal-close">&times;</span>
            <h3>🛒 Your Cart</h3>
            <div id="cart-items">
              <p>Your cart is empty</p>
            </div>
            <div id="cart-total" style="font-weight: bold; margin: 15px 0;"></div>
            <button id="btn-checkout" class="btn btn-success" style="display: none;">
              Proceed to Checkout
            </button>
          </div>
        </div>

        <!-- Artisan View -->
        <div id="artisans-view" style="display: none;">
          <h3>👥 Our Artisans</h3>
          <div id="artisans-grid" class="artisans-grid"></div>
        </div>
      </div>
    `;
  }

  async loadCategories() {
    try {
      const response = await fetch(`${this.apiBase}/categories`);
      const data = await response.json();

      if (data.success) {
        this.renderCategories(data.categories);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  renderCategories(categories) {
    const select = document.getElementById('filter-category');
    if (!select) return;

    categories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat.id;
      option.textContent = `${cat.icon} ${cat.name}`;
      select.appendChild(option);
    });
  }

  async loadProducts() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    this.setLoading(grid, true);

    try {
      const params = new URLSearchParams({
        ...this.filters,
        sortBy: document.getElementById('filter-sort')?.value || 'newest'
      });

      const response = await fetch(`${this.apiBase}/products?${params}`);
      const data = await response.json();

      if (data.success) {
        this.renderProducts(grid, data.products);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      grid.innerHTML = '<p class="error">❌ Failed to load products</p>';
    } finally {
      this.setLoading(grid, false);
    }
  }

  renderProducts(grid, products) {
    if (!products || products.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <p>📦 No products found</p>
          <p style="color: #666; font-size: 14px;">Check back later for new artisan products</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = `
      <div class="products-grid-layout">
        ${products.map(product => this.renderProductCard(product)).join('')}
      </div>
    `;
  }

  renderProductCard(product) {
    const discount = product.originalPrice ? 
      Math.round((1 - product.price / product.originalPrice) * 100) : 0;

    return `
      <div class="product-card" data-product-id="${product.id}" style="
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        transition: transform 0.3s, box-shadow 0.3s;
      ">
        <div style="position: relative;">
          <img src="${product.images?.[0] || 'https://via.placeholder.com/300'}" 
               alt="${product.name}" 
               style="width: 100%; height: 250px; object-fit: cover;" />
          ${discount > 0 ? `
            <span style="
              position: absolute;
              top: 10px;
              right: 10px;
              background: #f44336;
              color: white;
              padding: 4px 10px;
              border-radius: 20px;
              font-size: 12px;
            ">${discount}% OFF</span>
          ` : ''}
          ${product.featured ? `
            <span style="
              position: absolute;
              top: 10px;
              left: 10px;
              background: #FF9800;
              color: white;
              padding: 4px 10px;
              border-radius: 20px;
              font-size: 12px;
            ">⭐ Featured</span>
          ` : ''}
        </div>
        <div style="padding: 15px;">
          <h4 style="margin: 0 0 5px 0;">${product.name}</h4>
          <p style="color: #666; font-size: 14px; margin: 0 0 10px 0;">${product.description}</p>
          <div style="display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 10px;">
            ${product.craft ? `<span style="background: #e3f2fd; padding: 2px 10px; border-radius: 12px; font-size: 11px;">${product.craft}</span>` : ''}
            <span style="background: #f5f5f5; padding: 2px 10px; border-radius: 12px; font-size: 11px;">${product.material || ''}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <span style="font-size: 20px; font-weight: bold;">₹${product.price}</span>
              ${product.originalPrice ? `
                <span style="text-decoration: line-through; color: #999; font-size: 14px; margin-left: 8px;">
                  ₹${product.originalPrice}
                </span>
              ` : ''}
            </div>
            <div style="display: flex; align-items: center; gap: 5px;">
              <span style="color: #FFB300;">★</span>
              <span>${product.rating || 0}</span>
              <span style="color: #999; font-size: 12px;">(${product.totalReviews || 0})</span>
            </div>
          </div>
          <div style="margin-top: 10px; display: flex; gap: 8px;">
            <button onclick="window.marketplaceUI.addToCart('${product.id}')" style="
              flex: 1;
              padding: 8px;
              background: #4CAF50;
              color: white;
              border: none;
              border-radius: 5px;
              cursor: pointer;
            ">🛒 Add to Cart</button>
            <button onclick="window.marketplaceUI.viewProduct('${product.id}')" style="
              padding: 8px 15px;
              background: #2196F3;
              color: white;
              border: none;
              border-radius: 5px;
              cursor: pointer;
            ">View</button>
          </div>
          <div style="font-size: 12px; color: #888; margin-top: 8px;">
            ${product.stock > 0 ? `✅ In Stock (${product.stock})` : '❌ Out of Stock'}
          </div>
        </div>
      </div>
    `;
  }

  async loadArtisans() {
    try {
      const response = await fetch(`${this.apiBase}/artisans`);
      const data = await response.json();

      if (data.success) {
        this.renderArtisans(data.artisans);
      }
    } catch (error) {
      console.error('Error loading artisans:', error);
    }
  }

  renderArtisans(artisans) {
    const grid = document.getElementById('artisans-grid');
    if (!grid) return;

    grid.innerHTML = artisans.map(artisan => `
      <div class="artisan-card" style="
        background: white;
        padding: 20px;
        border-radius: 12px;
        text-align: center;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      ">
        <img src="${artisan.profileImage || 'https://via.placeholder.com/100'}" 
             alt="${artisan.name}" 
             style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover;" />
        <h4 style="margin: 10px 0 5px 0;">${artisan.name}</h4>
        <p style="color: #666; font-size: 14px;">${artisan.craft}</p>
        <p style="color: #888; font-size: 12px;">📍 ${artisan.location}</p>
        <div style="display: flex; justify-content: center; gap: 10px; margin: 10px 0;">
          <span>⭐ ${artisan.rating}</span>
          <span>📦 ${artisan.totalProducts} products</span>
          <span>🛒 ${artisan.totalSales} sales</span>
        </div>
        ${artisan.verified ? '<span style="color: #4CAF50;">✅ Verified Artisan</span>' : ''}
        <div style="margin-top: 10px;">
          <button onclick="window.marketplaceUI.viewArtisan('${artisan.id}')" style="
            padding: 5px 15px;
            background: #2196F3;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
          ">View Profile</button>
        </div>
      </div>
    `).join('');
  }

  async addToCart(productId) {
    try {
      const response = await fetch(`${this.apiBase}/cart/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: this.userId, productId, quantity: 1 })
      });

      const data = await response.json();

      if (data.success) {
        this.showToast('✅ Added to cart!', 'success');
        this.loadCart();
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      this.showToast('❌ Error adding to cart', 'error');
    }
  }

  async loadCart() {
    try {
      const response = await fetch(`${this.apiBase}/cart/${this.userId}`);
      const data = await response.json();

      if (data.success) {
        this.updateCartUI(data.cart, data.total);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  }

  updateCartUI(cart, total) {
    const countEl = document.getElementById('cart-count');
    if (countEl) {
      countEl.textContent = cart.length;
    }

    const itemsEl = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('btn-checkout');

    if (!itemsEl) return;

    if (cart.length === 0) {
      itemsEl.innerHTML = '<p>Your cart is empty</p>';
      if (totalEl) totalEl.textContent = '';
      if (checkoutBtn) checkoutBtn.style.display = 'none';
      return;
    }

    itemsEl.innerHTML = cart.map(item => `
      <div style="
        display: flex;
        justify-content: space-between;
        padding: 10px 0;
        border-bottom: 1px solid #eee;
      ">
        <div>
          <strong>${item.product.name}</strong>
          <div style="font-size: 12px; color: #666;">₹${item.product.price} x ${item.quantity}</div>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <span>₹${item.subtotal}</span>
          <button onclick="window.marketplaceUI.removeFromCart('${item.productId}')" style="
            padding: 2px 10px;
            background: #f44336;
            color: white;
            border: none;
            border-radius: 3px;
            cursor: pointer;
          ">✕</button>
        </div>
      </div>
    `).join('');

    if (totalEl) {
      totalEl.textContent = `Total: ₹${total}`;
    }

    if (checkoutBtn) {
      checkoutBtn.style.display = 'block';
      checkoutBtn.onclick = () => this.checkout();
    }
  }

  async removeFromCart(productId) {
    try {
      const response = await fetch(`${this.apiBase}/cart/remove`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: this.userId, productId })
      });

      const data = await response.json();

      if (data.success) {
        this.loadCart();
        this.showToast('Removed from cart', 'info');
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  }

  async checkout() {
    try {
      // In production: collect shipping address
      const shippingAddress = {
        street: '123 Heritage Street',
        city: 'Kolkata',
        state: 'West Bengal',
        pincode: '700001',
        country: 'India'
      };

      const response = await fetch(`${this.apiBase}/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.userId,
          orderData: {
            shippingAddress,
            paymentMethod: 'online'
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        this.showToast('✅ Order placed successfully!', 'success');
        document.getElementById('cart-modal').style.display = 'none';
        this.loadCart();
        this.loadStats();
      }
    } catch (error) {
      console.error('Error checking out:', error);
      this.showToast('❌ Error placing order', 'error');
    }
  }

  async loadStats() {
    try {
      const response = await fetch(`${this.apiBase}/stats`);
      const data = await response.json();

      if (data.success) {
        console.log('📊 Marketplace Stats:', data.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  viewProduct(productId) {
    window.location.href = `/marketplace/product/${productId}`;
  }

  viewArtisan(artisanId) {
    window.location.href = `/marketplace/artisan/${artisanId}`;
  }

  setupEventListeners() {
    // Toggle views
    document.addEventListener('click', (e) => {
      if (e.target.id === 'btn-products' || e.target.closest('#btn-products')) {
        document.getElementById('products-grid').style.display = 'block';
        document.getElementById('artisans-view').style.display = 'none';
        this.loadProducts();
      }
    });

    document.addEventListener('click', (e) => {
      if (e.target.id === 'btn-artisans' || e.target.closest('#btn-artisans')) {
        document.getElementById('products-grid').style.display = 'none';
        document.getElementById('artisans-view').style.display = 'block';
        this.loadArtisans();
      }
    });

    // Cart modal
    document.addEventListener('click', (e) => {
      if (e.target.id === 'btn-cart' || e.target.closest('#btn-cart')) {
        document.getElementById('cart-modal').style.display = 'flex';
        this.loadCart();
      }
    });

    // Modal close
    document.addEventListener('click', (e) => {
      if (e.target.closest('.modal-close') || 
          (e.target.closest('.modal') && !e.target.closest('.modal-content'))) {
        const modal = e.target.closest('.modal');
        if (modal) {
          modal.style.display = 'none';
        }
      }
    });

    // Apply filters
    document.addEventListener('click', (e) => {
      if (e.target.id === 'btn-apply-filters' || e.target.closest('#btn-apply-filters')) {
        this.filters = {
          search: document.getElementById('filter-search').value,
          category: document.getElementById('filter-category').value
        };
        this.loadProducts();
      }
    });

    // Search on Enter
    document.addEventListener('keypress', (e) => {
      if (e.target.id === 'filter-search' && e.key === 'Enter') {
        this.filters = {
          search: e.target.value,
          category: document.getElementById('filter-category').value
        };
        this.loadProducts();
      }
    });
  }

  setLoading(container, isLoading) {
    if (isLoading) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px;">
          <div style="display: inline-block; width: 40px; height: 40px; border: 3px solid #f3f3f3; border-top: 3px solid #4CAF50; border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <p style="margin-top: 10px;">Loading...</p>
        </div>
      `;
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
  const marketplaceUI = new MarketplaceUI({
    container: '#marketplace-container'
  });
  window.marketplaceUI = marketplaceUI;
});

// Add CSS
const style = document.createElement('style');
style.textContent = `
  .marketplace-interface { max-width: 1200px; margin: 0 auto; padding: 20px; }
  .marketplace-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px; }
  .marketplace-actions { display: flex; gap: 10px; flex-wrap: wrap; }
  .marketplace-filters { display: flex; gap: 15px; flex-wrap: wrap; margin-bottom: 20px; }
  .marketplace-filters input, .marketplace-filters select { padding: 10px 15px; border: 1px solid #ddd; border-radius: 8px; flex: 1; min-width: 150px; }
  .products-grid-layout { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
  .product-card:hover { transform: translateY(-5px); box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important; }
  .artisans-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; margin-top: 20px; }
  .artisan-card:hover { transform: translateY(-5px); box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important; }
  .empty-state { text-align: center; padding: 60px; color: #666; }
  .error { text-align: center; padding: 40px; color: #f44336; }
  .btn { padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-weight: 500; transition: background 0.3s; }
  .btn-primary { background: #4CAF50; color: white; }
  .btn-primary:hover { background: #388E3C; }
  .btn-secondary { background: #FF9800; color: white; }
  .btn-secondary:hover { background: #F57C00; }
  .btn-info { background: #2196F3; color: white; }
  .btn-info:hover { background: #1976D2; }
  .btn-success { background: #4CAF50; color: white; }
  .btn-success:hover { background: #388E3C; }
  .modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: none; justify-content: center; align-items: center; z-index: 99999; }
  .modal-content { background: white; padding: 30px; border-radius: 15px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto; position: relative; }
  .modal-close { position: absolute; top: 15px; right: 20px; font-size: 28px; cursor: pointer; color: #999; }
  @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @media (max-width: 768px) {
    .marketplace-header { flex-direction: column; align-items: stretch; }
    .marketplace-actions { justify-content: stretch; }
    .marketplace-actions .btn { flex: 1; }
    .marketplace-filters { flex-direction: column; }
    .products-grid-layout { grid-template-columns: 1fr; }
    .artisans-grid { grid-template-columns: 1fr; }
  }
`;
document.head.appendChild(style);