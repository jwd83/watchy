#!/bin/bash
set -e

echo "🎬 Watchy Release Builder"
echo "========================="
echo ""

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")
echo "📦 Version: $VERSION"
echo ""

# Clean dist folder
echo "🧹 Cleaning dist folder..."
rm -rf dist/
echo ""

# Generate icons
echo "🎨 Generating icons..."
npm run icon:generate
echo ""

# Build for macOS
echo "🍎 Building for macOS..."
npm run build:mac
echo ""

# Build for Windows
echo "🪟 Building for Windows..."
npm run build:win
echo ""

# Summary
echo "✅ Build complete!"
echo ""
echo "📦 Distributable files:"
ls -lh dist/*.dmg dist/*.exe 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}'
echo ""
echo "🚀 Ready to distribute from the dist/ folder"
