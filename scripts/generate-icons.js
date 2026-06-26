// scripts/generate-icons.js
// Generates PWA icons for ViWallet using sharp
// Brand color: #7C6FE8 (primary purple)

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'icons');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Creates the base SVG icon at the given dimensions.
 * @param {number} size - Width and height in pixels
 * @param {number} padding - Padding inside the square (for safe zone on maskable)
 */
function createSvg(size, padding = 0) {
  const innerSize = size - padding * 2;
  const radius = Math.round(innerSize * 0.22);
  const offset = padding;

  // "V" lettermark paths: two angled strokes meeting at the bottom
  const cx = offset + innerSize / 2;
  const top = offset + innerSize * 0.25;
  const mid = offset + innerSize * 0.72;
  const leftX = offset + innerSize * 0.2;
  const rightX = offset + innerSize * 0.8;
  const strokeW = Math.round(innerSize * 0.1);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <!-- Background rounded square -->
  <rect x="${offset}" y="${offset}" width="${innerSize}" height="${innerSize}" rx="${radius}" ry="${radius}" fill="#7C6FE8"/>
  <!-- White V lettermark -->
  <polyline
    points="${leftX},${top} ${cx},${mid} ${rightX},${top}"
    fill="none"
    stroke="white"
    stroke-width="${strokeW}"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
</svg>`;
}

async function generateIcon(size, filename, padding = 0) {
  const svg = createSvg(size, padding);
  const svgBuffer = Buffer.from(svg);
  const outputPath = path.join(OUTPUT_DIR, filename);

  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(outputPath);

  const stats = fs.statSync(outputPath);
  console.log(`Generated ${filename} (${size}x${size}, ${stats.size} bytes)`);
}

async function main() {
  console.log('Generating ViWallet PWA icons...');

  // Standard 192x192 icon
  await generateIcon(192, 'icon-192.png', 0);

  // Standard 512x512 icon
  await generateIcon(512, 'icon-512.png', 0);

  // Maskable 512x512 icon — content in center 80% safe zone (410px)
  // Padding = (512 - 410) / 2 = 51px each side
  await generateIcon(512, 'icon-maskable-512.png', 51);

  console.log('All icons generated successfully!');
}

main().catch((err) => {
  console.error('Icon generation failed:', err);
  process.exit(1);
});
