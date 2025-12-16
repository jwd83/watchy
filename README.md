# Watchy

**Watchy** allows you to search for P2P content, cache it using AllDebrid, stream or download it directly, and manage your personal library.

Linux builds are provided as an **AppImage** (recommended for most distros).

## Features

- **Integrated Search**: Search P2P networks directly from the app.
- **Instant Caching**: Automatically uploads magnet links to AllDebrid for high-speed caching.
- **Direct Streaming**: Unlocks video files and streams them directly to VLC Media Player.
- **Download Support**: Download unlocked files directly to your device.
- **Downloads Tab**: A dedicated tab for managing your downloads.
- **Personal Library**: Save your favorite searches and magnet links for quick access.
- **Play History**: Track your watched content with file-level resume functionality.
- **Modern UI**: A sleek, responsive interface designed for a premium user experience.

## Prerequisites

Before running Watchy, ensure you have the following:

1.  **AllDebrid API Key**: You need an active AllDebrid account and API key.
    - Get your key here: [AllDebrid API Keys](https://alldebrid.com/apikeys)
2.  **VLC Media Player**: Watchy relies on VLC for playback.
    - **macOS**: `/Applications/VLC.app`
    - **Windows**: `C:\Program Files\VideoLAN\VLC\vlc.exe`
    - **Linux**: `vlc` must be available on your `PATH` (typically `/usr/bin/vlc`)

## Installation

Visit our releases page and download the artifact for your platform:

- **Linux (recommended)**: Download the `.AppImage`, then:

```bash
chmod +x watchy-*-linux.AppImage
./watchy-*-linux.AppImage
```

Mac users will need to run...

```bash
sudo xattr -cr /Applications/watchy.app
```

...once the app is installed

## Usage

### Development

To start the application in development mode:

```bash
npm run dev
```

### Building for Production

Installers are built on GitHub Actions (not on your local machine). To cut a release:

```bash
uv run builder.py
```

By default, `builder.py` will:
- (Optionally) bump the version and push the commit
- Create and push a git tag like `v0.0.29`

That tag triggers GitHub Actions to build the Windows `.exe`, macOS `.dmg`, and the Linux `.AppImage`, and upload them to the GitHub Release.

If you *do* want to build installers locally (for testing), answer `y` when prompted.

On Linux, the default local build script produces an AppImage:

```bash
npm run build:linux
```


## Troubleshooting

- **VLC not opening?** Ensure VLC is installed in the default system location.
- **No search results?** The scraper may be blocked by your ISP or the source site might be down.
- **Unlock failed?** Verify your AllDebrid API key and subscription status. If the file is not cached you may just need to try again later. You can view the AllDebrid cache download status in your account page on AllDebrid.
- **macOS Damaged Error?** Try running...

```bash
sudo xattr -cr /Applications/watchy.app
```

...or adjust to wherever you have watchy installed.
