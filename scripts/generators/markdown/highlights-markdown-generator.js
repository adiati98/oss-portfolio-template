const fs = require('fs/promises');
const path = require('path');
const { BASE_DIR } = require('../../config/config');
const { loadHighlights } = require('../../utils/highlights-loader');
const { tagForHighlightType } = require('../../metadata/highlight-types');

const MARKDOWN_OUTPUT_DIR_NAME = 'markdown-generated';
const MARKDOWN_HIGHLIGHTS_FILENAME = 'highlights.md';
const MARKDOWN_README_FILENAME = 'README.md';

function renderEntry(entry) {
  const { title, url, org, year, description, type, icon } = entry;
  const titleMd = url ? `[${title}](${url})` : title;
  const orgYear = [org, year].filter(Boolean).join(' · ');

  let block = `### ${tagForHighlightType(type, icon)} — ${titleMd}\n\n`;
  if (orgYear) block += `${orgYear}\n\n`;
  if (description) block += `${description}\n\n`;
  return block;
}

async function createHighlightsMarkdown() {
  const highlights = loadHighlights();

  const markdownBaseDir = path.join(BASE_DIR, MARKDOWN_OUTPUT_DIR_NAME);
  const outputPath = path.join(markdownBaseDir, MARKDOWN_HIGHLIGHTS_FILENAME);

  await fs.mkdir(markdownBaseDir, { recursive: true });

  const generatedAt = new Date().toLocaleString();
  const bodyMarkdown =
    highlights.length > 0
      ? `${highlights.map(renderEntry).join('---\n\n')}---\n\n`
      : '> _No highlights at the moment._\n\n---\n\n';

  const markdown = `# ⭐ Highlights

A selection of top open source contributions, key projects, and meaningful moments — along with the stories behind them.

---

${bodyMarkdown}[← Back to Summary](./${MARKDOWN_README_FILENAME}) | *Last updated: ${generatedAt}*
`;

  await fs.writeFile(outputPath, markdown, 'utf8');

  console.log(`Generated highlights page successfully at: ${outputPath}`);
}

module.exports = { createHighlightsMarkdown };
