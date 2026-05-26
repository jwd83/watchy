# DownloadItem Object Destroyed Crash

## Summary

A packaged Watchy macOS app displayed an Electron main process crash dialog from a `DownloadItem` event handler. The exception says `TypeError: Object has been destroyed`, with the stack pointing to `DownloadItem.<anonymous>` in the bundled main process file. The user reported that the crash occurred while downloading.

## Evidence

- Source record: [Bug screenshot: DownloadItem object destroyed](../sources/2026-05-26-downloaditem-object-destroyed-screenshot.md)
- Raw screenshot: [2026-05-26-downloaditem-object-destroyed.png](../../raw/bugs/2026-05-26-downloaditem-object-destroyed.png)

## Observed Error

```text
Uncaught Exception:
TypeError: Object has been destroyed
at DownloadItem.<anonymous> (/Applications/watchy.app/Contents/Resources/app.asar/out/main/index.js:685:22)
at DownloadItem.emit (node:events:531:35)
```

## User-Reported Context

- The crash occurred while downloading.
- This note comes from the user report on 2026-05-26, not from additional screenshot text.

## Root Cause Hypothesis

The stack implicates a main-process `DownloadItem` callback in the packaged app. Because the user observed it during an active download, the likely failure mode was a download progress, completion, interruption, or cleanup callback trying to use an Electron object after it had been destroyed, such as a `BrowserWindow`, `webContents`, or event sender captured by the handler.

Code inspection supported this hypothesis: `src/main/index.js` captured `mainWindow` inside `DownloadItem` `updated` and `done` callbacks, then called `mainWindow.webContents.send(...)` without checking whether the window or `webContents` had been destroyed. The `will-download` listener was also registered per window without being removed when the window closed.

## Fix

- Added helper guards that only send `download:progress` through live `webContents`.
- Routed queue, progress, and completion notifications through the guarded send path.
- Wrapped `DownloadItem` field reads so a destroyed item cannot crash the main process while building progress payloads.
- Removed each window's `will-download` listener on close to prevent stale handlers from surviving into later windows.
- Ensured download queue cleanup still runs if adding to download history fails.

## Verification

- `npm run lint` passed.
- `npm run build` passed.

## Status

Fix implemented in `src/main/index.js`. Needs real download reproduction in the packaged app to confirm the original crash path is gone.
