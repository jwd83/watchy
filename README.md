# Watchy

**Watchy** is a modern Electron application that allows you to search for P2P content, cache it using AllDebrid, and stream it directly to VLC Media Player. It features a premium, dark-mode interface built with React and Tailwind CSS.

## Features

- **Integrated Search**: Search P2P networks (e.g., 1337x) directly from the app.
- **Instant Caching**: Automatically uploads magnet links to AllDebrid for high-speed caching.
- **Direct Streaming**: Unlocks video files and streams them directly to VLC Media Player.
- **Modern UI**: A sleek, responsive interface designed for a premium user experience.

## Prerequisites

Before running Watchy, ensure you have the following:

1.  **AllDebrid API Key**: You need an active AllDebrid account and API key.
    - Get your key here: [AllDebrid API Keys](https://alldebrid.com/apikeys)
2.  **VLC Media Player**: Watchy relies on VLC for playback.
    - **macOS**: `/Applications/VLC.app`
    - **Windows**: `C:\Program Files\VideoLAN\VLC\vlc.exe`

## Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/yourusername/watchy.git
    cd watchy
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

## Usage

### Development

To start the application in development mode:

```bash
npm run dev
```

### Building for Production

To build the application for your operating system:

```bash
# macOS
npm run build:mac

# Windows
npm run build:win

# Linux
npm run build:linux
```

### Creating a Release

To build distributable installers for macOS and Windows:

**Quick Method** (recommended):
```bash
./build-release.sh
```

This will:
1. Clean the `dist/` folder
2. Generate icons
3. Build macOS DMG installer (~119 MB)
4. Build Windows installer (~99 MB)
5. Display the distributable files

**Manual Method**:

1. **Update version number** in `package.json`

2. **Generate icons** (if icon was updated):
   ```bash
   npm run icon:generate
   ```

3. **Build for macOS**:
   ```bash
   npm run build:mac
   ```
   Output: `dist/watchy-{version}.dmg`

4. **Build for Windows**:
   ```bash
   npm run build:win
   ```
   Output: `dist/watchy-{version}-setup.exe`

5. **Distribute** the installers from the `dist/` folder

**Note**: Windows builds created on macOS are unsigned. For production releases, build on Windows with a code signing certificate to avoid security warnings.

## Getting Started

1.  **Launch the App**: Run `npm run dev` or open your built application.
2.  **Setup API Key**: On the first run, you will be prompted to enter your AllDebrid API Key. You can also access this via the Settings icon.
3.  **Search**: Enter a query (e.g., "PBS Nova") in the search bar.
4.  **Unlock**: Click on a result to send the magnet link to AllDebrid.
5.  **Stream**: Once the file list appears, click **Play in VLC** to start watching.

## Troubleshooting

-   **VLC not opening?** Ensure VLC is installed in the default system location.
-   **No search results?** The scraper may be blocked by your ISP or the source site might be down.
-   **Unlock failed?** Verify your AllDebrid API key and subscription status.

## License

[MIT](LICENSE)
