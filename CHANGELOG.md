# Changelog

All notable changes to Mongonaut are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and Mongonaut uses
[semantic versioning](https://semver.org/spec/v2.0.0.html). While the version stays below 1.0,
configuration and behaviour may still change between minor releases.

Entries before 0.2.0 were reconstructed from the commit history, because releases up to that point
carried no written notes.

## [Unreleased]

### Added

* Readiness endpoint at `/api/ready`, reporting the running version, MongoDB connectivity and the resolved authentication configuration.
* OCI image labels, so `docker inspect` identifies source, documentation, vendor and license on any image, including one built locally.
* Published images now carry a software bill of materials and a full provenance attestation.

### Changed

* The container health check now uses `/api/ready` instead of `/api/health`, so a container no longer reports healthy while MongoDB is unreachable. `/api/health` stays a pure liveness probe and does not touch the database.
* `package.json` carries description, repository, homepage, bugs, keywords and a Node.js engine constraint.
* `react-scan` moved from runtime to development dependencies. It was already excluded from production behaviour.

### Fixed

* Saving a document no longer silently overwrites somebody else's change. Every document is handed to the browser with a revision, and a save whose revision no longer matches the stored document is refused with a conflict notice instead of replacing the newer version.
* Exporting now follows the query on screen. A filter, a sort or an aggregation pipeline is applied to the export, where previously the export always returned the beginning of the unfiltered collection.
* A filtered query no longer fails because the exact document count exceeds the query budget. The count falls back to unknown and the matching documents are still returned.
* The release workflow no longer aborts when the release commit already contains the version bump. That failure left 0.1.7 tagged on GitHub without a published container image.
* A prerelease tag no longer moves the `latest` image tag.

## [0.1.7] 2026-09-16

### Changed

* Updated to the MongoDB Node.js driver v7.
* Collection pages ship 46 percent less JavaScript.

### Fixed

* BSON types survive editing in every path, and server side authorization was hardened.

## [0.1.1] to [0.1.6] 2026-06-19

### Added

* The resolved environment configuration is logged at startup, with secrets reduced to their length.

### Fixed

* The setup and administration pages render dynamically, so authentication settings supplied at container start are read correctly.
* A missing or too short `MONGONAUT_AUTH_SECRET` now surfaces as a misconfiguration notice on the page instead of a redirect loop.

## [0.1.0] 2026-06-19

### Added

* `ACCOUNT` authentication mode with built in accounts, per database and per collection grants, an administrator flag and server side authorization.
* Administrator password recovery through a command inside the container.
* A shared JSON editor dialog behind both creating and editing documents.

### Fixed

* The recovery script is included in the runtime image.
* Sidebar skeleton widths are derived deterministically, removing a hydration mismatch.

## [0.0.1] 2026-06-18

### Added

* First non prerelease build: browsing databases and collections, paginated document browsing, filters, sorting and aggregation pipelines, document editing, collection management, index management, JSON import and export, read only mode, and the `NONE`, `STATIC_PASSWORD` and `OIDC` authentication modes.
* Rebuilt sidebar with a context menu and aggregation backed search.
* Container images for Linux on AMD64 and ARM64 through the GitHub Container Registry.

[Unreleased]: https://github.com/withzu/mongonaut/compare/v0.1.7...HEAD
[0.1.7]: https://github.com/withzu/mongonaut/compare/v0.1.6...v0.1.7
[0.1.6]: https://github.com/withzu/mongonaut/compare/v0.1.0...v0.1.6
[0.1.1]: https://github.com/withzu/mongonaut/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/withzu/mongonaut/compare/v0.0.1...v0.1.0
[0.0.1]: https://github.com/withzu/mongonaut/releases/tag/v0.0.1
