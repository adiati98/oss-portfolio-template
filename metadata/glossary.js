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
            'The grand total of merged PRs, issues, reviewed PRs, co-authored PRs, and community collaborations.',
        },
        {
          id: 'activeSince',
          title: 'Active Since',
          description: 'The year of the first recorded contribution found on GitHub.',
          source:
            'The date of the very first contribution found in the data, setting the starting point for the history.',
        },
        {
          id: 'totalImpactedRepos',
          title: 'Impacted Repos',
          description: 'The total number of open source projects with at least one contribution.',
          howItIsCalculated:
            'The count of every repository owned by others that contains at least one contribution found in the data.',
        },
        {
          id: 'primaryFocusProjects',
          title: 'Primary Focus Projects',
          description:
            'The top three repositories where the highest contributions have occurred since the first year of contribution.',
          howItIsCalculated:
            'The system ranks all tracked repositories by total lifetime contribution volume and identifies the top three as the primary projects of contribution.',
        },
        {
          id: 'persona',
          title: 'Collaboration Profile',
          description: 'A role assigned based on the primary way of contributing to the community.',
          howItIsCalculated:
            'The system analyzes which type of work is performed most frequently. For example, a high volume of reviewed PRs results in a "Community Mentor" profile.',
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
            'The system adds up all types of work and the number of repositories involved to show the total amount of contribution for that quarter.',
        },
        {
          id: 'focusProjects',
          title: 'Top 3 Repositories',
          description:
            'The projects that received the most work and attention within each quarter.',
          howItIsCalculated:
            'The system ranks repositories by the amount of contributions to show where the most effort was spent.',
        },
        {
          id: 'merged',
          title: 'Merged PRs',
          description: 'A record of PRs that were accepted and added to external repositories.',
          howItIsCalculated:
            'All work that was finalized (merged). The **Review Period** shows the time from the first proposal to the final acceptance.',
        },
        {
          id: 'issues',
          title: 'Issues',
          description:
            'A record of technical discoveries, bug reports, and feature proposals created on external repositories.',
          howItIsCalculated:
            'Includes all authored issue threads regardless of assignment. The **Closing Period** shows the time from the opening of an issue until it is finished.',
        },
        {
          id: 'reviewed',
          title: 'Reviewed PRs',
          description: 'A record of formal reviews provided on PRs within external repositories.',
          howItIsCalculated:
            'The system measures the **Review Period** from the creation of the PR to the final review to highlight efficiency. The **Status** and **Last Update** columns track the current state and the most recent activity.',
        },
        {
          id: 'coAuthored',
          title: 'Co-Authored PRs',
          description:
            'A record of PRs where contributions were made directly to the code alongside other developers.',
          howItIsCalculated:
            'The system identifies credit via co-author commit information. The **Commit Period** spans from the creation of the PR to the first code contribution, indicating when the collaboration started. The **Status** and **Last Update** columns track the current state and the most recent activity.',
        },
        {
          id: 'collaborations',
          title: 'Collaborations',
          description:
            'A record of joining discussions within issues or PRs authored by others in external repositories.',
          howItIsCalculated:
            'The system tracks engagement with other contributors and maintainers to help move a task toward completion.',
        },
      ],
    },
  ],
};

module.exports = { GLOSSARY_CONTENT };
