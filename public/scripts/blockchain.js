// public/scripts/blockchain.js

class BlockchainUI {
  constructor(options = {}) {
    this.apiBase = options.apiBase || '/api/blockchain';
    this.userId = this.getUserId();
    this.container = options.container || '#blockchain-container';
    this.currentView = 'explorer';
    
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
    this.loadStats();
    this.loadBlockchain();
    this.loadNFTs();
    this.setupEventListeners();
    console.log('✅ Blockchain UI initialized');
  }

  renderInterface() {
    const container = document.querySelector(this.container);
    if (!container) return;

    container.innerHTML = `
      <div class="blockchain-interface">
        <div class="blockchain-header">
          <h2>🔗 Cultural Heritage Blockchain</h2>
          <div class="blockchain-actions">
            <button id="btn-mint" class="btn btn-primary">🎨 Mint NFT</button>
            <button id="btn-explorer" class="btn btn-info">🔍 Explorer</button>
            <button id="btn-marketplace" class="btn btn-secondary">🛒 Marketplace</button>
            <button id="btn-validate" class="btn btn-success">✅ Validate</button>
          </div>
        </div>

        <!-- Stats -->
        <div class="blockchain-stats" id="blockchain-stats">
          <div class="loading">Loading stats...</div>
        </div>

        <!-- Blockchain Explorer -->
        <div id="explorer-view">
          <h3>📊 Blockchain Explorer</h3>
          <div id="blocks-list" class="blocks-list">
            <div class="loading">Loading blocks...</div>
          </div>
        </div>

        <!-- NFT Marketplace -->
        <div id="marketplace-view" style="display: none;">
          <h3>🛒 NFT Marketplace</h3>
          <div class="marketplace-filters">
            <select id="nft-filter-category">
              <option value="">All Categories</option>
              <option value="textile">Textile</option>
              <option value="metal_art">Metal Art</option>
              <option value="painting">Painting</option>
              <option value="sculpture">Sculpture</option>
            </select>
            <select id="nft-filter-status">
              <option value="">All Status</option>
              <option value="available">Available</option>
              <option value="listed">Listed</option>
              <option value="transferred">Transferred</option>
            </select>
            <button id="btn-apply-nft-filters" class="btn btn-primary">Apply</button>
          </div>
          <div id="nfts-grid" class="nfts-grid">
            <div class="loading">Loading NFTs...</div>
          </div>
        </div>

        <!-- Mint NFT Modal -->
        <div class="modal" id="mint-modal" style="display: none;">
          <div class="modal-content">
            <span class="modal-close">&times;</span>
            <h3>🎨 Mint Cultural NFT</h3>
            <form id="mint-form">
              <div class="form-group">
                <label>Name *</label>
                <input type="text" id="nft-name" required />
              </div>
              <div class="form-group">
                <label>Description *</label>
                <textarea id="nft-description" rows="3" required></textarea>
              </div>
              <div class="form-group">
                <label>Category *</label>
                <select id="nft-category" required>
                  <option value="">Select category...</option>
                  <option value="textile">Textile</option>
                  <option value="metal_art">Metal Art</option>
                  <option value="painting">Painting</option>
                  <option value="sculpture">Sculpture</option>
                  <option value="jewelry">Jewelry</option>
                  <option value="ceramics">Ceramics</option>
                </select>
              </div>
              <div class="form-group">
                <label>Price (ETH)</label>
                <input type="number" id="nft-price" step="0.1" value="1.0" />
              </div>
              <div class="form-group">
                <label>Royalty Percentage (%)</label>
                <input type="number" id="nft-royalty" min="0" max="20" value="10" />
              </div>
              <div class="form-group">
                <label>Provenance</label>
                <input type="text" id="nft-provenance" placeholder="Origin and history of the artifact" />
              </div>
              <button type="submit" class="btn btn-primary">Mint NFT</button>
            </form>
          </div>
        </div>
      </div>
    `;
  }

