# Release Checklist

## Pre-Release

- [ ] Update version number in `package.json`
- [ ] Test the app in development mode (`npm run dev`)
- [ ] Update `README.md` if needed
- [ ] Update `WARP.md` if architecture changed
- [ ] Commit all changes

## Build Release

Run the automated build script:
```bash
./build-release.sh
```

Or build manually:
```bash
npm run icon:generate
npm run build:mac
npm run build:win
```

## Generated Files

The build process creates:
- **macOS**: `dist/watchy-{version}.dmg` (~119 MB)
- **Windows**: `dist/watchy-{version}-setup.exe` (~99 MB)

## Distribution

1. Test both installers on their respective platforms
2. Upload to GitHub Releases or your distribution platform
3. Update download links in documentation

## Notes

- **macOS**: DMG is unsigned. Users may need to right-click → Open on first launch
- **Windows**: Installer is unsigned when built on macOS. Build on Windows with code signing certificate for production
- Both installers include the custom icon and all dependencies
- Users will need AllDebrid API key and VLC Media Player installed
