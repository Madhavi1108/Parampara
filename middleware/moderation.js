const Trie = require('../utils/Trie');
const { profanity, spamPhrases } = require('../config/profanity');

// Initialize the Trie globally so we don't rebuild it on every request
const moderationTrie = new Trie();
moderationTrie.build(profanity);
moderationTrie.build(spamPhrases);

/**
 * Express middleware for detecting profanity and spam using a Trie
 * @param {Object} options Options for moderation
 * @param {string} options.action 'block' or 'censor'
 * @param {Array<string>} options.fields Array of `req.body` fields to check (e.g. ['title', 'description', 'content'])
 */
const moderateContent = (options = { action: 'block', fields: [] }) => {
  return (req, res, next) => {
    if (!req.body) return next();

    let hasViolations = false;
    let violationMessage = '';

    for (const field of options.fields) {
      if (typeof req.body[field] === 'string') {
        const text = req.body[field];
        
        // Scan the text
        const result = moderationTrie.scan(text, { censor: options.action === 'censor' });

        if (!result.isClean) {
          if (options.action === 'block') {
            hasViolations = true;
            violationMessage = result.message;
            break;
          } else if (options.action === 'censor') {
            // Update the request body with the censored text
            req.body[field] = result.censoredText;
          }
        }
      }
    }

    if (hasViolations) {
      return res.status(422).json({
        error: 'Content Moderation Failed',
        message: violationMessage || 'Your submission contains prohibited content or spam.'
      });
    }

    next();
  };
};

module.exports = moderateContent;
