# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-04-07

### Added

- **Automatic contribution detection**: Added logic to automatically identify the user's first contribution year via the GitHub API.
- **Streamlined configuration**: Removed the requirement to manually provide `SINCE_YEAR` in `config.js`.

### Fixed

- **Incomplete data fetching**: Fixed a bug where providing a `SINCE_YEAR` later than the actual first contribution caused the script to return partial results. The app now defaults to the true start date to ensure data integrity.

## [1.0.0] - 2026-03-27

- Initial release of the OSS project template.