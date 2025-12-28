# AGENTS.md

This file provides guidance to AGENTS when working with code in this repository.

## Project Overview

Watchy is an Electron desktop application for searching P2P content, caching it via AllDebrid, and streaming directly to VLC Media Player. Built with React, Tailwind CSS, and electron-vite.

## Common Commands

### Development

```bash
npm run dev              # Start in development mode with hot reload
npm start                # Preview built app
```

### Building

```bash
npm run build            # Build for all platforms
npm run build:mac        # Build for macOS
npm run build:win        # Build for Windows
npm run build:linux      # Build for Linux (portable: AppImage)
npm run build:unpack     # Build without packaging (faster for testing)
```

### Code Quality

```bash
npm run lint             # Run ESLint
npm run format           # Format code with Prettier
```

### Icons

```bash
npm run icon:generate    # Generate icons from source (uses convert-icon.js)
```

## Architecture

### Electron Process Structure

**Main Process** (`src/main/index.js`)

- Manages the browser window lifecycle
- Registers IPC handlers for renderer communication
- Coordinates between services (AllDebrid, scraper, VLC, library)

**Preload Script** (`src/preload/index.js`)

- Exposes safe IPC communication bridge between renderer and main
- All API methods are prefixed with `api:` in IPC channel names
- Uses `contextBridge` for security

**Renderer Process** (`src/renderer/src/App.jsx`)

- React-based UI with Tailwind CSS styling
- Manages application state (search results, file lists, library items)
- Four main views: Search, Library, History, and Downloads

### Service Layer

Services are singleton instances in `src/main/services/`:

**allDebrid.js**

- Handles AllDebrid API communication (magnet upload, status checks, link unlocking)
- Stores API key in electron-store
- Base URL: `https://api.alldebrid.com/v4`

**scraper.js**

- Searches P2P networks via Apibay API (`https://apibay.org`)
- Transforms torrent metadata into magnet links
- Returns structured results with seeds, leeches, size info

**vlc.js**

- Spawns VLC Media Player with streaming URLs
- Platform-specific VLC paths:
  - macOS: `/Applications/VLC.app/Contents/MacOS/VLC`
  - Windows: `C:\Program Files\VideoLAN\VLC\vlc.exe`

**library.js**

- Manages saved searches, saved magnets, watch history, and download history using electron-store
- Caches AllDebrid magnet IDs by torrent hash for faster lookups
- Prevents duplicate entries
- Uses ISO timestamps for sorting

**mediaCatalog.js**

- Reads a local SQLite database `media_catalog.db` (readonly) using `better-sqlite3`
- Provides autosuggest results for the search bar (title/year/type/rating/votes + IMDbID)
- IPC: exposed via `api:mediaSuggest` → `window.api.mediaSuggest(query, limit)`

**posters.js**

- Reads a local SQLite database `posters.db` (readonly) using `better-sqlite3`
- Stores poster images as webp BLOBs indexed by IMDbID
- Provides poster lookup by IMDbID, returning base64 data URLs for display
- IPC: exposed via `api:getPosters` → `window.api.getPosters(imdbIds)`

Notes on IMDbID searches:

- When a suggestion is chosen, the UI formats queries like: `Some Title (2024) [tt1234567]`
- `App.handleSearch()` will detect `tt\d{7,8}` anywhere in the query string and perform the actual P2P search using only the `tt...` token, while keeping the full string for saving/history clarity.
- Search suggestions display poster images (48x64px) on the left side when available from `posters.db`

### IPC Communication Pattern

All communication between renderer and main follows this pattern:

1. Renderer calls `window.api.methodName(args)`
2. Preload script invokes `ipcRenderer.invoke('api:methodName', args)`
3. Main process handles via `ipcMain.handle('api:methodName', handler)`
4. Returns Promise-based responses

### State Management

The app uses React hooks for state management in `App.jsx`:

- `results`: Current search results array
- `files`: Unlocked file list from AllDebrid
- `isLoading`: Global loading state
- `view`: Current view ('search', 'library', 'history', or 'downloads')
- `savedSearches`/`savedMagnets`: Library data synced from electron-store
- `history`: Watch history entries
- `currentMagnet`: Context for currently selected magnet (hash, title, etc.)
- `activeDownloads`: Live snapshot of in-progress downloads
- `downloadHistory`: Persisted download history

### AllDebrid Workflow

1. User selects a search result → `unlock` API uploads magnet
2. Poll `getStatus` until magnet status is 4 (Ready)
3. Extract download links from status response
4. For each link, call `getFiles` to unlock and get stream URL
5. Pass stream URLs to VLC for playback

### Styling

Tailwind CSS with custom theme in `tailwind.config.js`:

- Background: `#0f172a` (slate-900)
- Surface: `#1e293b` (slate-800)
- Primary: `#3b82f6` (blue-500)
- Accent: `#8b5cf6` (violet-500)
- Custom animations: `slide-up` for toast notifications

## Important Files

- `electron-builder.yml`: Build configuration for packaged apps
- `electron.vite.config.mjs`: Vite configuration for main/preload/renderer processes
- `convert-icon.js`: Icon generation utility for different platforms
- `postcss.config.js`: PostCSS configuration for Tailwind

## Development Notes

### Adding New API Endpoints

1. Add service method in appropriate `src/main/services/*.js` file
2. Register IPC handler in `src/main/index.js` using `ipcMain.handle('api:methodName', ...)`
3. Expose method in `src/preload/index.js` via the `api` object
4. Call from renderer using `window.api.methodName()`

### Native Node Modules (Electron)

This repo uses native modules (e.g. `better-sqlite3`) that must be rebuilt against Electron.

- If you add/update a native dependency and see a `NODE_MODULE_VERSION` mismatch, run:

```bash
npx electron-builder install-app-deps
```

(`npm run postinstall` also runs this after installs.)

### Data Persistence

All user data (API keys, saved searches, saved magnets) is stored via `electron-store`, which persists to:

- macOS: `~/Library/Application Support/watchy/`
- Windows: `%APPDATA%\watchy\`
- Linux: `~/.config/watchy/`

### External Dependencies

- **AllDebrid API Key**: Required for torrent caching/streaming functionality
- **VLC Media Player**: Must be installed at default system location
