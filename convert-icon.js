import sharp from 'sharp'
import { readFileSync } from 'fs'
import pngToIco from 'png-to-ico'
import { writeFileSync } from 'fs'
import png2icons from 'png2icons'

const sourcePng = './resources/icon.png'

// Generate PNGs at different sizes
const sizes = [
  { size: 16, path: './build/icon-16.png' },
  { size: 24, path: './build/icon-24.png' },
  { size: 32, path: './build/icon-32.png' },
  { size: 48, path: './build/icon-48.png' },
  { size: 64, path: './build/icon-64.png' },
  { size: 128, path: './build/icon-128.png' },
  { size: 256, path: './build/icon-256.png' },
  { size: 512, path: './build/icon-512.png' },
  { size: 1024, path: './build/icon-1024.png' }
]

for (const { size, path } of sizes) {
  await sharp(sourcePng).resize(size, size).png().toFile(path)
  console.log(`Generated ${path}`)
}

// Build icon (256x256 is common)
await sharp(sourcePng).resize(256, 256).png().toFile('./build/icon.png')

// Generate Windows .ico file (contains multiple sizes)
const icoPaths = [
  './build/icon-16.png',
  './build/icon-24.png',
  './build/icon-32.png',
  './build/icon-48.png',
  './build/icon-64.png',
  './build/icon-128.png',
  './build/icon-256.png'
]

const icoBuffer = await pngToIco(icoPaths)
writeFileSync('./build/icon.ico', icoBuffer)

// Generate macOS .icns file
const sourceBuffer = readFileSync(sourcePng)
const icnsBuffer = await png2icons.createICNS(sourceBuffer, png2icons.BICUBIC, 0)
writeFileSync('./build/icon.icns', icnsBuffer)

// Clean up temporary files
import { unlinkSync } from 'fs'
for (const { path } of sizes) {
  try {
    unlinkSync(path)
  } catch (e) {}
}

console.log('All icons generated successfully!')
console.log('Generated:')
console.log('  - build/icon.png (256x256)')
console.log('  - build/icon.ico (Windows, multi-size)')
console.log('  - build/icon.icns (macOS, multi-size)')
