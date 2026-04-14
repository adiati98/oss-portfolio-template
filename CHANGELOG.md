# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-04-13

### Changed

- **Contribution-centric landing page**: Promoted the comprehensive contribution visualization to the root `index.html`.
- **Breaking Change (URL Restructuring)**: Moved the detailed contribution view from `all-contributions.html` to the primary landing page (`index.html`). Users hosting this portfolio should update any external links accordingly, if necessary.
- **UI and accessibility improvements**: Refined the layout for better scannability and increased font sizes for small text elements to improve overall readability.
- **Logic integration**: Consolidated the contribution generation logic into the main index generator.
- **Metadata centralization**: Moved persona categories and definitions to a dedicated metadata folder to decouple data from generation logic.

### Added

- **Glossary page**: Created a standalone Glossary page that provides a comprehensive explanation of terms and categories used to track open source impact. It details how contribution data is collected, sorted, and calculated.

### Removed

- **Redundant generator**: Removed `all-contributions-html-generator.js` as its functionality is now handled by the main index generator.

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