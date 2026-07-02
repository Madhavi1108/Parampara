// utils/searchEngine.js

class SearchEngine {
  constructor() {
    // Inverted Index: term -> { docId: tf }
    this.invertedIndex = {};
    // Document lengths (for normalization if needed, though simple TF-IDF is fine)
    this.documentLengths = {};
    // Document Store: docId -> { type, data }
    this.documents = {};
    // Total documents count (N for IDF)
    this.docCount = 0;
    
    // Simple set of stop words
    this.stopWords = new Set([
      'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for', 'if', 'in', 
      'into', 'is', 'it', 'no', 'not', 'of', 'on', 'or', 'such', 'that', 'the', 
      'their', 'then', 'there', 'these', 'they', 'this', 'to', 'was', 'will', 'with'
    ]);
  }

  /**
   * Tokenizes and normalizes text
   */
  tokenize(text) {
    if (!text || typeof text !== 'string') return [];
    
    return text
      .toLowerCase()
      .replace(/[^\w\s\u0900-\u097F]/g, ' ') // Support English and Hindi/Marathi characters
      .split(/\s+/)
      .filter(token => token.length > 0 && !this.stopWords.has(token));
  }

  /**
   * Adds or updates a document in the index
   */
  addDocument(doc, type, indexableFields) {
    if (!doc || !doc.id) return;

    // If it already exists, remove it first to update
    if (this.documents[doc.id]) {
      this.removeDocument(doc.id);
    }

    // Combine text from indexable fields
    let combinedText = '';
    for (const field of indexableFields) {
      if (doc[field]) {
        if (Array.isArray(doc[field])) {
          combinedText += ' ' + doc[field].join(' ');
        } else {
          combinedText += ' ' + doc[field];
        }
      }
    }

    const tokens = this.tokenize(combinedText);
    const tokenCounts = {};
    
    for (const token of tokens) {
      tokenCounts[token] = (tokenCounts[token] || 0) + 1;
    }

    this.documents[doc.id] = { type, data: doc };
    this.documentLengths[doc.id] = tokens.length;
    this.docCount++;

    // Update Inverted Index with Term Frequency (TF)
    for (const [token, count] of Object.entries(tokenCounts)) {
      if (!this.invertedIndex[token]) {
        this.invertedIndex[token] = {};
      }
      // Simple TF: term count / total terms in document
      this.invertedIndex[token][doc.id] = count / tokens.length;
    }
  }

  /**
   * Removes a document from the index
   */
  removeDocument(docId) {
    if (!this.documents[docId]) return;

    // Remove from inverted index
    for (const token in this.invertedIndex) {
      if (this.invertedIndex[token][docId]) {
        delete this.invertedIndex[token][docId];
        
        // Clean up empty tokens
        if (Object.keys(this.invertedIndex[token]).length === 0) {
          delete this.invertedIndex[token];
        }
      }
    }

    delete this.documents[docId];
    delete this.documentLengths[docId];
    this.docCount--;
  }

  /**
   * Searches the index and returns ranked results
   */
  search(query, typeFilter = null) {
    if (!query || typeof query !== 'string') return [];

    const queryTokens = this.tokenize(query);
    if (queryTokens.length === 0) return [];

    const scores = {}; // docId -> score

    for (const token of queryTokens) {
      const docEntries = this.invertedIndex[token];
      if (!docEntries) continue;

      // Inverse Document Frequency (IDF)
      // Log(Total Documents / Documents with term)
      const docsWithTerm = Object.keys(docEntries).length;
      // Adding 1 to avoid division by zero or negative IDF
      const idf = Math.log(this.docCount / (1 + docsWithTerm)) + 1; 

      for (const [docId, tf] of Object.entries(docEntries)) {
        if (!scores[docId]) scores[docId] = 0;
        
        // TF-IDF Score
        scores[docId] += tf * idf;
      }
    }

    // Format and rank results
    const results = [];
    for (const [docId, score] of Object.entries(scores)) {
      const docEntry = this.documents[docId];
      if (!docEntry) continue;

      // Apply type filter if provided
      if (typeFilter && docEntry.type !== typeFilter) {
        continue;
      }

      results.push({
        ...docEntry.data,
        _score: score // Include relevance score
      });
    }

    // Sort by score descending
    results.sort((a, b) => b._score - a._score);
    return results;
  }
}

/**
 * Creates a proxy around an LRUCache to automatically index additions and deletions.
 */
function createSearchProxy(searchEngine, resourceType, indexableFields, cacheInstance) {
  const originalSet = cacheInstance.set.bind(cacheInstance);
  const originalDelete = cacheInstance.delete.bind(cacheInstance);
  const originalClear = cacheInstance.clear.bind(cacheInstance);
  
  cacheInstance.set = (key, value) => {
    originalSet(key, value);
    searchEngine.addDocument(value, resourceType, indexableFields);
  };
  
  cacheInstance.delete = (key) => {
    originalDelete(key);
    searchEngine.removeDocument(key);
  };
  
  cacheInstance.clear = () => {
    const allValues = cacheInstance.values();
    allValues.forEach(val => {
      searchEngine.removeDocument(val.id || 'unknown');
    });
    originalClear();
  };
  
  // Need to hook `push` as it's heavily used in Parampara
  const originalPush = cacheInstance.push.bind(cacheInstance);
  if (originalPush) {
    cacheInstance.push = (item) => {
      const key = item.id || Date.now().toString() + Math.random().toString(36).substr(2, 5);
      // Let set handle the indexing by calling our overridden set
      cacheInstance.set(key, item);
      return cacheInstance.length; // return new size
    };
  }
  
  return cacheInstance;
}

module.exports = {
  SearchEngine,
  createSearchProxy
};
