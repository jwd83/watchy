// Utility script to generate icons for macOS (.icns) and Windows (.ico)
// from a single source PNG.

const path = require('path')
const fs = require('fs')
const sharp = require('sharp')
const pngToIco = require('png-to-ico')
const png2icons = require('png2icons')

const sourcePng = path.resolve(__dirname, 'resources/icon.png')
const buildDir = path.resolve(__dirname, 'build')

async function main() {
  // Ensure build directory exists
  fs.mkdirSync(buildDir, { recursive: true })

  // Generate PNGs at different sizes
  const sizes = [
    { size: 16, file: 'icon-16.png' },
    { size: 24, file: 'icon-24.png' },
    { size: 32, file: 'icon-32.png' },
    { size: 48, file: 'icon-48.png' },
    { size: 64, file: 'icon-64.png' },
    { size: 128, file: 'icon-128.png' },
    { size: 256, file: 'icon-256.png' },
    { size: 512, file: 'icon-512.png' },
    { size: 1024, file: 'icon-1024.png' }
  ]

  const tempPngPaths = []

  for (const { size, file } of sizes) {
    const outPath = path.join(buildDir, file)
    await sharp(sourcePng).resize(size, size).png().toFile(outPath)
    tempPngPaths.push(outPath)
    console.log(`Generated ${outPath}`)
  }

  // Base 256x256 PNG (useful as generic icon)
  const basePngPath = path.join(buildDir, 'icon.png')
  await sharp(sourcePng).resize(256, 256).png().toFile(basePngPath)

  // Generate Windows .ico file (contains multiple sizes)
  const icoPaths = sizes
    .filter(({ size }) => size <= 256)
    .map(({ file }) => path.join(buildDir, file))

  const icoBuffer = await pngToIco(icoPaths)
  fs.writeFileSync(path.join(buildDir, 'icon.ico'), icoBuffer)

  // Generate macOS .icns file
  const sourceBuffer = fs.readFileSync(sourcePng)
  const icnsBuffer = png2icons.createICNS(sourceBuffer, png2icons.BICUBIC, 0)
  if (!icnsBuffer) {
    throw new Error('Failed to generate ICNS icon')
  }
  fs.writeFileSync(path.join(buildDir, 'icon.icns'), icnsBuffer)

  // Clean up temporary PNGs (keep base icon.png)
  for (const p of tempPngPaths) {
    try {
      fs.unlinkSync(p)
    } catch (e) {
      // ignore
    }
  }

  console.log('All icons generated successfully!')
  console.log('Generated:')
  console.log(`  - ${basePngPath} (256x256)`)
  console.log(`  - ${path.join(buildDir, 'icon.ico')} (Windows, multi-size)`)\
  console.log(`  - ${path.join(buildDir, 'icon.icns')} (macOS, multi-size)`)
}

main().catch((err) => {
  console.error('Failed to generate icons:', err)
  process.exit(1)
})
