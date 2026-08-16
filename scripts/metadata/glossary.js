/**
 * Metadata for the Glossary page.
 */
const GLOSSARY_CONTENT = {
  title: 'Glossary',
  subtitle: `A comprehensive explanation of the terms and categories used to track open source impact, detailing how contribution data is collected, sorted, and calculated within Open Source Portfolio.`,

  sections: [
    {
      id: 'portfolioWide',
      title: 'Portfolio-wide Metrics',
      description:
        'Terms used on the main page and README to show the total work done across the full span of open source activity.',
      items: [
        {
          id: 'totalImpact',
          title: 'Total Impact',
          description:
            'The total number of all recorded contributions since the very first activity on GitHub.',
          howItIsCalculated:
            'Adds the grand total of merged PRs, issues, reviewed PRs, co-authored PRs, and community collaborations.',
        },
        {
          id: 'activeSince',
          title: 'Active Since',
          description: 'The year of the first recorded contribution found on GitHub.',
          howItIsCalculated:
            'Identifies the date of the very first contribution found in the data to set the starting point for the history.',
        },
        {
          id: 'totalImpactedRepos',
          title: 'Impacted Repos',
          description: 'The total number of open source projects with at least one contribution.',
          howItIsCalculated:
            'Identifies every unique external repository containing at least one recorded contribution.',
        },
        {
          id: 'primaryFocusProjects',
          title: 'Primary Focus Projects',
          description:
            'The top three repositories where the highest contributions have occurred since the first year of contribution.',
          howItIsCalculated:
            'Ranks all tracked repositories by lifetime contribution volume and selects the top three.',
        },
        {
          id: 'persona',
          title: 'Collaboration Profile',
          description: 'A role assigned based on the primary way of contributing to the community.',
          howItIsCalculated:
            'Analyzes contribution frequency across all categories to assign a role, such as "Community Mentor" for high review volumes.',
        },
      ],
    },
    {
      id: 'quarterlyReports',
      title: 'Quarterly Reports',
      description: 'How the data is organized into quarters to make it easy to find and read.',
      items: [
        {
          id: 'reportsIndex',
          title: 'Reports Index',
          description:
            'The main list of the portfolio. It organizes all work into separate pages grouped by year and three-month periods (quarters).',
          source:
            'The **Quarterly Reports** page works like a folder, displaying the total contributions for each year and its corresponding three-month periods.',
        },
      ],
    },
    {
      id: 'quarterlyMetrics',
      title: 'Quarterly Report Metrics',
      description:
        'Terms used inside individual reports to explain work done during a specific three-month window.',
      items: [
        {
          id: 'stats',
          title: 'Quarterly Statistics',
          description:
            'A summary that shows the total work and the projects involved during a specific three-month period.',
          howItIsCalculated:
            'Aggregates all contribution types and unique repositories involved within a specific three-month window.',
        },
        {
          id: 'focusProjects',
          title: 'Top 3 Repositories',
          description:
            'The projects that received the most work and attention within each quarter.',
          howItIsCalculated:
            'Ranks repositories by the volume of contributions performed during the quarter.',
        },
        {
          id: 'merged',
          title: 'Merged PRs',
          description: 'A record of PRs that were accepted and added to external repositories.',
          howItIsCalculated:
            'Identifies PRs with a merged status and calculates the **Review Period** as the time from the first proposal to final acceptance.',
        },
        {
          id: 'issues',
          title: 'Issues',
          description:
            'A record of technical discoveries, bug reports, and feature proposals created on external repositories.',
          howItIsCalculated:
            'Collects all authored issues regardless of assignment. It calculates the **Closing Period** as the time from the initial opening until the issue is finished.',
        },
        {
          id: 'reviewed',
          title: 'Reviewed PRs',
          description: 'A record of formal reviews provided on PRs within external repositories.',
          howItIsCalculated:
            'Measures the **Review Period** from the creation of the PR to the submission of the formal review, while tracking the **Status** and **Last Update** columns for the current state and the most recent activity.',
        },
        {
          id: 'coAuthored',
          title: 'Co-Authored PRs',
          description:
            'A record of PRs where contributions were made directly to the code alongside other developers.',
          howItIsCalculated:
            'Identifies credit via co-author commit information. The **Commit Period** spans from the creation of the PR to the first code contribution to indicate when the collaboration started. The **Status** and **Last Update** columns track the current state and the most recent activity.',
        },
        {
          id: 'collaborations',
          title: 'Collaborations',
          description:
            'A record of participation in discussions within issues or PRs authored by others in external repositories.',
          howItIsCalculated:
            'Tracks comments on PRs and issues unless or until they are officially reviewed.',
        },
      ],
    },
    {
      id: 'highlights',
      title: 'Highlights',
      description:
        'A hand-picked selection of best work.',
      items: [
        {
          id: 'highlightEntry',
          title: 'Highlight',
          description:
            'A manually added entry — an award, a project, a talk, or anything else worth featuring — along with the story behind it.',
          source:
            'Added by editing `data/highlights.json` directly. Unlike the rest of the portfolio, highlights are not fetched automatically.',
        },
        {
          id: 'highlightType',
          title: 'Type & Icon',
          description:
            'The label and emoji shown on each highlight card, such as "🏆 Award" or "🛠 Project".',
          source: 'Picked from a predefined list, or set freely with a custom `type` and `icon`.',
        },
      ],
    },
  ],
};

module.exports = { GLOSSARY_CONTENT };
