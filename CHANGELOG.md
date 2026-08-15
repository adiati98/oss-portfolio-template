# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.3.0] - 2026-08-15

### Added

- **Theme engine**: Ported a light/dark/system theme engine (`scripts/config/theme.js` + `theme-engine.js`) with WCAG-gated derived color tokens, adapted so brand colors stay customizable via five seed colors.
- **Theme toggle**: Added a theme dropdown, skip-to-content link, and back-to-top button to the navbar.

### Changed

- **Design system overhaul**: Rebuilt the navbar, footer, and landing page (impact band with a live "Last contribution Xh ago" indicator, contribution mix meters, primary focus, persona seal), and restyled the reports list, glossary, and per-quarter report pages to match.
- **Brand color configuration**: Moved brand colors from a flat palette in `constants.js` to `scripts/config/theme.js`; documented customization in the README.

## [2.2.0] - 2026-05-16

### Added

- **Date fallback properties**: Implemented a sequential fallback priority chain (`item.date` || `item.createdAt` || `item.closedAt` || `item.updatedAt`) in the quarter grouping logic to prevent records from missing prematurely.

### Changed

- **Status rendering consolidation**: Refactored the `quarterly-reports-generator.js` pipeline to replace custom inline HTML string construction for Reviewed PRs, Co-Authored PRs, and Collaborations with unified utility formatter calls (`getPrStatusContent` and `getCollaborationStatusContent`).
- **Deterministic dashboard highlights**: Aligned iterative mapping keys to use dictionary data keys and updated the conditional modifier to evaluate strictly against the active profile's key (`key === activePersonaKey`). This fixes competing highlights during exact mathematical ties and mirrors priority profile assignments cleanly.
- **Markdown highlight synchronization**: Updated the Markdown generator logic to dynamically apply bold formatting (`**`) to labels, counts, and percentages inside the contribution distribution table rows to perfectly match the HTML dashboard behavior.
- **Bot interaction logging**: Refactored evaluation pipelines to securely catalog bot interactions under collaborations if tracking metrics like `firstCommentDate` exist, rather than skipping them entirely.

### Fixed

- **Stale commit evaluation**: Added a validation check to compare commit author dates directly against `prCreatedAt`, ensuring historical commits originating from a base or upstream branch are not counted as active contributions.
- **Pull request date metrics**: Updated the "Merged PRs" matrix to utilize `item.mergedAt || item.closedAt`, guaranteeing accurate review periods even when strict merge attributes are absent from raw payloads.
- **Missing date warnings**: Introduced an explicit verification step and `console.warn` logging to capture structural anomalies prior to discarding entries with missing date references.

# [2.1.0] - 2026-04-22

### Added

- **Quarterly Report Status Badges**: Implemented shields.io colored badges (OPEN, MERGED, CLOSED) in the `quarterly-reports-generator.js` for contribution history.

## [2.0.0] - 2026-04-19

### Changed

- **Node.js Requirement**: Updated the minimum required Node.js version to `^22.0.0` in `package.json` and synchronized GitHub Actions workflows to ensure environment consistency.
- **Contribution-centric landing page**: Promoted the comprehensive contribution visualization to the root `index.html`.
- **Breaking Change (URL Restructuring)**: Moved the detailed contribution view from `all-contributions.html` to the primary landing page (`index.html`). Users hosting this portfolio should update any external links accordingly, if necessary.
- **UI and accessibility improvements**: Refined the layout for better scannability and increased font sizes for small text elements to improve overall readability.
- **Logic integration**: Consolidated the contribution generation logic into the main index generator.
- **Metadata centralization**: Moved persona categories and definitions to a dedicated metadata folder to decouple data from generation logic.

### Added

- **Glossary page**: Created a standalone Glossary page that provides a comprehensive explanation of terms and categories used to track open source impact. It details how contribution data is collected, sorted, and calculated.

### Removed

- **Redundant generator**: Removed `all-contributions-html-generator.js` as its functionality is now handled by the main index generator.

## [1.1.3] - 2026-04-16

### Added
- **Dual-mode synchronization**: Implemented logic to distinguish between daily incremental updates and monthly full-history syncs via GitHub Actions cron schedules.

### Changed
- **Workflow refactoring**: Redesigned the `demo-trigger` and `update-contributions` workflows to use a "Sender-Receiver" architecture for more reliable automation.

### Security
- **Secure API Signal**: Implemented hardened environment variable mapping to prevent sensitive token leakage in workflow logs.
- **Input Sanitization**: Replaced direct shell interpolation with environment variable mapping to prevent potential shell injection from workflow inputs.

## [1.1.2] - 2026-04-16

### Added
- **New helper module**: Introduced `html-helpers.js` to centralize HTML-specific utility functions.
- **Color extraction safety**: Added `getColorValue` to `color-helpers.js` to safely handle color object variants and provide fallbacks.

### Changed
- **Internal Refactoring**: Moved and centralized logic for `hexToRgb`, `rgbToRgba`, and color variant generation to improve codebase maintainability.

### Security
- **Attribute Sanitization**: Implemented `sanitizeAttribute` to prevent malformed HTML and improve protection against injection in attribute strings.

## [1.1.1] - 2026-04-13

### Fixed
- **Clean script crash**: Fixed an `ENOTDIR` error in the cleaning script that occurred when attempting to process individual files instead of directories. The script now correctly handles both files and folders in the target list.

## [1.1.0] - 2026-04-07

### Added
- **Automatic contribution detection**: Added logic to automatically identify the user's first contribution year via the GitHub API.
- **Streamlined configuration**: Removed the requirement to manually provide `SINCE_YEAR` in `config.js`.

### Fixed
- **Incomplete data fetching**: Fixed a bug where providing a `SINCE_YEAR` later than the actual first contribution caused the script to return partial results. The app now defaults to the true start date to ensure data integrity.

## [1.0.0] - 2026-03-27

- Initial release of the OSS project template.