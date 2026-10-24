const fs = require('fs/promises');
const path = require('path');
const prettier = require('prettier');
const { dedent } = require('../../utils/dedent');
const { GITHUB_USERNAME, BASE_DIR } = require('../../config/config');
const {
  formatDate,
  calculatePeriodInDays,
  getPrStatusContent,
  getCollaborationStatusContent,
} = require('../../utils/contribution-formatters');

// Import navbar and footer
const {
  createNavHtml,
  createSkipToContentHtml,
  createBackToTopHtml,
  getBackToTopScript,
  SHARED_CHROME_CSS,
} = require('../../components/navbar');
const { createFooterHtml } = require('../../components/footer');

const { getReportStyleCss } = require('../css/style-generator');
const {
  LEFT_ARROW_SVG,
  RIGHT_ARROW_SVG,
  SEARCH_SVG,
  LANDING_PAGE_ICONS,
  FAVICON_SVG_ENCODED,
} = require('../../config/constants');
const { getThemeInitScript, getThemeStyleVariant } = require('../../components/theme-init');
const { sanitizeAttribute } = require('../../utils/html-helpers');

// Status badge colors route straight through the theme engine's semantic
// ladder (see theme-engine.js) — no hex, no fallback chain. MERGED uses the
// `merged` ladder (GitHub's own merged-PR purple), matching GitHub's own
// status color instead of sharing OPEN's green.
const STATUS_BADGE_TOKENS = {
  OPEN: { bg: 'var(--t-positive-wash)', text: 'var(--t-positive)' },
  MERGED: { bg: 'var(--t-merged-wash)', text: 'var(--t-merged)' },
  CLOSED: { bg: 'var(--t-critical-wash)', text: 'var(--t-critical)' },
};
const DEFAULT_STATUS_BADGE = { bg: 'var(--t-neutral-wash)', text: 'var(--t-neutral)' };

// Supplements getReportStyleCss (shared, not owned by this generator) with
// the row-stripe classes (replacing a per-row inline style) and small-screen
// data-label attribute already styled by the shared stylesheet's table CSS.
const QUARTERLY_EXTRA_CSS = `
  .qr-ink2{color:var(--t-ink-2)}
  .qr-surface2{background-color:var(--t-card-2)}
  .qr-nav-card{background-color:var(--t-card)}
  .qr-link{color:var(--t-brand)}
  .qr-link:hover{color:var(--t-brand-strong)}
  .qr-link:focus-visible{outline:2px solid var(--t-brand);outline-offset:2px}
  .qr-repo{font-family:ui-monospace,monospace;font-size:.75rem;color:var(--t-ink-2);background:var(--t-card-2);border:1px solid var(--t-line);border-radius:5px;padding:2px 7px}

  /* Row stripes as shared classes instead of a per-row inline transition. */
  .qr-row-a, .qr-row-b { transition: background-color 0.15s ease-in-out; }
  .qr-row-a { background-color: var(--t-card); }
  .qr-row-b { background-color: var(--t-card-2); }
  .qr-row-a:hover, .qr-row-b:hover { background-color: var(--t-brand-wash) !important; }

  @media (prefers-reduced-motion: reduce) {
    .qr-link, .qr-row-a, .qr-row-b { transition: none !important; }
  }
`;

/**
 * Generates and writes individual HTML report files for each quarter's contributions.
 * @param {Object} groupedContributions - Data grouped by quarter (e.g., {'2023-Q1': {...}}).
 * @returns {Array<Object>} List of created report file paths and contribution totals.
 */
