# Watchy Wiki Log

## [2026-05-26] setup | Initialize project wiki

- Created `raw/`, `notebook/`, and `wiki/` structure for Watchy.
- Added starter index and logging conventions.
- Added repository guidance for maintaining the wiki in `AGENTS.md`.

## [2026-05-26] ingest | DownloadItem object destroyed screenshot

- Filed screenshot evidence at `raw/bugs/2026-05-26-downloaditem-object-destroyed.png`.
- Added source record and bug synthesis page.

## [2026-05-26] update | Download context for object destroyed crash

- Added user-reported context that the crash occurred while downloading.

## [2026-05-26] fix | Guard download callbacks against destroyed Electron objects

- Updated `src/main/index.js` to send download progress only through live `webContents`.
- Added safe `DownloadItem` reads in progress and completion callbacks.
- Cleaned up the per-window `will-download` listener when the window closes.
- Verified with `npm run lint` and `npm run build`.
