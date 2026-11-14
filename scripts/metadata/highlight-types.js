/**
 * Icon + label per `type` in data/highlights.json. Fully customizable:
 * use any of the predefined types below, or pass a custom `type` string —
 * it gets title-cased into a label automatically (e.g. "open-source-win"
 * → "Open Source Win"), optionally paired with your own `icon`. Only a
 * missing/empty `type` falls back to the generic "⭐ Highlight" tag.
 */
const HIGHLIGHT_TYPE_TAGS = {
  award: '🏆 Award',
  project: '🛠 Project',
  docs: '📚 Docs',
  talk: '🎤 Talk',
  video: '🎥 Video',
  course: '🎓 Course',
  pr: '🔀 Pull Request',
  review: '👀 Review',
  article: '📝 Article',
  publication: '📄 Publication',
  keynote: '🎙️ Keynote',
  panel: '🎙️ Panel',
  workshop: '🔧 Workshop',
  tutorial: '📖 Tutorial',
  guide: '🗺️ Guide',
  library: '📦 Library',
  tool: '⚙️ Tool',
  framework: '🏗️ Framework',
  feature: '✨ Feature',
  research: '🔬 Research',
  mentorship: '🤝 Mentorship',
  leadership: '👨‍💼 Leadership',
  maintainer: '🛡️ Maintainer',
  community: '🌍 Community',
  conference: '🎪 Conference',
  recognition: '🌟 Recognition',
  vulnerability: '🔐 Vulnerability',
  achievement: '🎯 Achievement',
  collaboration: '🤲 Collaboration',
};

const DEFAULT_HIGHLIGHT_ICON = '⭐';
const DEFAULT_HIGHLIGHT_TAG = '⭐ Highlight';

function labelFromType(type) {
  return type
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}

function tagForHighlightType(type, icon) {
  if (!type) return DEFAULT_HIGHLIGHT_TAG;
  if (HIGHLIGHT_TYPE_TAGS[type] && !icon) return HIGHLIGHT_TYPE_TAGS[type];
  return `${icon || DEFAULT_HIGHLIGHT_ICON} ${labelFromType(type)}`;
}

module.exports = {
  HIGHLIGHT_TYPE_TAGS,
  DEFAULT_HIGHLIGHT_TAG,
  DEFAULT_HIGHLIGHT_ICON,
  tagForHighlightType,
};
