// --- Core Configuration Variables ---
// GITHUB_USERNAME is used to fetch and identify your contribution history.
const GITHUB_USERNAME = 'your-github-username';
const BASE_URL = 'https://api.github.com';

// --- Configuration to generate README in the contributions folder ---
const BASE_DIR = 'contributions';
const path = require('path');

module.exports = {
  GITHUB_USERNAME,
  BASE_URL,
  BASE_DIR,
};
