/**
 * HIGHLIGHTS PAGE (highlights.html) — a hand-curated reel, separate from the
 * landing page so description-heavy cards don't compete with the impact
 * numbers there. Generated unconditionally, same as Reports and Glossary,
 * so every fork has the same page structure and nav regardless of whether
 * data/highlights.json has entries yet — empty renders a plain message,
 * matching how the landing page's meters/focus sections already handle
 * having nothing to show.
 */
const fs = require('fs/promises');
const path = require('path');
const prettier = require('prettier');
const { dedent } = require('../../utils/dedent');
const {
  createNavHtml,
  createSkipToContentHtml,
  createBackToTopHtml,
  getBackToTopScript,
  SHARED_CHROME_CSS,
} = require('../../components/navbar');
const { createFooterHtml } = require('../../components/footer');
const { GITHUB_USERNAME, BASE_DIR } = require('../../config/config');
const { FAVICON_SVG_ENCODED, THEME_CSS_VARS } = require('../../config/constants');
const { getThemeInitScript, getThemeStyleVariant } = require('../../components/theme-init');
const { loadHighlights } = require('../../utils/highlights-loader');
const { tagForHighlightType } = require('../../metadata/highlight-types');

const HIGHLIGHTS_CSS = `
  ${THEME_CSS_VARS}
  .hl-list{position:relative;padding-left:22px;max-width:70ch}
  .hl-list::before{content:"";position:absolute;left:5px;top:6px;bottom:6px;width:2px;border-radius:2px;
    background:linear-gradient(var(--t-brand-line),var(--t-line))}
  .hl-card{position:relative;padding:0 0 34px 20px}
  .hl-card:last-child{padding-bottom:0}
  .hl-card::before{content:"";position:absolute;left:-24.5px;top:6px;width:11px;height:11px;border-radius:50%;
    background:var(--t-brand);border:2.5px solid var(--t-card)}
  .hl-tag{display:inline-flex;align-items:center;gap:4px;font-family:ui-monospace,monospace;font-size:.75rem;color:var(--t-accent);
    background:var(--t-card-2);border:1px solid var(--t-line);border-radius:999px;padding:2px 10px;margin-bottom:8px}
  .hl-title{font-size:1.2rem;font-weight:800;margin:0 0 4px;line-height:1.32}
  .hl-title a{color:var(--t-ink);text-decoration:none}
  .hl-title a:hover{color:var(--t-brand)}
  .hl-org{font-family:ui-monospace,monospace;font-size:.78rem;letter-spacing:.03em;color:var(--t-ink-3);margin-bottom:10px}
  .hl-desc{font-size:.92rem;color:var(--t-ink-2);line-height:1.6;max-width:60ch}
  .hl-empty-state{display:flex;align-items:center;justify-content:center;min-height:240px;border:2px dashed var(--t-brand-line);
    border-radius:12px;background:var(--t-brand-wash);padding:3rem 2rem;text-align:center}
  .hl-empty-state p{margin:0;font-size:.95rem;color:var(--t-ink-2)}
`;

function renderCard(entry) {
  const { title, url, org, year, description, type, icon } = entry;
  const titleHtml = url
    ? `<a href="${url}" target="_blank" rel="noopener noreferrer">${title}</a>`
    : title;
  const orgYear = [org, year].filter(Boolean).join(' · ');

  return dedent`
    <li class="hl-card">
      <span class="hl-tag">${tagForHighlightType(type, icon)}</span>
      <h3 class="hl-title">${titleHtml}</h3>
      ${orgYear ? `<div class="hl-org">${orgYear}</div>` : ''}
      ${description ? `<p class="hl-desc">${description}</p>` : ''}
    </li>
  `;
}

async function createHighlightsHtml() {
  const highlights = loadHighlights();

  const htmlBaseDir = path.join(BASE_DIR, 'html-generated');
  const outputPath = path.join(htmlBaseDir, 'highlights.html');

  await fs.mkdir(htmlBaseDir, { recursive: true });

  const navHtml = createNavHtml('./');
  const footerHtml = createFooterHtml();
  const cardsHtml =
    highlights.length > 0
      ? `<ul class="hl-list">${highlights.map(renderCard).join('')}</ul>`
      : `<div class="hl-empty-state"><p>No highlights at the moment.</p></div>`;

  const htmlContent = dedent`
    <!DOCTYPE html>
    <html lang="en" class="h-full">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Highlights | ${GITHUB_USERNAME} OSS Portfolio</title>
      <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,${FAVICON_SVG_ENCODED}">
      ${getThemeInitScript()}
      <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
      ${getThemeStyleVariant()}
      <style>${HIGHLIGHTS_CSS}${SHARED_CHROME_CSS}</style>
    </head>
    <body style="background-color: var(--t-surface); color: var(--t-ink);" class="antialiased flex flex-col h-full min-h-full">
      ${createSkipToContentHtml('main')}
      ${navHtml}
      <main id="main" class="grow w-full">
        <div class="px-6 sm:px-12 lg:px-16 xl:px-32 py-10">
          <div class="max-w-7xl mx-auto">
            <header class="mt-16 mb-16">
              <h1 style="color: var(--t-brand);" class="text-4xl sm:text-6xl font-black mb-6">Highlights</h1>
              <p class="text-xl max-w-2xl leading-relaxed" style="color: var(--t-ink-2);">
                A selection of top open source contributions, key projects, and meaningful moments — along with the stories behind them.
              </p>
            </header>
            ${cardsHtml}
          </div>
        </div>
      </main>
      ${footerHtml}
      ${createBackToTopHtml()}
      ${getBackToTopScript()}
    </body>
    </html>
  `;

  const formattedContent = await prettier.format(htmlContent, { parser: 'html' });
  await fs.writeFile(outputPath, formattedContent, 'utf8');

  console.log('Generated highlights page successfully at: ' + outputPath);
}

module.exports = { createHighlightsHtml };
