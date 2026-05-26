# Bug Screenshot: DownloadItem Object Destroyed

## Source

- Raw file: [2026-05-26-downloaditem-object-destroyed.png](../../raw/bugs/2026-05-26-downloaditem-object-destroyed.png)
- Type: PNG screenshot
- Dimensions: 630 x 740
- Captured: 2026-05-26 3:26:36 PM local time, based on the original filename

## Extracted Text

```text
A JavaScript error occurred in the main process

Uncaught Exception:
TypeError: Object has been destroyed
at DownloadItem.<anonymous> (/Applications/watchy.app/Contents/Resources/app.asar/out/main/index.js:685:22)
at DownloadItem.emit (node:events:531:35)
```

## Visible Context

- The error appears in the packaged macOS app, not a development browser window.
- The underlying Watchy UI shows a media filename ending in `.mkv`, so the failure likely happened during or after a download-related flow.

## Related Wiki Pages

- [DownloadItem object destroyed crash](../bugs/downloaditem-object-destroyed.md)