async function writeHtmlFiles(groupedContributions) {
  // Attempt to read the JavaScript file for interactive table features (sorting, filtering).
  const filtersScriptPath = path.join(__dirname, '../../utils/table-filters.js');
  let tableFiltersScript = '';
  try {
    tableFiltersScript = await fs.readFile(filtersScriptPath, 'utf8');
  } catch (err) {
    console.warn(
      'Warning: utils/table-filters.js not found. Interactive features will be disabled.'
    );
  }

  // Transform the grouped data into an array of report objects, calculate totals, and sort by key (chronologically).
  const allReports = Object.entries(groupedContributions)
    .map(([key, data]) => {
      const [year, quarterPrefix] = key.split('-');
      const fullQuarterName = `${quarterPrefix} ${year}`;

      return {
        key,
        year,
        quarterPrefix,
        fullQuarterName,
        data,
        // Calculate the total number of contributions across all types for the quarter
        totalContributions: Object.values(data).reduce((sum, arr) => sum + arr.length, 0),
      };
    })
    .sort((a, b) => a.key.localeCompare(b.key));

  /**
   * Generates an HTML span for a status badge (e.g., OPEN, MERGED, CLOSED).
   * @param {string} status - The raw status text.
   * @returns {string} HTML for the status badge.
   */
  function getStatusBadgeHtml(status) {
    const cleanedStatus = status.toUpperCase().trim();
    const tokens = STATUS_BADGE_TOKENS[cleanedStatus] || DEFAULT_STATUS_BADGE;
    const fontWeight = STATUS_BADGE_TOKENS[cleanedStatus] ? 'font-semibold' : 'font-medium';

    const style = `background-color: ${tokens.bg}; color: ${tokens.text};`;
    return `<span class="inline-block px-2 py-0.5 text-xs rounded-full ${fontWeight}" style="${style}">${cleanedStatus}</span>`;
  }

  /**
   * Replaces the raw status text within a PR status content string (e.g., "Last update: <strong>CLOSED</strong>")
   * with a styled status badge, keeping the date info.
   * @param {string} content - The raw PR status content.
   * @returns {{html: string, statusText: string}} Object containing the new HTML and the raw status word for sorting.
   */
  function formatPrStatusWithBadge(content) {
    const parts = content.split('<br>');
    if (parts.length < 2) return { html: content, statusText: 'N/A' };

    const date = parts[0];
    const rawStatusTag = parts[1];
    // Extract the status word from the strong tag
    const statusMatch = rawStatusTag.match(/<strong>(.*?)<\/strong>/i);
    const statusWord = statusMatch && statusMatch[1] ? statusMatch[1] : 'N/A';

    const statusBadge = getStatusBadgeHtml(statusWord);
    // Return both the HTML for display and the raw status text for sorting logic
    return {
      html: `${date}<br>${statusBadge}`,
      statusText: statusWord,
    };
  }

  /**
   * Generates the HTML block for navigating to the previous and next quarterly reports.
   * @param {number} index - The index of the current report in the `allReports` array.
   * @returns {string} The HTML string for the navigation buttons.
   */
  function generateReportNavButton(index) {
    const reports = allReports;
    const previousReport = index > 0 ? reports[index - 1] : null;
    const nextReport = index < reports.length - 1 ? reports[index + 1] : null;

    let previousButton = '';
    let nextButton = '';

    // Helper function to build the relative path: ../YEAR/QX-YYYY.html
    const getReportPath = (report) => {
      const fileName = `${report.quarterPrefix}-${report.year}.html`;
      return `../${report.year}/${fileName}`;
    };

    const baseClasses =
      'w-40 xs:w-44 sm:w-52 h-20 p-2 sm:p-4 flex flex-col justify-center rounded-lg shadow-md transition duration-200 border qr-nav-card';

    if (previousReport) {
      const prevPath = getReportPath(previousReport);
      previousButton = dedent`
        <a href="${prevPath}" class="${baseClasses} nav-report-button text-left" style="color: var(--t-brand);">
          <span class="text-[10px] sm:text-xs font-medium" style="color: var(--t-ink-3);">Previous</span>
          <span class="flex items-center space-x-1 font-bold text-sm sm:text-lg break-words whitespace-normal" style="color: var(--t-brand);">
            ${LEFT_ARROW_SVG}
            <span class="whitespace-normal min-w-0">${previousReport.fullQuarterName}</span>
          </span>

        </a>
      `;
    } else {
      // Placeholder div maintains layout when no previous report exists
      previousButton = '<div class="w-52 h-20"></div>';
    }

    if (nextReport) {
      const nextPath = getReportPath(nextReport);
      nextButton = dedent`
        <a href="${nextPath}" class="${baseClasses} nav-report-button text-right" style="color: var(--t-brand);">
          <span class="text-[10px] sm:text-xs font-medium" style="color: var(--t-ink-3);">Next</span>
          <span class="flex items-center space-x-1 justify-end font-bold text-sm sm:text-lg break-words whitespace-normal" style="color: var(--t-brand);">
            <span class="whitespace-normal min-w-0">${nextReport.fullQuarterName}</span>
            ${RIGHT_ARROW_SVG}
          </span>
        </a>
      `;
    } else {
      // Placeholder div maintains layout when no next report exists
      nextButton = '<div class="w-52 h-20"></div>';
    }

    return dedent`
      <div class="mt-12 mb-8 w-full flex justify-center">
        <div class="max-w-[120ch] mx-auto w-full flex justify-between items-center gap-4 px-2 sm:px-8 lg:px-12 xl:px-16 2xl:px-24">
          ${previousButton}
          ${nextButton}
        </div>
      </div>
    `;
  }

  const htmlBaseDir = path.join(BASE_DIR, 'html-generated');
  const quarterlyFileLinks = [];
  await fs.mkdir(htmlBaseDir, { recursive: true });

  // Pre-calculate the styles string to be included in the <style> tag.
  const dynamicCss = getReportStyleCss() + QUARTERLY_EXTRA_CSS;

  // Iterate over each quarterly report to generate its dedicated HTML file.
  for (let index = 0; index < allReports.length; index++) {
    const report = allReports[index];
    const { key, year, quarterPrefix: quarter, data, totalContributions } = report;
    const footerHtml = createFooterHtml().trim();

    // Generate the navbar with path relative to the sub-folder
    const navHtmlForReports = createNavHtml('../');

    const yearDir = path.join(htmlBaseDir, year);
    await fs.mkdir(yearDir, { recursive: true });

    const filename = `${quarter}-${year}.html`;
    const relativePath = path.join(year, filename);
    const filePath = path.join(yearDir, filename);

    if (totalContributions === 0) {
      console.log(`Skipping empty quarter: ${key}`);
      continue;
    }

    // Calculate repository statistics for the summary section.
    const allItems = [
      ...(data.pullRequests || []),
      ...(data.issues || []),
      ...(data.reviewedPrs || []),
      ...(data.coAuthoredPrs || []),
      ...(data.collaborations || []),
    ];
    const uniqueRepos = new Set(allItems.map((item) => item.repo));
    const totalRepos = uniqueRepos.size;

    const repoCounts = allItems.reduce((acc, item) => {
      acc[item.repo] = (acc[item.repo] || 0) + 1;
      return acc;
    }, {});

    const sortedRepos = Object.entries(repoCounts).sort(([, a], [, b]) => b - a);
    const top3Repos = sortedRepos
      .slice(0, 3)
      .map(
        (item) => dedent`
          <li class="pl-2"><a href='https://github.com/${item[0]}' target='_blank' rel="noopener noreferrer" class="qr-link font-mono text-sm">${item[0]}</a> (${item[1]} contributions)</li>
        `
      )
      .join('');

    const prCount = data.pullRequests?.length || '0';
    const reviewedPrCount = data.reviewedPrs?.length || '0';
    const issueCount = data.issues?.length || '0';
    const coAuthoredPrCount = data.coAuthoredPrs?.length || '0';
    const collaborationCount = data.collaborations?.length || '0';

    // Configuration object defining each contribution section, including table headers, widths, and data types for sorting.
    const sections = {
      pullRequests: {
        title: 'Merged PRs',
        icon: LANDING_PAGE_ICONS.merged,
        id: 'merged-prs',
        headers: ['No.', 'Project', 'Title', 'Created', 'Merged', 'Review Period'],
        widths: ['5%', '20%', '30%', '15%', '15%', '15%'],
        colTypes: ['number', 'string', 'string', 'date', 'date', 'number'],
        keys: ['repo', 'title', 'date', 'mergedAt', 'reviewPeriod'],
      },
      issues: {
        title: 'Issues',
        icon: LANDING_PAGE_ICONS.issues,
        id: 'issues',
        headers: ['No.', 'Project', 'Title', 'Created', 'Closed', 'Closing Period'],
        widths: ['5%', '25%', '35%', '15%', '15%', '10%'],
        colTypes: ['number', 'string', 'string', 'date', 'date', 'number'],
        keys: ['repo', 'title', 'date', 'closedAt', 'closingPeriod'],
      },
      reviewedPrs: {
        title: 'Reviewed PRs',
        icon: LANDING_PAGE_ICONS.reviewed,
        id: 'reviewed-prs',
        headers: [
          'No.',
          'Project',
          'Title',
          'Created At',
          'First Review',
          'Review Period',
          'Last Update / Status',
        ],
        widths: ['5%', '20%', '28%', '10%', '15%', '10%', '12%'],
        colTypes: ['number', 'string', 'string', 'date', 'date', 'number', 'status'],
        keys: ['repo', 'title', 'createdAt', 'myFirstReviewDate', 'myFirstReviewPeriod', 'date'],
      },
      coAuthoredPrs: {
        title: 'Co-Authored PRs',
        icon: LANDING_PAGE_ICONS.coAuthored,
        id: 'co-authored-prs',
        headers: [
          'No.',
          'Project',
          'Title',
          'Created At',
          'First Commit',
          'Commit Period',
          'Last Update / Status',
        ],
        widths: ['5%', '15%', '25%', '10%', '12%', '13%', '20%'],
        colTypes: ['number', 'string', 'string', 'date', 'date', 'number', 'status'],
        keys: ['repo', 'title', 'createdAt', 'firstCommitDate', 'firstCommitPeriod', 'date'],
      },
      collaborations: {
        title: 'Collaborations',
        icon: LANDING_PAGE_ICONS.collaborations,
        id: 'collaborations',
        headers: ['No.', 'Project', 'Title', 'Created At', 'First Comment', 'Last Update / Status'],
        widths: ['5%', '25%', '30%', '12%', '12%', '16%'],
        colTypes: ['number', 'string', 'string', 'date', 'date', 'status'],
        keys: ['repo', 'title', 'createdAt', 'firstCommentedAt', 'updatedAt'],
      },
    };

    // Begin HTML structure for the report page.
    let htmlContent = dedent`
<!DOCTYPE html>
<html lang="en" class="h-full">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${quarter} ${year} Report | ${GITHUB_USERNAME} OSS Portfolio</title>
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,${FAVICON_SVG_ENCODED}">
  ${getThemeInitScript()}
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
  ${getThemeStyleVariant()}
  <style>
    ${dynamicCss}
    ${SHARED_CHROME_CSS}
  </style>
</head>
<body style="background-color: var(--t-surface); color: var(--t-ink);" class="antialiased flex flex-col h-full min-h-full">
${createSkipToContentHtml('main')}
${navHtmlForReports}
  <main id="main" class="grow w-full">
    <div class="px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-24 py-6 sm:py-10">
      <div class="max-w-[120ch] mx-auto">
        <header style="border-bottom-color: var(--t-brand-line);" class="text-center mt-16 mb-12 pb-4 border-b-2">
          <h1 style="color: var(--t-brand);" class="text-4xl sm:text-5xl font-extrabold mb-2 pt-8">${quarter} ${year}</h1>
          <p class="text-lg qr-ink2 mt-2">Open Source Contributions Report</p>
        </header>

        <section class="mb-8">
          <h2 style="color: var(--t-ink);" class="text-3xl font-semibold mb-12">📊 Quarterly Statistics</h2>
          <div class="qr-impact">
            <div class="qr-tiles">
              <div class="qr-tile qr-tile--hero">
                <span class="n">${totalContributions}</span>
                <span class="c">Total Contributions</span>
              </div>
              <div class="qr-tile">
                <span class="n">${totalRepos}</span>
                <span class="c">Total Repositories</span>
              </div>
            </div>
          </div>
        </section>

        <section class="mb-8">
          <h3 class="text-2xl font-semibold mt-16 mb-4 border-l-4 pl-3" style="color: var(--t-ink); border-left-color: var(--t-positive);">Contribution Breakdown</h3>
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-sm">
            ${[
              {
                id: sections.pullRequests.id,
                count: prCount,
                label: 'Merged PRs',
                icon: sections.pullRequests.icon,
              },
              {
                id: sections.issues.id,
                count: issueCount,
                label: 'Issues',
                icon: sections.issues.icon,
              },
              {
                id: sections.reviewedPrs.id,
                count: reviewedPrCount,
                label: 'Reviewed PRs',
                icon: sections.reviewedPrs.icon,
              },
              {
                id: sections.coAuthoredPrs.id,
                count: coAuthoredPrCount,
                label: 'Co-Authored PRs',
                icon: sections.coAuthoredPrs.icon,
              },
              {
                id: sections.collaborations.id,
                count: collaborationCount,
                label: 'Collaborations',
                icon: sections.collaborations.icon,
              },
            ]
              .map(
                (item) => `
              <a href="#${item.id}" class="nav-contribution-button qr-nav-card flex flex-col items-center p-3 border rounded-xl shadow-sm hover:shadow-lg transition text-center" style="color: var(--t-brand);">
                <span class="text-2xl font-bold" style="color: var(--t-brand);">${item.count}</span>
                <div class="flex items-center justify-center gap-1.5 qr-ink2 mt-1">
                  <span class="breakdown-icon-wrapper opacity-70">
                    ${item.icon}
                  </span>
                  <span class="breakdown-label">${item.label}</span>
                </div>
              </a>
              `
              )
              .join('')}
          </div>
        </section>

        <section class="mb-8">
          <h3 class="text-2xl font-semibold mb-4 border-l-4 pl-3" style="color: var(--t-ink); border-left-color: var(--t-caution);">Top 3 Repositories</h3>
          <div class="p-4 qr-surface2 rounded-lg shadow-sm">
            <ol class="list-decimal list-inside pl-4 qr-ink2 space-y-1">
              ${top3Repos}
            </ol>
          </div>
        </section>

        <hr class="my-8" style="border-color: var(--t-line);">

        <section class="space-y-6">
    `;

    // Generate HTML for each contribution section (table).
    for (const [section, sectionInfo] of Object.entries(sections)) {
      let items = data[section] || []; // Get data for the current section.

      // Apply initial chronological sort to Reviewed PRs and Co-Authored PRs for display consistency.
      if (section === 'reviewedPrs' && items && items.length > 0) {
        items = [...items].sort(
          (a, b) => new Date(b.myFirstReviewDate) - new Date(a.myFirstReviewDate)
        );
      } else if (section === 'coAuthoredPrs' && items && items.length > 0) {
        items = [...items].sort(
          (a, b) => new Date(b.firstCommitDate) - new Date(a.firstCommitDate)
        );
      }

      // Details tag is used for collapsible sections.
      htmlContent += `<details id="${sectionInfo.id}" class="border rounded-xl p-4 shadow-sm" style="border-color: var(--t-line);">\n`;
      htmlContent += ` <summary style="color: var(--t-brand);" class="text-xl font-bold cursor-pointer outline-none">\n`;
      htmlContent += `  <div class="inline-flex items-center flex-nowrap gap-2 ml-3" style="vertical-align: middle;">\n`;
      htmlContent += `    <span class="w-6 h-6 flex items-center shrink-0">${sectionInfo.icon}</span>\n`;
      htmlContent += `    <span class="text-xl font-bold whitespace-nowrap">${sectionInfo.title} (${items.length})</span>\n`;
      htmlContent += `  </div>\n`;
      htmlContent += ` </summary>\n`;

      if (!items || items.length === 0) {
        htmlContent += `<div class="p-4 qr-ink2 qr-surface2 rounded-lg">No contributions of this type in this quarter.</div>\n`;
      } else {
        // Search bar with icon styling for the table in the current section.
        const searchInputId = `${sectionInfo.id}-search`;
        const visualPlaceholder = `Search (Project, Title, status:open...)`;
        const accessibleLabel = `Search contributions in ${sectionInfo.title}`;

        htmlContent += dedent`
          <div class="flex flex-wrap gap-2 items-center mb-4 mt-2 px-1">

            <div class="icon-input-container grow">
              <div class="input-icon" style="color: var(--t-brand);">
                ${SEARCH_SVG}
              </div>

              <input
                type="text"
                id="${searchInputId}"
                placeholder="${visualPlaceholder}"
                aria-label="${accessibleLabel}"
                class="search-input w-full border rounded-md
                px-3 py-2 text-sm focus:outline-none focus:ring-1 transition"
                style="border-color: var(--t-brand);"
              />
            </div>

            <button
            class="reset-btn qr-surface2
            hover:opacity-80 px-3 py-2 rounded-md text-sm font-medium transition"
            style="color: var(--t-ink-2);"
            >
              Reset
            </button>
          </div>
        `;

        // Generate the contribution table.
        let tableContent = `<div class="overflow-x-auto rounded-lg border max-h-[70vh] overflow-y-auto" style="border-color: var(--t-line);">\n`;
        tableContent += ` <table class="report-table min-w-full">\n`;
        tableContent += `  <thead>\n`;
        tableContent += `    <tr>\n`;

        // Generate table headers with sorting attributes (data-type).
        for (let i = 0; i < sectionInfo.headers.length; i++) {
          const type = sectionInfo.colTypes[i];
          const isStaticColumn = i === 0; // The 'No.' column is static (not sortable).

          const thAttributes = isStaticColumn ? '' : `data-type="${type}" title="Click to sort"`;
          const headerContent = isStaticColumn
            ? sectionInfo.headers[i]
            : `<span class="th-content">${sectionInfo.headers[i]} <span class="sort-icon ml-1">↕</span></span>`;
          const cursorStyle = isStaticColumn ? 'cursor: default;' : 'cursor: pointer;';

          tableContent += `     <th ${thAttributes} class="py-3 px-4" style="color: var(--t-brand); ${cursorStyle}">
              ${headerContent}
          </th>\n`;
        }
        tableContent += `    </tr>\n`;
        tableContent += `  </thead>\n`;
        tableContent += `  <tbody>\n`;

        let counter = 1;
        // Generate table rows, mapping data properties to columns.
        for (const item of items) {
          const rowClass = counter % 2 === 1 ? 'qr-row-a' : 'qr-row-b';
          const safeTitle = sanitizeAttribute(item.title);

          tableContent += `   <tr class="${rowClass}">\n`;

          // No. column (not sortable).
          tableContent += `     <td>${counter++}.</td>\n`;

          // Repo column (String type).
          const repoSpanHtml = `<span class="qr-repo">${item.repo}</span>`;
          tableContent += `     <td data-value="${item.repo}" data-col-type="string" data-label="Project">${repoSpanHtml}</td>\n`;

          // Title column (String type, contains hyperlink).
          const linkHtml = `<a href='${item.url}' target='_blank' rel="noopener noreferrer" class="qr-link">${item.title}</a>`;
          tableContent += `     <td data-value="${safeTitle}" data-col-type="string" data-label="Title">${linkHtml}</td>\n`;

          // Handle the remaining columns based on the contribution type.
          if (section === 'pullRequests') {
            const createdAt = formatDate(item.createdAt);
            // Use mergedAt if available, otherwise closedAt
            const completedAtDate = item.mergedAt || item.closedAt;
            const completedAtFormatted = formatDate(completedAtDate);

            // Calculate period using whatever end date we found
            const reviewPeriod = calculatePeriodInDays(item.createdAt, completedAtDate);
            const daysNum = reviewPeriod.replace(/[^0-9]/g, '') || 0;

            tableContent += ` <td data-value="${item.createdAt}" data-col-type="date" data-label="${sectionInfo.headers[3]}">${createdAt}</td>\n`;
            tableContent += ` <td data-value="${completedAtDate || ''}" data-col-type="date" data-label="${sectionInfo.headers[4]}">${completedAtFormatted}</td>\n`;
            tableContent += ` <td data-value="${daysNum}" data-col-type="number" data-label="${sectionInfo.headers[5]}">${reviewPeriod}</td>\n`;
          } else if (section === 'issues') {
            const createdAt = formatDate(item.date);
            const closedAt = formatDate(item.closedAt);
            const closingPeriod = calculatePeriodInDays(item.date, item.closedAt, 'open');

            let closingPeriodHtml = closingPeriod;
            let sortValue = closingPeriod.replace(/[^0-9]/g, '');

            if (closingPeriod === '<strong>OPEN</strong>') {
              // Replace "OPEN" raw text with a badge for display.
              closingPeriodHtml = getStatusBadgeHtml('OPEN');
              // Use a non-numeric string for sorting 'OPEN' status, handled by table-filters.js as infinite time.
              sortValue = 'N/A';
            } else {
              // If it's a period (e.g., "15 days"), use the raw number or '0' if it's "0 days"
              sortValue = sortValue || '0';
            }

            tableContent += `     <td data-value="${item.date}" data-col-type="date" data-label="${sectionInfo.headers[3]}">${createdAt}</td>\n`;
            tableContent += `     <td data-value="${item.closedAt}" data-col-type="date" data-label="${sectionInfo.headers[4]}">${closedAt}</td>\n`;
            tableContent += `     <td data-value="${sortValue}" data-col-type="number" data-label="${sectionInfo.headers[5]}">${closingPeriodHtml}</td>\n`;
          } else if (section === 'reviewedPrs') {
            const createdAt = formatDate(item.createdAt);
            const myFirstReviewAt = formatDate(item.myFirstReviewDate);
            const myFirstReviewPeriod = calculatePeriodInDays(
              item.createdAt,
              item.myFirstReviewDate
            );
            const daysNum = myFirstReviewPeriod.replace(/[^0-9]/g, '') || 0;

            const statusObj = formatPrStatusWithBadge(getPrStatusContent(item));

            tableContent += `     <td data-value="${item.createdAt}" data-col-type="date" data-label="${sectionInfo.headers[3]}">${createdAt}</td>\n`;
            tableContent += `     <td data-value="${item.myFirstReviewDate}" data-col-type="date" data-label="${sectionInfo.headers[4]}">${myFirstReviewAt}</td>\n`;
            tableContent += `     <td data-value="${daysNum}" data-col-type="number" data-label="${sectionInfo.headers[5]}">${myFirstReviewPeriod}</td>\n`;
            tableContent += `     <td data-value="${statusObj.statusText}" data-col-type="status" data-label="${sectionInfo.headers[6]}">${statusObj.html}</td>\n`;
          } else if (section === 'coAuthoredPrs') {
            const createdAt = formatDate(item.createdAt);
            const firstCommitAt = formatDate(item.firstCommitDate);
            const firstCommitPeriod = calculatePeriodInDays(item.createdAt, item.firstCommitDate);
            const daysNum = firstCommitPeriod.replace(/[^0-9]/g, '') || 0;

            const statusObj = formatPrStatusWithBadge(getPrStatusContent(item));

            tableContent += `     <td data-value="${item.createdAt}" data-col-type="date" data-label="${sectionInfo.headers[3]}">${createdAt}</td>\n`;
            tableContent += `     <td data-value="${item.firstCommitDate}" data-col-type="date" data-label="${sectionInfo.headers[4]}">${firstCommitAt}</td>\n`;
            tableContent += `     <td data-value="${daysNum}" data-col-type="number" data-label="${sectionInfo.headers[5]}">${firstCommitPeriod}</td>\n`;
            tableContent += `     <td data-value="${statusObj.statusText}" data-col-type="status" data-label="${sectionInfo.headers[6]}">${statusObj.html}</td>\n`;
          } else if (section === 'collaborations') {
            const createdAt = formatDate(item.createdAt);
            const commentedAt = formatDate(item.firstCommentedAt);
            const statusObj = formatPrStatusWithBadge(getCollaborationStatusContent(item));

            tableContent += ` <td data-value="${item.createdAt}" data-col-type="date" data-label="${sectionInfo.headers[3]}">${createdAt}</td>\n`;
            tableContent += ` <td data-value="${item.firstCommentedAt || ''}" data-col-type="date" data-label="${sectionInfo.headers[4]}">${commentedAt}</td>\n`;
            // Using updatedAt for the status column's date value to ensure proper sorting
            tableContent += ` <td data-value="${statusObj.statusText}" data-col-type="status" data-label="${sectionInfo.headers[5]}">${statusObj.html}</td>\n`;
          }

          tableContent += `    </tr>\n`;
        }

        tableContent += `  </tbody>\n`;
        tableContent += ` </table>\n`;
        tableContent += `</div>\n`;

        htmlContent += tableContent;
      }

      htmlContent += `</details>\n\n`;
    }

    const navButton = generateReportNavButton(index);

    // Close main content and insert the table interaction script, other scripts, and footer.
    htmlContent += dedent`
          </section>
          ${navButton}
        </div>
      </div>
    </main>
    <script>
      ${tableFiltersScript}

      // Function to open the correct section based on the URL hash, defaulting to 'Merged PRs'.
      function openSectionFromHash() {
        const hash = window.location.hash;
        if (hash) {
          const targetDetails = document.querySelector(hash);
          if (targetDetails && targetDetails.tagName === 'DETAILS') {
            // Close all other details tags before opening the target one
            document.querySelectorAll('details').forEach(detail => detail.open = false);
            targetDetails.open = true;
            // Scroll to the opened section with a slight delay
            setTimeout(() => {
              const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
              targetDetails.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
            }, 100);
          }
        } else {
          // Open 'Merged PRs' by default if no hash is present.
          const defaultDetails = document.getElementById('merged-prs');
          if (defaultDetails) defaultDetails.open = true;
        }
      }
      window.addEventListener('DOMContentLoaded', openSectionFromHash);
      window.addEventListener('hashchange', openSectionFromHash);
    </script>
${footerHtml}
${createBackToTopHtml()}
${getBackToTopScript()}
    </body>
</html>
`;
    // Clean up non-breaking spaces and trailing whitespace before formatting.
    htmlContent = htmlContent.replace(/ /g, ' ').replace(/[ \t]+$/gm, '');

    // Use Prettier to format the final HTML content.
    const formattedContent = await prettier.format(htmlContent, {
      parser: 'html',
    });

    await fs.writeFile(filePath, formattedContent, 'utf8');
    console.log(`Written file: ${filePath}`);

    quarterlyFileLinks.push({
      path: relativePath,
      total: totalContributions,
    });
  }

  return quarterlyFileLinks;
}

module.exports = {
  writeHtmlFiles,
};
