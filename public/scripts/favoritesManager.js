// Favorites Manager Utility
// Handles storing and retrieving favorite cultural items in localStorage

const FavoritesManager = {
  STORAGE_KEY: 'parampara_favorites',

  // Get all favorited item IDs
  getFavorites: function () {
    const favs = localStorage.getItem(this.STORAGE_KEY);
    return favs ? JSON.parse(favs) : [];
  },

  // Check if an item is favorited
  isFavorite: function (itemId) {
    const favs = this.getFavorites();
    return favs.includes(itemId);
  },

  // Add an item to favorites
  addFavorite: function (itemId) {
    const favs = this.getFavorites();
    if (!favs.includes(itemId)) {
      favs.push(itemId);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(favs));
      this.dispatchUpdateEvent();
    }
  },

  // Remove an item from favorites
  removeFavorite: function (itemId) {
    let favs = this.getFavorites();
    favs = favs.filter((id) => id !== itemId);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(favs));
    this.dispatchUpdateEvent();
  },

  // Toggle favorite status
  toggleFavorite: function (itemId) {
    if (this.isFavorite(itemId)) {
      this.removeFavorite(itemId);
    } else {
      this.addFavorite(itemId);
    }
  },

  // Reorder favorites (overwrites the whole list)
  reorderFavorites: function (newOrderArray) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newOrderArray));
    // No event dispatch needed here because this happens during/after UI reordering
  },

  // Dispatch event so UI can update
  dispatchUpdateEvent: function () {
    const event = new CustomEvent('favoritesUpdated');
    window.dispatchEvent(event);
  },
};

// Initialize empty array if none exists
if (!localStorage.getItem(FavoritesManager.STORAGE_KEY)) {
  localStorage.setItem(FavoritesManager.STORAGE_KEY, JSON.stringify([]));
}

// Attach to window object for inline onclick handlers
window.FavoritesManager = FavoritesManager;
