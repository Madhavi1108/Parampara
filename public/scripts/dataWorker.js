self.onmessage = function (e) {
  const { action, payload, jobId } = e.data;

  try {
    if (action === 'filterGalleryItems') {
      const { items, typeFilter, searchTerm } = payload;
      
      let filtered = items;
      
      if (typeFilter && typeFilter !== 'all') {
        filtered = filtered.filter((item) => item.type === typeFilter);
      }
      
      if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        filtered = filtered.filter(
          (item) =>
            (item.title && item.title.toLowerCase().includes(lowerSearch)) ||
            (item.description && item.description.toLowerCase().includes(lowerSearch)) ||
            (item.location && item.location.toLowerCase().includes(lowerSearch)) ||
            (item.tags && item.tags.some((tag) => tag.toLowerCase().includes(lowerSearch)))
        );
      }
      
      self.postMessage({ jobId, success: true, result: filtered });
    } else if (action === 'filterKnowledgeVault') {
      const { items, activeCategory, search } = payload;
      const filtered = items.filter((entry) => {
        const matchesCategory = activeCategory === 'all' || entry.category === activeCategory;
        const matchesSearch =
          !search ||
          (entry.title && entry.title.toLowerCase().includes(search)) ||
          (entry.village && entry.village.toLowerCase().includes(search)) ||
          (entry.region && entry.region.toLowerCase().includes(search)) ||
          (entry.elderName && entry.elderName.toLowerCase().includes(search)) ||
          (entry.category && entry.category.toLowerCase().includes(search)) ||
          (entry.description && entry.description.toLowerCase().includes(search));
        return matchesCategory && matchesSearch;
      });
      self.postMessage({ jobId, success: true, result: filtered });
    } else if (action === 'filterArtisans') {
      const { items, search, craft, village, region, experience } = payload;
      
      const experienceLevel = (years) => {
        if (years <= 5) return 'apprentice';
        if (years <= 15) return 'skilled';
        if (years <= 30) return 'master';
        return 'keeper';
      };

      const filtered = items.filter(a => {
        const matchesSearch = (a.name && a.name.toLowerCase().includes(search)) || (a.craft && a.craft.toLowerCase().includes(search));
        const matchesCraft = craft === '' || a.craft === craft;
        const matchesVillage = village === '' || a.village === village;
        const matchesRegion = region === '' || a.region === region;
        const matchesExp = experience === '' || experienceLevel(a.experience) === experience;
        return matchesSearch && matchesCraft && matchesVillage && matchesRegion && matchesExp;
      });
      self.postMessage({ jobId, success: true, result: filtered });
    } else if (action === 'filterTimelineEvents') {
      const { items, search, category } = payload;
      const filtered = items.filter((event) => {
        const matchesSearch =
          !search ||
          (event.item && event.item.toLowerCase().includes(search)) ||
          (event.title && event.title.toLowerCase().includes(search)) ||
          (event.description && event.description.toLowerCase().includes(search));
        
        const matchesCategory = category === 'all' || event.type === category;
        return matchesSearch && matchesCategory;
      });
      self.postMessage({ jobId, success: true, result: filtered });
    } else if (action === 'filterLostTraditions') {
      const { items, search, category, state, status } = payload;
      const filtered = items.filter((t) => {
        const matchesSearch =
          !search ||
          (t.title && t.title.toLowerCase().includes(search)) ||
          (t.village && t.village.toLowerCase().includes(search)) ||
          (t.category && t.category.toLowerCase().includes(search));

        const matchesCategory = category === 'all' || t.category === category;
        const matchesState = state === 'all' || t.state === state;
        const matchesStatus = status === 'all' || t.revivalStatus === status;

        return matchesSearch && matchesCategory && matchesState && matchesStatus;
      });
      self.postMessage({ jobId, success: true, result: filtered });
    } else if (action === 'sortItems') {
      const { items, sortBy, order } = payload;
      let sorted = [...items];
      
      sorted.sort((a, b) => {
        let valA = a[sortBy];
        let valB = b[sortBy];
        
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        
        if (valA < valB) return order === 'asc' ? -1 : 1;
        if (valA > valB) return order === 'asc' ? 1 : -1;
        return 0;
      });
      
      self.postMessage({ jobId, success: true, result: sorted });
    } else {
      self.postMessage({ jobId, success: false, error: 'Unknown action' });
    }
  } catch (error) {
    self.postMessage({ jobId, success: false, error: error.message });
  }
};
