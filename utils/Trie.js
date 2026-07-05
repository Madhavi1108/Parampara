class TrieNode {
  constructor() {
    this.children = new Map();
    this.isEndOfWord = false;
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  insert(word) {
    let node = this.root;
    // Normalize word before inserting
    const normalizedWord = this.normalize(word, true);
    for (const char of normalizedWord) {
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode());
      }
      node = node.children.get(char);
    }
    node.isEndOfWord = true;
  }

  build(dictionary) {
    if (Array.isArray(dictionary)) {
      dictionary.forEach(word => this.insert(word));
    }
  }

  normalize(text, removeSpaces = false) {
    let normalized = text.toLowerCase()
      .replace(/@/g, 'a')
      .replace(/0/g, 'o')
      .replace(/1/g, 'i')
      .replace(/3/g, 'e')
      .replace(/5/g, 's')
      .replace(/7/g, 't');
      
    if (removeSpaces) {
      normalized = normalized.replace(/\s+/g, '');
    }
    
    return normalized;
  }

  hasExcessiveRepetition(text) {
    // Detect if any character is repeated more than 5 times consecutively
    return /(.)\1{5,}/.test(text);
  }

  scan(text, options = { censor: false }) {
    if (this.hasExcessiveRepetition(text)) {
      return { 
        isClean: false, 
        message: 'Spam detected: excessive character repetition.', 
        censoredText: text 
      };
    }

    let isClean = true;
    let censoredText = text;
    // We normalize the text. We do NOT remove spaces for the main search
    // to preserve character indices for censoring. However, advanced evasions
    // like "b a d w o r d" can bypass this. For basic needs, this sliding window works.
    let normalized = this.normalize(text);
    
    // Sliding window prefix search
    for (let i = 0; i < normalized.length; i++) {
      let node = this.root;
      let matchLength = 0;
      let j = i;
      let longestMatch = -1;

      // Traverse the Trie
      while (j < normalized.length) {
        // Skip spaces if trying to match a multi-word phrase or evading spacing
        let char = normalized[j];
        
        if (node.children.has(char)) {
          node = node.children.get(char);
          matchLength++;
          if (node.isEndOfWord) {
            longestMatch = matchLength;
          }
          j++;
        } else if (char === ' ') {
          // If the char is a space, we can optionally skip it in our search path
          // to catch "b a d". For simplicity, we just count it if it's part of the dictionary.
          // In a strict trie, if the dictionary has spaces, it will match.
          // If not, it stops.
          break;
        } else {
          break;
        }
      }

      if (longestMatch !== -1) {
        isClean = false;
        if (options.censor) {
          // Replace matched substring in original text
          const before = censoredText.slice(0, i);
          const after = censoredText.slice(i + longestMatch);
          const asterisks = '*'.repeat(longestMatch);
          censoredText = before + asterisks + after;
          
          // Keep normalized string in sync with length
          normalized = normalized.slice(0, i) + asterisks + normalized.slice(i + longestMatch);
          
          i += longestMatch - 1; // Skip ahead
        } else {
          return { 
            isClean: false, 
            message: 'Inappropriate content detected.', 
            censoredText 
          };
        }
      }
    }

    return { 
      isClean, 
      message: isClean ? 'Clean' : 'Inappropriate content replaced.', 
      censoredText 
    };
  }
}

module.exports = Trie;
