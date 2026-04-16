# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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