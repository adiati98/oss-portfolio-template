const fs = require('fs/promises');
const path = require('path');

// Import configuration and metadata
const { BASE_DIR, GITHUB_USERNAME } = require('../../config/config');
const { PERSONA_CATEGORIES, DEFAULT_PERSONA } = require('../../metadata/personas');
const { GLOSSARY_CONTENT } = require('../../metadata/glossary');

const MARKDOWN_OUTPUT_DIR_NAME = 'markdown-generated';
const MARKDOWN_README_FILENAME = 'README.md';
const MARKDOWN_GLOSSARY_FILENAME = 'glossary.md';

/**
 * Determines persona based on metadata and counts.
 */
function determinePersona(counts) {
  const grandTotal = Object.values(counts).reduce((a, b) => a + b, 0);
  if (grandTotal === 0) return DEFAULT_PERSONA;

  return PERSONA_CATEGORIES.reduce((prev, curr) => {
    const currCount = counts[curr.key] || 0;
    const prevCount = counts[prev.key] || 0;

    if (currCount > prevCount) return curr;
    if (currCount === prevCount && curr.priority < prev.priority) return curr;
    return prev;
  });
}

/**
 * Helper: Generates a Unicode progress bar
 */
function generateProgressBar(count, total, width) {
  const filledChar = '■';
  const emptyChar = '□';
  if (total === 0) return emptyChar.repeat(width);
  const percent = count / total;
  const filledCount = Math.round(percent * width);
  const emptyCount = width - filledCount;
  return filledChar.repeat(Math.max(0, filledCount)) + emptyChar.repeat(Math.max(0, emptyCount));
}

