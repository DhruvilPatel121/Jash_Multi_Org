const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function createIcons() {
  const sizes = [192, 512];
  
  for (const size of sizes) {
    // Create SVG with medical cross
    const svg = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" fill="#0BA5EC"/>
        <g fill="#FFFFFF">
          <!-- Vertical bar of cross -->
          <rect x="${size * 0.425}" y="${size * 0.25}" width="${size * 0.15}" height="${size * 0.5}" rx="${size * 0.02}"/>
          <!-- Horizontal bar of cross -->
          <rect x="${size * 0.25}" y="${size * 0.425}" width="${size * 0.5}" height="${size * 0.15}" rx="${size * 0.02}"/>
        </g>
        <text x="${size / 2}" y="${size * 0.88}" font-family="Arial, sans-serif" font-size="${size * 0.11}" font-weight="bold" fill="#FFFFFF" text-anchor="middle">JASH</text>
      </svg>
    `;
    
    const outputPath = path.join(__dirname, 'public', `icon-${size}.png`);
    
    await sharp(Buffer.from(svg))
      .png()
      .toFile(outputPath);
    
    console.log(`✓ Created ${outputPath}`);
  }
  
  console.log('\n✓ All icons created successfully!');
}

createIcons().catch(console.error);