  async loadStats() {
    try {
      const response = await fetch(`${this.apiBase}/stats`);
      const data = await response.json();

      if (data.success) {
        this.renderStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  renderStats(stats) {
    const container = document.getElementById('blockchain-stats');
    if (!container) return;

    container.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${stats.totalBlocks}</div>
          <div class="stat-label">Total Blocks</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.totalNFTs}</div>
          <div class="stat-label">Total NFTs</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.verifiedNFTs}</div>
          <div class="stat-label">Verified NFTs</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.listedNFTs}</div>
          <div class="stat-label">Listed NFTs</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.totalValue.toFixed(2)} ETH</div>
          <div class="stat-label">Total Value</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.totalTransactions}</div>
          <div class="stat-label">Transactions</div>
        </div>
      </div>
    `;
  }

  async loadBlockchain() {
    try {
      const response = await fetch(`${this.apiBase}/blockchain`);
      const data = await response.json();

      if (data.success) {
        this.renderBlocks(data.blockchain);
      }
    } catch (error) {
      console.error('Error loading blockchain:', error);
    }
  }

  renderBlocks(blocks) {
    const container = document.getElementById('blocks-list');
    if (!container) return;

    const reversed = [...blocks].reverse();
    
    container.innerHTML = `
      <div class="blocks-list-content">
        ${reversed.map(block => `
          <div class="block-card" style="
            background: white;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 10px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            border-left: 4px solid #4CAF50;
          ">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong>Block #${block.index}</strong>
                <span style="margin-left: 10px; font-size: 12px; color: #888;">
                  ${block.timestamp}
                </span>
              </div>
              <span style="background: #e3f2fd; padding: 2px 10px; border-radius: 12px; font-size: 11px;">
                ${block.transactions.length} txns
              </span>
            </div>
            <div style="font-size: 12px; color: #666; margin-top: 5px;">
              <span>Hash: ${block.hash.slice(0, 16)}...</span>
              <span style="margin-left: 15px;">Validator: ${block.validator}</span>
            </div>
            ${block.transactions.length > 0 ? `
              <div style="margin-top: 8px; font-size: 12px;">
                ${block.transactions.map(tx => 
                  `<span style="background: #f5f5f5; padding: 2px 8px; border-radius: 12px; margin: 2px;">
                    ${tx.type || 'Transaction'}
                  </span>`
                ).join('')}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  async loadNFTs() {
    try {
      const response = await fetch(`${this.apiBase}/nfts`);
      const data = await response.json();

      if (data.success) {
        this.renderNFTs(data.nfts);
      }
    } catch (error) {
      console.error('Error loading NFTs:', error);
    }
  }

  renderNFTs(nfts) {
    const container = document.getElementById('nfts-grid');
    if (!container) return;

    if (!nfts || nfts.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>🎨 No NFTs minted yet</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="nfts-grid-layout">
        ${nfts.map(nft => `
          <div class="nft-card" style="
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            transition: transform 0.3s;
          ">
            <img src="${nft.metadata.image || 'https://via.placeholder.com/300'}" 
                 alt="${nft.name}" 
                 style="width: 100%; height: 200px; object-fit: cover;" />
            <div style="padding: 15px;">
              <h4 style="margin: 0 0 5px 0;">${nft.name}</h4>
              <p style="color: #666; font-size: 14px;">${nft.description}</p>
              <div style="display: flex; gap: 5px; flex-wrap: wrap; margin: 10px 0;">
                ${nft.metadata.attributes ? nft.metadata.attributes.map(attr => `
                  <span style="background: #f5f5f5; padding: 2px 10px; border-radius: 12px; font-size: 11px;">
                    ${attr.trait_type}: ${attr.value}
                  </span>
                `).join('') : ''}
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <span style="font-size: 18px; font-weight: bold;">${nft.price} ETH</span>
                </div>
                <div>
                  ${nft.verified ? '✅' : '❌'}
                  <span style="font-size: 12px; color: #888;">
                    ${nft.verified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
              </div>
              <div style="margin-top: 10px; display: flex; gap: 8px;">
                ${nft.status === 'listed' ? `
                  <button onclick="window.blockchainUI.buyNFT('${nft.tokenId}')" style="
                    flex: 1;
                    padding: 8px;
                    background: #4CAF50;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                  ">Buy</button>
                ` : nft.status === 'available' ? `
                  <button onclick="window.blockchainUI.listNFT('${nft.tokenId}')" style="
                    flex: 1;
                    padding: 8px;
                    background: #FF9800;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                  ">List for Sale</button>
                ` : ''}
                ${nft.owner === this.userId ? `
                  <button onclick="window.blockchainUI.transferNFT('${nft.tokenId}')" style="
                    flex: 1;
                    padding: 8px;
                    background: #2196F3;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                  ">Transfer</button>
                ` : ''}
              </div>
              <div style="font-size: 11px; color: #888; margin-top: 8px;">
                Owner: ${nft.owner.slice(0, 8)}...
                ${nft.creator !== nft.owner ? ` | Creator: ${nft.creator.slice(0, 8)}...` : ''}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  async mintNFT(event) {
    event.preventDefault();

    const nftData = {
      name: document.getElementById('nft-name').value,
      description: document.getElementById('nft-description').value,
      category: document.getElementById('nft-category').value,
      price: parseFloat(document.getElementById('nft-price').value),
      royaltyPercentage: parseFloat(document.getElementById('nft-royalty').value),
      provenance: document.getElementById('nft-provenance').value || 'Digital heritage artifact',
      image: 'https://via.placeholder.com/500',
      attributes: [
        { trait_type: 'Creator', value: this.userId },
        { trait_type: 'Minted Date', value: new Date().toISOString().split('T')[0] },
        { trait_type: 'Category', value: document.getElementById('nft-category').value }
      ]
    };

    try {
      const response = await fetch(`${this.apiBase}/nft/mint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artifactData: nftData,
          userId: this.userId
        })
      });

      const data = await response.json();

      if (data.success) {
        this.showToast('✅ NFT minted successfully!', 'success');
        document.getElementById('mint-modal').style.display = 'none';
        document.getElementById('mint-form').reset();
        this.loadStats();
        this.loadNFTs();
        this.loadBlockchain();
      }
    } catch (error) {
      console.error('Error minting NFT:', error);
      this.showToast('❌ Error minting NFT', 'error');
    }
  }

  async listNFT(tokenId) {
    const price = prompt('Enter price in ETH:');
    if (!price) return;

    try {
      const response = await fetch(`${this.apiBase}/nft/list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId, price: parseFloat(price) })
      });

      const data = await response.json();

      if (data.success) {
        this.showToast('✅ NFT listed for sale!', 'success');
        this.loadNFTs();
      }
    } catch (error) {
      console.error('Error listing NFT:', error);
      this.showToast('❌ Error listing NFT', 'error');
    }
  }

  async buyNFT(tokenId) {
    const confirm = window.confirm(`Buy this NFT for the listed price?`);
    if (!confirm) return;

    try {
      const response = await fetch(`${this.apiBase}/nft/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId,
          buyerId: this.userId,
          amount: 1.0 // In production, use actual amount
        })
      });

      const data = await response.json();

      if (data.success) {
        this.showToast('✅ NFT purchased successfully!', 'success');
        this.loadNFTs();
        this.loadStats();
      }
    } catch (error) {
      console.error('Error buying NFT:', error);
      this.showToast('❌ Error buying NFT', 'error');
    }
  }

  async transferNFT(tokenId) {
    const toUserId = prompt('Enter recipient user ID:');
    if (!toUserId) return;

    try {
      const response = await fetch(`${this.apiBase}/nft/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId,
          fromUserId: this.userId,
          toUserId
        })
      });

      const data = await response.json();

      if (data.success) {
        this.showToast('✅ NFT transferred successfully!', 'success');
        this.loadNFTs();
      }
    } catch (error) {
      console.error('Error transferring NFT:', error);
      this.showToast('❌ Error transferring NFT', 'error');
    }
  }

  async validateBlockchain() {
    try {
      const response = await fetch(`${this.apiBase}/validate`);
      const data = await response.json();

      if (data.success) {
        const validation = data.validation;
        if (validation.valid) {
          this.showToast('✅ Blockchain is valid!', 'success');
        } else {
          this.showToast(`❌ Blockchain invalid: ${validation.error}`, 'error');
        }
      }
    } catch (error) {
      console.error('Error validating blockchain:', error);
      this.showToast('❌ Error validating blockchain', 'error');
    }
  }

  setupEventListeners() {
    // Mint NFT button
    document.addEventListener('click', (e) => {
      if (e.target.id === 'btn-mint' || e.target.closest('#btn-mint')) {
        document.getElementById('mint-modal').style.display = 'flex';
      }
    });

    // Explorer view
    document.addEventListener('click', (e) => {
      if (e.target.id === 'btn-explorer' || e.target.closest('#btn-explorer')) {
        document.getElementById('explorer-view').style.display = 'block';
        document.getElementById('marketplace-view').style.display = 'none';
        this.loadBlockchain();
      }
    });

    // Marketplace view
    document.addEventListener('click', (e) => {
      if (e.target.id === 'btn-marketplace' || e.target.closest('#btn-marketplace')) {
        document.getElementById('explorer-view').style.display = 'none';
        document.getElementById('marketplace-view').style.display = 'block';
        this.loadNFTs();
      }
    });

    // Validate blockchain
    document.addEventListener('click', (e) => {
      if (e.target.id === 'btn-validate' || e.target.closest('#btn-validate')) {
        this.validateBlockchain();
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

    // Mint form submit
    document.addEventListener('submit', (e) => {
      if (e.target.id === 'mint-form') {
        e.preventDefault();
        this.mintNFT(e);
      }
    });

    // NFT filters
    document.addEventListener('click', (e) => {
      if (e.target.id === 'btn-apply-nft-filters' || e.target.closest('#btn-apply-nft-filters')) {
        const category = document.getElementById('nft-filter-category').value;
        const status = document.getElementById('nft-filter-status').value;
        this.loadNFTsWithFilters(category, status);
      }
    });
  }

  async loadNFTsWithFilters(category, status) {
    try {
      let url = `${this.apiBase}/nfts?`;
      if (category) url += `category=${category}&`;
      if (status) url += `status=${status}&`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        this.renderNFTs(data.nfts);
      }
    } catch (error) {
      console.error('Error loading NFTs with filters:', error);
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
  const blockchainUI = new BlockchainUI({
    container: '#blockchain-container'
  });
  window.blockchainUI = blockchainUI;
});

// Add CSS
const style = document.createElement('style');
style.textContent = `
  .blockchain-interface { max-width: 1200px; margin: 0 auto; padding: 20px; }
  .blockchain-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px; }
  .blockchain-actions { display: flex; gap: 10px; flex-wrap: wrap; }
  .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 15px; margin: 20px 0; }
  .stat-card { background: white; padding: 15px; border-radius: 8px; text-align: center; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
  .stat-value { font-size: 2em; font-weight: bold; color: #2E7D32; }
  .nfts-grid-layout { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; margin: 20px 0; }
  .nft-card:hover { transform: translateY(-5px); box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important; }
  .blocks-list-content { margin: 20px 0; }
  .block-card:hover { transform: translateX(5px); }
  .marketplace-filters { display: flex; gap: 15px; flex-wrap: wrap; margin: 15px 0; }
  .marketplace-filters select, .marketplace-filters input { padding: 10px 15px; border: 1px solid #ddd; border-radius: 8px; }
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
  .form-group { margin-bottom: 15px; }
  .form-group label { display: block; margin-bottom: 5px; font-weight: 500; }
  .form-group input, .form-group textarea, .form-group select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; }
  .loading { text-align: center; padding: 40px; color: #666; }
  .empty-state { text-align: center; padding: 40px; color: #666; }
  @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @media (max-width: 768px) {
    .blockchain-header { flex-direction: column; align-items: stretch; }
    .blockchain-actions { justify-content: stretch; }
    .blockchain-actions .btn { flex: 1; }
    .nfts-grid-layout { grid-template-columns: 1fr; }
  }
`;
document.head.appendChild(style);