async function createStatsReadme(finalContributions) {
  const markdownBaseDir = path.join(BASE_DIR, MARKDOWN_OUTPUT_DIR_NAME);
  const README_PATH = path.join(markdownBaseDir, MARKDOWN_README_FILENAME);
  const GLOSSARY_PATH = path.join(markdownBaseDir, MARKDOWN_GLOSSARY_FILENAME);

  await fs.mkdir(markdownBaseDir, { recursive: true });

  // 1. Calculate Totals
  const prCount = finalContributions.pullRequests?.length || 0;
  const issueCount = finalContributions.issues?.length || 0;
  const reviewedPrCount = finalContributions.reviewedPrs?.length || 0;
  const collaborationCount = finalContributions.collaborations?.length || 0;
  const coAuthoredPrCount = (finalContributions.coAuthoredPrs || []).length;

  const grandTotal =
    prCount + issueCount + reviewedPrCount + collaborationCount + coAuthoredPrCount;
  const maxCount = Math.max(
    prCount,
    issueCount,
    reviewedPrCount,
    collaborationCount,
    coAuthoredPrCount
  );

  // 2. Persona Logic
  const countsDict = {
    prCount,
    issueCount,
    reviewedPrCount,
    coAuthoredPrCount,
    collaborationCount,
  };
  const { title: personaTitle, desc: personaDesc } = determinePersona(countsDict);

  const lowerDesc = personaDesc.charAt(0).toLowerCase() + personaDesc.slice(1);
  const article = ['a', 'e', 'i', 'o', 'u'].includes(lowerDesc.charAt(0)) ? 'An' : 'A';

  // 3. Stats Prep
  const getStats = (count) => {
    const BAR_WIDTH = 30;
    const pctVal = grandTotal === 0 ? 0 : (count / grandTotal) * 100;
    const isMax = count === maxCount && count > 0;
    return {
      pct: isMax ? `**${pctVal.toFixed(1)}%**` : `${pctVal.toFixed(1)}%`,
      count: isMax ? `**${count}**` : count,
      bar: generateProgressBar(count, grandTotal, BAR_WIDTH),
    };
  };

  const stats = {
    prs: getStats(prCount),
    issues: getStats(issueCount),
    reviews: getStats(reviewedPrCount),
    coauth: getStats(coAuthoredPrCount),
    collab: getStats(collaborationCount),
  };

  // 4. Aggregate Repository Activity
  const allItems = [
    ...(finalContributions.pullRequests || []),
    ...(finalContributions.issues || []),
    ...(finalContributions.reviewedPrs || []),
    ...(finalContributions.coAuthoredPrs || []),
    ...(finalContributions.collaborations || []),
  ];

  const totalUniqueRepos = new Set(allItems.map((item) => item.repo)).size;
  const earliestYear =
    allItems.length > 0
      ? Math.min(...allItems.map((i) => new Date(i.date).getFullYear()))
      : new Date().getFullYear();

  const topThreeRepos = Object.entries(
    allItems.reduce((acc, item) => {
      acc[item.repo] = (acc[item.repo] || 0) + 1;
      return acc;
    }, {})
  )
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  const topReposMarkdown =
    topThreeRepos.length > 0
      ? topThreeRepos
          .map(
            ([repo, count], idx) =>
              `${idx + 1}. [**${repo}**](https://github.com/${repo}) (${count} contributions)`
          )
          .join('\n')
      : '_No activity recorded recorded yet._';

  // 5. Generate Quarterly Links (RESTORED LOGIC)
  let reportLinksContent = '## 📂 Detailed Quarterly Reports\n\n';
  try {
    const files = await fs.readdir(markdownBaseDir);
    const years = files.filter((f) => /^\d{4}$/.test(f)).sort((a, b) => b - a);

    if (years.length === 0) {
      reportLinksContent += '_No detailed reports generated yet._\n';
    } else {
      for (const year of years) {
        const yearDir = path.join(markdownBaseDir, year);
        const quarters = (await fs.readdir(yearDir))
          .filter((f) => /^Q\d-\d{4}\.md$/.test(f))
          .sort((a, b) => b.localeCompare(a));

        if (quarters.length > 0) {
          reportLinksContent += `### ${year}\n`;
          quarters.forEach((qFile) => {
            const qName = qFile.replace('.md', '');
            reportLinksContent += `* [${qName}](./${year}/${qFile})\n`;
          });
          reportLinksContent += '\n';
        }
      }
    }
  } catch (err) {
    reportLinksContent += '_No detailed reports found._\n';
  }

  // 6. Build GLOSSARY.md
  const personalize = (text) => (text ? text.replace(/{{GITHUB_USERNAME}}/g, GITHUB_USERNAME) : '');
  const generatedAt = new Date().toLocaleString();

  let glossarySectionsMd = '';
  (GLOSSARY_CONTENT.sections || []).forEach((group) => {
    let noteHeader = group.items.some((i) => i.entryMethod)
      ? 'Entry Method'
      : group.items.some((i) => i.howItIsCalculated)
        ? 'Calculation Logic'
        : 'Data Source';

    glossarySectionsMd += `## ${group.title}\n\n_${personalize(group.description)}_\n\n`;
    glossarySectionsMd += `| Metric | Description | ${noteHeader} |\n| :--- | :--- | :--- |\n`;
    group.items.forEach((item) => {
      const note = item.entryMethod || item.howItIsCalculated || item.source || '';
      glossarySectionsMd += `| **${item.title}** | ${personalize(item.description)} | ${personalize(note)} |\n`;
    });
    glossarySectionsMd += '\n';
  });

  const glossaryMarkdown = `# 📖 Glossary\n\n${personalize(GLOSSARY_CONTENT.subtitle)}\n\n${glossarySectionsMd}\n---\n[← Back to Summary](./${MARKDOWN_README_FILENAME}) | *Last updated: ${generatedAt}*`;

  // 7. Build README.md
  const readmeMarkdown = `# 📈 Open Source Contributions Report

Organized by calendar quarter, these reports track [**${GITHUB_USERNAME}**](https://github.com/${GITHUB_USERNAME})'s involvement.

> [!IMPORTANT]
> Refer to the [**Glossary**](./${MARKDOWN_GLOSSARY_FILENAME}) for metric calculations.

---

## 📊 All-Time Impact Summary

### 🚀 Total Contributions: **${grandTotal}**

| Context | Detail |
| :--- | :--- |
| 🏗️ **Unique Repositories** | **${totalUniqueRepos}** projects |
| 📅 **Active Since** | **${earliestYear}** |

### 🧩 Distribution

| Category | Progress | Count | % |
| :--- | :--- | :--- | :--- |
| **Merged PRs** | \`${stats.prs.bar}\` | ${stats.prs.count} | ${stats.prs.pct} |
| **Issues** | \`${stats.issues.bar}\` | ${stats.issues.count} | ${stats.issues.pct} |
| **Reviewed PRs** | \`${stats.reviews.bar}\` | ${stats.reviews.count} | ${stats.reviews.pct} |
| **Co-Authored PRs** | \`${stats.coauth.bar}\` | ${stats.coauth.count} | ${stats.coauth.pct} |
| **Collaborations** | \`${stats.collab.bar}\` | ${stats.collab.count} | ${stats.collab.pct} |

### 🎯 Primary Focus Projects

${topReposMarkdown}

### 🎭 Collaboration Profile: ${personaTitle}

${article} ${lowerDesc}

---

${reportLinksContent}

---
*Report last generated on: ${generatedAt}*`;

  // 8. Write Files
  await fs.writeFile(README_PATH, readmeMarkdown, 'utf8');
  await fs.writeFile(GLOSSARY_PATH, glossaryMarkdown, 'utf8');

  console.log(`Markdown generated: README.md and glossary.md`);
}

module.exports = { createStatsReadme };
