/**
 * THEME SEEDS — the only file to edit to re-brand the entire portfolio.
 *
 * Five required seed colors. Every tint, wash, hairline, dark-mode variant,
 * and status color across the site is DERIVED from these at build time
 * (see theme-engine.js), and every derived text/surface pairing is checked
 * against WCAG AA. If a seed can't produce readable derivatives, the build
 * fails and names the offending seed.
 *
 *   brand    — identity: nav, links, timeline spine, focus rings, meters
 *   positive — merged, approved, "your court is clear"
 *   caution  — take action, aging reviews, rate-limit banners
 *   critical — blocked, failed fetches, destructive states
 *   neutral  — seeds the gray family: muted text, hairlines, stale items
 *
 * Optional overrides (omit them and they are derived from the five seeds):
 *   accent   — playful highlight (persona seal); defaults to a hue-rotated
 *              brand
 *   surface  — light-theme page background; defaults to a 2% brand-biased
 *              off-white
 *   ink      — light-theme text color; defaults to a brand-biased near-black
 */
module.exports = {
  brand: '#4338CA', // your main brand color
  positive: '#10b981', // color for open/positive items
  caution: '#A16207', // color for items that need attention
  critical: '#ef4444', // color for closed/blocked items
  neutral: '#6b7280', // color for muted text and borders

  // Optional — uncomment any of these to override their derived default:
  accent: '#FB750B', // a second color for playful highlights, like the persona badge
  // surface: '#F6F6F9', // background color for light mode
  // ink: '#1B1D28', // main text color for light mode
};
