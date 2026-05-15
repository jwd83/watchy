# YOURAPP — Clean-Room Rebuild Guide

YOURAPP is an Electron desktop app for searching P2P torrent content, caching it through AllDebrid, and streaming directly to VLC Media Player. It features a media catalog with IMDb metadata for autocomplete, a library/history system, and a download queue.

---

## Architecture

Electron three-process model:

```
┌─────────────┐    IPC (invoke/handle)    ┌──────────────┐
│  Renderer    │ ◄──────────────────────► │  Main Process │
│  (React UI)  │                          │  (Services)   │
└─────────────┘                           └──────────────┘
       ▲                                         │
       │  contextBridge                          │
┌──────┴──────┐                           ┌──────┴──────┐
│  Preload     │                           │  Services    │
│  (IPC bridge)│                           │  (singletons)│
└─────────────┘                           └──────────────┘
```

**IPC pattern**: Every API call flows `window.api.method()` → `ipcRenderer.invoke('api:method')` → `ipcMain.handle('api:method')`. All channels prefixed with `api:`.

---

## External APIs & Endpoints

### Apibay (Torrent Search)
- **URL**: `https://apibay.org/q.php?q={query}&cat=0`
- **Auth**: None
- **Returns**: JSON array of `{ info_hash, name, seeders, leechers, size, imdb, category }`

### AllDebrid v4 (Legacy)
- **Base**: `https://api.alldebrid.com/v4`
- **Auth**: API key as `apikey` query parameter, `agent` param required
- **Endpoints**:
  - `GET /magnet/upload?magnets[]={magnet}&agent=YOURAPP&apikey={key}` — Upload magnet
  - `GET /magnet/status?id={id}&agent=YOURAPP&apikey={key}` — Poll magnet status
  - `GET /link/unlock?link={link}&agent=YOURAPP&apikey={key}` — Unlock hoster link to direct URL

### AllDebrid v4.1
- **Base**: `https://api.alldebrid.com/v4.1`
- **Auth**: `Authorization: Bearer {apikey}` header
- **Endpoints**:
  - `POST /magnet/status` — Body: `id={magnetId}` or `status=active|ready`
  - `POST /magnet/files` — Body: `id[]={id1}&id[]={id2}...` — Get file list with download links

### VLC Media Player (Local Binary)
- macOS: `/Applications/VLC.app/Contents/MacOS/VLC`
- Windows: `C:\Program Files\VideoLAN\VLC\vlc.exe`
- Linux: `vlc` (from PATH)
- Args: `--fullscreen --no-video-title-show {url}` (optional: `--input-slave={subtitleUrl}`)

---

## Services (`src/main/services/`)

### allDebrid.js
AllDebrid API client. Stores API key in electron-store (`alldebrid_api_key`). Methods:
- `uploadMagnet(magnet)` — v4 GET, returns `{ magnets: [{ id, hash, name, ready }] }`
- `getStatusV41({ id?, status? })` — v4.1 POST, Bearer auth
- `getFiles(ids)` — v4.1 POST `/magnet/files`, returns nested file structure
- `unlockLink(link)` — v4 GET, returns direct streaming URL
- `getStatus(id)` — v4 legacy, kept for fallback

### scraper.js
Searches Apibay. Single method:
- `search(query)` — Sanitizes query (strips apostrophes, collapses whitespace), returns array of `{ title, seeds, leeches, size, magnet, link, imdb, category }`
- `formatSize(bytes)` — Converts bytes to human-readable string

### vlc.js
Spawns VLC as a detached child process. Single method:
- `play(input, subtitleUrl?)` — Decodes URI, spawns VLC with fullscreen args, unref's process

### library.js
CRUD operations over electron-store. Manages:
- **Saved searches**: `{ id, query, savedAt }` — deduped by query
- **Saved magnets**: `{ id, title, magnet, size, seeds, leeches, savedAt, imdbId?, canonicalTitle? }` — deduped by magnet URI
- **Watch history**: `{ id, magnetHash, magnetTitle, files: [{ filename, streamUrl, playedAt, playCount }], firstPlayedAt, lastPlayedAt }` — per-file tracking within entries
- **Download history**: `{ id, filename, magnetTitle, state, savePath, receivedBytes, totalBytes, completedAt }`
- **Magnet ID cache**: Maps torrent hash → AllDebrid magnet ID for instant re-lookups
- **Settings**: `showNsfw` boolean

### mediaCatalog.js
Reads `media_catalog.db` (SQLite, readonly). Table: `media_catalog` with columns `Title, Year, IMDbID, Type, primary_genre, runtime, Rating, Votes`. Methods:
- `suggest(query, limit)` — LIKE search, prefix matches first, sorted by votes desc, returns `{ title, year, imdbId, type, primaryGenre, runtime, rating, votes }`
- `lookupByImdbIds(ids)` — Batch lookup, returns `Map<imdbId, { title, year, imdbId, rating }>`

You will need to build your own `media_catalog.db` from the public IMDb datasets available at `https://datasets.imdbws.com/`. The relevant files are `title.basics.tsv.gz` (titles, years, types, genres, runtimes) and `title.ratings.tsv.gz` (ratings, vote counts). Parse and import these into a SQLite database matching the schema above.

---

## Data Persistence

