const path = require('path');
const fs = require('fs/promises');

// Import configuration
const { GITHUB_USERNAME } = require('../config/config');

// Import core fetching logic
const { fetchContributions } = require('../api/github-api-fetchers');

// Import grouping logic
const { groupContributionsByQuarter } = require('../utils/contributions-groupers');

// Import markdown generation logic
const { writeMarkdownFiles } = require('../generators/markdown/quarterly-reports-generator');
const { createStatsReadme } = require('../generators/markdown/contributions-readme-generator');

// Import html generation logic
const { writeHtmlFiles } = require('../generators/html/quarterly-reports-html-generator');
const { createHtmlReports } = require('../generators/html/contributions-report-html-generator');
const { createIndexHtml } = require('../generators/html/landing-page-html-generator');
const { createGlossaryHtml } = require('../generators/html/glossary-html-generator');

async function main() {
  const dataDir = 'data';
  await fs.mkdir(dataDir, { recursive: true });

  const cacheFile = path.join(dataDir, 'pr-cache.json');
  const dataFile = path.join(dataDir, 'all-contributions.json');
  const commitCacheFile = path.join(dataDir, 'commit-cache.json');

  let prCache = new Set();

  // Load PR cache
  try {
    const cacheData = await fs.readFile(cacheFile, 'utf8');
    prCache = new Set(JSON.parse(cacheData));
    console.log('Loaded Pull Request PR cache from file.');
  } catch (e) {
    if (e.code !== 'ENOENT') console.error('Failed to load Pull Request PR cache:', e);
  }

  // Load persistent commit cache
  let commitCacheFromDisk = new Map();
  try {
    const commitCacheData = await fs.readFile(commitCacheFile, 'utf8');
    const parsed = JSON.parse(commitCacheData);
    for (const [k, v] of Object.entries(parsed)) {
      commitCacheFromDisk.set(k, v);
    }
    console.log('Loaded commit cache from file.');
  } catch (e) {
    if (e.code !== 'ENOENT') {
      console.error('Failed to load commit cache:', e);
    } else {
      console.log('No persistent commit cache found, starting fresh.');
    }
  }

  try {
    let allContributions = {};
    try {
      const data = await fs.readFile(dataFile, 'utf8');
      allContributions = JSON.parse(data);
      console.log('Loaded existing contributions data.');
    } catch (e) {
      if (e.code !== 'ENOENT') console.error('Failed to load contributions data:', e);
    }

    const cacheStats = await fs.stat(dataFile).catch(() => null);
    const lastUpdate = cacheStats ? new Date(cacheStats.mtime) : null;
    const today = new Date();

    let fetchStartYear;
    if (!lastUpdate) {
      fetchStartYear = undefined;
      prCache = new Set();
      console.log('First run - triggering auto-discovery of GitHub join date');
    } else {
      const lastUpdateYear = lastUpdate.getFullYear();
      const lastUpdateMonth = lastUpdate.getMonth();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth();

      const sameMonth = lastUpdateMonth === currentMonth && lastUpdateYear === currentYear;
      const previousMonth =
        lastUpdateMonth === (currentMonth - 1 + 12) % 12 &&
        (lastUpdateYear === currentYear ||
          (lastUpdateYear === currentYear - 1 && currentMonth === 0));

      if (sameMonth) {
        fetchStartYear = currentYear;
        console.log('Recent update - fetching only current year');
      } else if (previousMonth) {
        fetchStartYear = currentYear - 1;
        console.log('Last month update - fetching last two years');
      } else {
        fetchStartYear = lastUpdateYear - 1;
        console.log(`Older update - fetching from: ${fetchStartYear}`);
      }
    }

    const mergedCommitCache = new Map();
    for (const [k, v] of commitCacheFromDisk) mergedCommitCache.set(k, v);

    const {
      contributions: newContributions,
      prCache: updatedPrCache,
      commitCache: usedCommitCache,
    } = await fetchContributions(fetchStartYear, prCache, mergedCommitCache);

    let finalContributions = {
      pullRequests: [],
      issues: [],
      reviewedPrs: [],
      coAuthoredPrs: [],
      collaborations: [],
    };

    console.log('Preserving existing contributions by category (enforcing hierarchy).');
    const globalLoadedBy = new Map();

    const categoryOrder = Object.keys(finalContributions);
    for (const type of categoryOrder) {
      if (Array.isArray(allContributions[type])) {
        for (const item of allContributions[type]) {
          const url = item.url;
          const seen = globalLoadedBy.get(url);

          if (!seen) {
            finalContributions[type].push(item);
            globalLoadedBy.set(url, new Set([type]));
            continue;
          }

          const higherTier = new Set(['reviewedPrs', 'coAuthoredPrs']);
          if (higherTier.has(type)) {
            finalContributions[type].push(item);
            seen.add(type);
          } else {
            const hasHigher = Array.from(seen).some((c) => higherTier.has(c));
            if (!hasHigher) {
              finalContributions[type].push(item);
              seen.add(type);
            }
          }
          globalLoadedBy.set(url, seen);
        }
      }
    }

    console.log('Merging newly fetched contributions (enforcing category hierarchy).');
    for (const type of Object.keys(newContributions)) {
      if (Array.isArray(newContributions[type])) {
        for (const item of newContributions[type]) {
          const url = item.url;
          const existingIndex = finalContributions[type].findIndex((i) => i.url === url);

          if (existingIndex !== -1) {
            finalContributions[type][existingIndex] = item;
            const s = globalLoadedBy.get(url) || new Set();
            s.add(type);
            globalLoadedBy.set(url, s);
            continue;
          }

          const seen = globalLoadedBy.get(url);
          if (!seen) {
            finalContributions[type].push(item);
            globalLoadedBy.set(url, new Set([type]));
            continue;
          }

          const higherTier = new Set(['reviewedPrs', 'coAuthoredPrs']);
          if (higherTier.has(type)) {
            const idx = finalContributions['collaborations'].findIndex((i) => i.url === url);
            if (idx !== -1) finalContributions['collaborations'].splice(idx, 1);
            finalContributions[type].push(item);
            seen.add(type);
          } else {
            const hasHigher = Array.from(seen).some((c) => higherTier.has(c));
            if (!hasHigher) {
              finalContributions[type].push(item);
              seen.add(type);
            }
          }
          globalLoadedBy.set(url, seen);
        }
      }
    }

    for (const type of Object.keys(finalContributions)) {
      finalContributions[type].sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    await fs.writeFile(dataFile, JSON.stringify(finalContributions, null, 2), 'utf8');
    const grouped = groupContributionsByQuarter(finalContributions);

    // Generation
    await writeMarkdownFiles(grouped);
    const quarterlyHtmlLinks = await writeHtmlFiles(grouped);
    await createStatsReadme(finalContributions);
    await createIndexHtml(finalContributions);
    await createHtmlReports(quarterlyHtmlLinks);
    await createGlossaryHtml();

    // Cache persistence
    await fs.writeFile(cacheFile, JSON.stringify(Array.from(updatedPrCache)), 'utf8');
    const commitCacheObj = {};
    for (const [k, v] of usedCommitCache || mergedCommitCache) {
      commitCacheObj[k] = v;
    }
    await fs.writeFile(commitCacheFile, JSON.stringify(commitCacheObj, null, 2), 'utf8');

    console.log('Contributions update completed successfully.');
  } catch (e) {
    console.error(`Failed to update contributions: ${e.message}`);
    process.exit(1);
  }
}

main();
