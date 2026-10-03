const PERSONA_CATEGORIES = [
  {
    title: 'Community Mentor',
    desc: 'Expert advocate for code quality and peer development. Code review and technical guidance ensure high standards across the community.',
    priority: 1,
    key: 'reviewedPrCount',
  },
  {
    title: 'Core Contributor',
    desc: 'Main driver of project development. Responsible for moving features from concept to production through robust code and resolving complex bugs to ensure software stability.',
    priority: 2,
    key: 'prCount',
  },
  {
    title: 'Project Architect',
    desc: 'Strategic problem-solver focused on technical discovery. Skilled at identifying critical system issues and defining feature planning that shapes the long-term technical roadmap.',
    priority: 3,
    key: 'issueCount',
  },
  {
    title: 'Collaborative Partner',
    desc: 'Focused on shared project success. Pair programming and co-authoring code delivers high-impact value through collective development effort.',
    priority: 4,
    key: 'coAuthoredPrCount',
  },
  {
    title: 'Ecosystem Partner',
    desc: 'Community builder focused on technical discussion and engagement. Facilitates collaboration through project discussions to ensure the open source ecosystem remains vibrant and interconnected.',
    priority: 5,
    key: 'collaborationCount',
  },
];

const DEFAULT_PERSONA = {
  title: 'Open Source Contributor',
  desc: 'Active member of the global open source community.',
};

module.exports = { PERSONA_CATEGORIES, DEFAULT_PERSONA };
