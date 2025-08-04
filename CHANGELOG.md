# Changelog

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

## [0.3.2] - 2025-08-04

### Added

- Add tests for resources/screenshots addScreenshot() and handler()

### Changed

- Avoid adding screenshot Resource with the same ID
- Tweak logger implementation in utils/logger

## [0.3.1] - 2025-08-03

### Changed

- Release version 0.3.1
- Move the browser util into src/tools folder

## [0.3.0] - 2025-08-03

### Added

- Accept colorScheme argument for screenshots (dark mode support)
- Introduce shared capture utility for screenshots
- Add standardized MCP tools response helper

### Changed

- DRY up MCP tool response handling
- Refactor screenshot tools to use shared capture util

### Chore

- Bump version to 0.3.0

## [0.2.0] - 2025-08-03

### Added

- Create a tool for URL screenshots
- Introduce shared browser utility (getBrowser)
- Add new utils: delay and env helpers
- Extend index exports for new tools

### Changed

- Streamline createWebpageUrlScreenshot implementation
- Stop using .js extensions in internal imports
- Rewrite AI agent guidelines
- Update docs and installation instructions

### Removed

- Remove unneeded environment variables

### Docs

- Add AI/human coding guidelines
- Update README with new features and usage

### Chore

- Merge feat/url-screenshot branch
- Release version 0.2.0

## [0.1.2] - 2025-08-02

## [0.1.1] - 2025-08-02

### Changed

- Release 0.1.1
- Fix release metadata and packaging

## [0.1.0] - 2025-08-02

### Added

- Initial tool to make a screenshot of a webpage file
- Save screenshots to MCP resource store
- Implement logger with --debug <path>
- Add CLI parseDebugArgs utility and tests

### Changed

- Refactor logger setup and access
- Export handlers and utilities directly from source files
- Update README with setup and usage

### Chore

- Install Playwright and update dependencies

## [0.0.1] - 2025-07-17

### Added

- Initial commit with README.md
