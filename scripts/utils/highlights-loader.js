const fs = require('fs');
const path = require('path');

const HIGHLIGHTS_PATH = path.join('data', 'highlights.json');

/**
 * data/highlights.json is hand-curated, demo-only content — absent on main
 * and every fresh fork. Every page that touches highlights (nav, landing
 * teaser, the highlights page itself) reads it independently through this
 * loader rather than having it threaded in as a parameter, the same way
 * navbar.js already reads config directly instead of taking it as an arg.
 */
let cached = null;

function loadHighlights() {
  if (cached !== null) return cached;

  try {
    const raw = fs.readFileSync(HIGHLIGHTS_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    cached = Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    if (e.code !== 'ENOENT') {
      console.warn(`Failed to read ${HIGHLIGHTS_PATH}, treating as empty: ${e.message}`);
    }
    cached = [];
  }

  return cached;
}

module.exports = { loadHighlights };