### electron-store keys
| Key | Type | Description |
|-----|------|-------------|
| `alldebrid_api_key` | string | AllDebrid API key |
| `showNsfw` | boolean | NSFW content filter toggle |
| `savedSearches` | array | Saved search queries |
| `savedMagnets` | array | Bookmarked magnets with metadata |
| `history` | array | Watch history with per-file tracking |
| `downloadHistory` | array | Completed/failed download records |
| `magnetIdMap` | object | Hash → AllDebrid magnet ID cache |

---

## Major Screens

### Search View (default)
- **SearchBar**: Text input with debounced autocomplete (150ms). Suggestions come from `mediaCatalog.suggest()`. Selecting a suggestion formats as `"Title (Year) [tt1234567]"`. Keyboard nav: arrows, Tab, Enter, Escape.
- **Results list**: Grid of `ResultCard` components. Each shows title (canonical from catalog or original torrent name), episode info for TV (parses S01E05 patterns), seed/leech counts, file size, bookmark toggle.
- **File list**: When a result is selected, files appear in `FileUserInterface`. Filters to video extensions (.mp4, .mkv, .avi, .mov, .wmv). Natural sort for episodes. Auto-detects subtitle files (.srt, .sub, .ass, .ssa, .vtt) matching video filenames. Actions: Play in VLC, Download, Copy all links, Download all.

### Library View
Two tabs:
- **My Library**: Saved magnets grouped by canonical title. Shows metadata, date added. Click to reload files.
- **Saved Searches**: Quick-execute list. Click to re-run search.
- Filter input searches both tabs.

### History View
- Groups by magnet (hash + title). Shows per-file play count and last-played date.
- Actions: Play again, Reset watched state, View all files (reconstructs magnet), Clear all.

### Downloads View
- **Active downloads**: Progress bars with states (queued/yellow, progressing/violet, completed/green, failed/red). Max 3 concurrent. Completed items show Open Folder and Play in VLC buttons.
- **Download history**: Grouped by magnet title, collapsible. Per-file timestamps and status.
- **Overlay variant**: Fixed bottom-right mini-view during downloads, auto-hides 4s after completion.

### Settings Modal
- Blur backdrop modal. Password input for AllDebrid API key. Opens automatically on first launch if no key is stored.

### Status Modal & Toast
- **StatusModal**: Bottom-left. Loading (spinner, persistent), Success (green, 2.5s auto-dismiss), Error (red, 6s auto-dismiss). Slide-up animation.
- **Toast**: Bottom-right. Brief success/error notification, 3s auto-dismiss.

---

## Core Logic Flows

### Search Flow
1. User types in SearchBar → debounce 150ms → `mediaSuggest(query)` for dropdown
2. User selects suggestion or submits → `handleSearch(query)`
3. App detects `tt\d{7,8}` in query → uses only IMDb ID for actual P2P search
4. `scraper.search(imdbId)` → Apibay API → raw results
5. `mediaCatalog.lookupByImdbIds(imdbIds)` → enriches results with `catalogTitle`
6. Results rendered, NSFW filtered client-side (category 500–599 hidden unless toggled)

### Magnet Unlock Flow
1. User clicks a result → `handleSelectResult(result)`
2. **Fast path**: `getMagnetIdByHash(hash)` checks cache → if found, `getStatusV41({id})` + `getMagnetFiles([id])`
3. **Upload path**: If not cached, `allDebrid.uploadMagnet(magnet)` → cache ID via `setMagnetId(hash, id)`
4. If magnet not ready (still caching on AllDebrid), status modal shows progress
5. `flattenMagnetFilesResponse()` converts nested file tree to flat `[{ filename, link }]`
6. Fallback: Legacy `getStatus(id)` → `getFiles(link)` for each download link
7. `unlockLinksToFiles(links)` — batch unlock, filter to video files only

### Playback Flow
1. User clicks Play on a file → `handlePlay(url, filename, subtitleUrl?)`
2. `window.api.play(url, subtitleUrl)` → main process resolves AllDebrid link → spawns VLC
3. `library.recordPlay(hash, title, filename, streamUrl)` → updates or creates history entry, increments per-file `playCount`

### Download Queue Flow
1. User clicks Download → `window.api.download(url, { directory, magnetTitle })`
2. `DownloadQueue.add()` → if < 3 active, starts immediately; otherwise queues
3. Main process `will-download` event monitors progress → sends `download:progress` events to renderer
4. States: `queued` → `progressing` → `completed`/`failed`
5. On completion: `library.addToDownloadHistory()` records entry
6. Queue auto-processes next item when a slot opens

---

## UI Components 

| Component | Purpose |
|-----------|---------|
| `SearchBar.jsx` | Autocomplete input with keyboard nav, debounced suggestions |
| `ResultCard.jsx` | Torrent result card with episode parsing, seed/leech, bookmark |
| `FileUserInterface.jsx` | File list with video filter, natural sort, subtitle detection, play/download actions |
| `Library.jsx` | Two-tab view: saved magnets (grouped) + saved searches |
| `History.jsx` | Watch history grouped by magnet, per-file play tracking |
| `DownloadManager.jsx` | Active downloads + history, overlay and page variants |
| `StatusModal.jsx` | Loading/success/error indicator, bottom-left |
| `SettingsModal.jsx` | AllDebrid API key input modal |
| `Toast.jsx` | Brief notification popup, bottom-right |
