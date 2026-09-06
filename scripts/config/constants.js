const { generateColorsObject } = require('../utils/color-helpers');
const { THEME, THEME_TOKENS_CSS, mixHex } = require('./theme-engine');
const { generateFaviconSvg, encodeSvg } = require('../utils/icon-processor');
const {
  LANDING_PAGE_ICONS,
  LEFT_ARROW_SVG,
  RIGHT_ARROW_SVG,
  SEARCH_SVG,
  PULL_REQUEST_LARGE_SVG,
  INFO_ICON_SVG,
  FAVICON_SVG_RAW_TEMPLATE,
} = require('./icons');

/**
 * LEGACY COLOR SURFACE — derived, not configured.
 *
 * Every value below comes from the five seeds in scripts/config/theme.js via
 * theme-engine.js (which also WCAG-gates the derivations). The exports keep
 * their historical names and shapes so existing generators continue to work
 * unchanged; new code should prefer the `--t-*` tokens in THEME_CSS_VARS.
 *
 * Semantic mapping:
 *   primary  → brand seed
 *   success  → positive ladder
 *   merged   → the fixed `merged` ladder (GitHub's own merged-PR purple)
 *   error    → critical ladder
 */
const S = THEME.semantic;
const L = THEME.light;
const D = THEME.dark;

const COLOR_PALETTE = {
  primary: THEME.seeds.brand,
  primary900: S.brand.light.strong,
  neutral: THEME.seeds.neutral,
  success: THEME.seeds.positive,
  merged: THEME.seeds.positive,
  error: THEME.seeds.critical,
  textPrimary: L.ink,
  textSecondary: L.ink2,
  textMuted: mixHex(L.ink2, L.ink3, 0.5),
};

/**
 * Dark-mode counterparts. `primary` and `primary900` intentionally stay on
 * the light-theme values: both are used as solid fills paired with on-brand
 * text (nav bar, hero cards, progress bars), and brightening them would
 * break that contrast.
 */
const COLOR_PALETTE_DARK = {
  primary: THEME.seeds.brand,
  primary900: S.brand.light.strong,
  neutral: S.neutral.dark.text,
  success: S.positive.dark.text,
  merged: S.positive.dark.text,
  error: S.critical.dark.text,
  textPrimary: D.ink,
  textSecondary: D.ink2,
  textMuted: D.ink3,
};

/**
 * Single-value (non-laddered) tokens.
 */
const FLAT_COLOR_TOKENS = {
  'c-bg-surface': { light: L.card, dark: D.card },
  'c-accent-yellow': { light: S.caution.light.text, dark: S.caution.dark.text },
  'c-primary-text': { light: S.brand.light.text, dark: S.brand.dark.text },
};

// Generate theme-ready colors (every leaf is a CSS var() reference)
const { colors: COLORS, cssVarsBlock: PALETTE_CSS_VARS } = generateColorsObject(
  COLOR_PALETTE,
  COLOR_PALETTE_DARK,
  FLAT_COLOR_TOKENS
);

/**
 * Status badges (quarterly report tables) render at 12px — small text, so
 * they need the full 4.5:1 AA ratio. Route status colors through the
 * theme-engine's semantic ladder instead of the generic 10% opacity tint:
 * its `wash` is already searched per-seed to keep `text` readable on top of
 * it (see theme-engine.js).
 */
COLORS.status = {
  green: { bg: 'var(--t-positive-wash)', text: 'var(--t-positive)' },
  purple: { bg: 'var(--t-merged-wash)', text: 'var(--t-merged)' },
  red: { bg: 'var(--t-critical-wash)', text: 'var(--t-critical)' },
  gray: { bg: 'var(--t-neutral-wash)', text: 'var(--t-neutral)' },
};

// Generate browser-ready favicon
const FAVICON_SVG_ENCODED = encodeSvg(
  generateFaviconSvg(FAVICON_SVG_RAW_TEMPLATE, COLOR_PALETTE.primary)
);

/**
 * Combined `:root{...} html.dark{...}` CSS variable declarations for every
 * color token used across the site: the legacy laddered vars, and the
 * `--t-*` design tokens from the theme engine.
 */
const THEME_CSS_VARS = `${PALETTE_CSS_VARS}\n${THEME_TOKENS_CSS}`;

module.exports = {
  LANDING_PAGE_ICONS,
  LEFT_ARROW_SVG,
  RIGHT_ARROW_SVG,
  SEARCH_SVG,
  FAVICON_SVG_ENCODED,
  PULL_REQUEST_LARGE_SVG,
  INFO_ICON_SVG,
  COLORS,
  COLOR_PALETTE,
  THEME_CSS_VARS,
  THEME,
};
