# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]

## 1.0.4 – 2023-03-21
### Changed
- get quota directly with PROPFIND on root dir, no extra request except after uploading if picker is not closed
- optional button to refresh quota

## 1.0.3 – 2023-03-07
### Fixed
- computed quota value

## 1.0.2 – 2023-02-07
### Added
- new option to avoid closing the picker on error

## 1.0.0 – 2022-12-12
### Added
- new prop/param to disable previews

### Changed
- update all npm pkgs
- adjust to new eslint config
- adjust to @nextcloud/vue 7.2.0 (mostly style issues with breadcrumb, popover)

## 0.0.26 – 2022-09-07
### Fixed
- Don't stop everything if there's an error when getting the quota

## 0.0.11 – 2021-02-04
### Added
- public link creation

## 0.0.1 – 2020-09-02
### Added
* the filepicker
