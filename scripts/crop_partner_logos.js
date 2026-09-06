const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const imgPath = 'C:/Users/lenovo/.gemini/antigravity-ide/brain/2a875b47-87a9-48e0-aefd-676ee81c47f8/.user_uploaded/media_1788650312386.jpg';
const outDir = path.resolve(__dirname, '../public/partners');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Remove debug file if exists
const debugPath = path.join(outDir, 'stb_debug.png');
if (fs.existsSync(debugPath)) fs.unlinkSync(debugPath);

const regions = [
  { name: 'wynsys', left: 10, top: 10, width: 236, height: 122 },
  { name: 'sotuver', left: 266, top: 10, width: 236, height: 122 },
  { name: 'tt', left: 522, top: 10, width: 236, height: 122 },
  { name: 'masmoudi', left: 778, top: 10, width: 236, height: 122 },
  
  { name: 'biat', left: 10, top: 153, width: 236, height: 122 },
  { name: 'kilani', left: 266, top: 153, width: 236, height: 122 },
  { name: 'coficab', left: 522, top: 153, width: 236, height: 122 },
  { name: 'wevioo', left: 778, top: 153, width: 236, height: 122 },

  { name: 'bontaz', left: 10, top: 295, width: 236, height: 122 },
  { name: 'tpr', left: 266, top: 295, width: 236, height: 122 },
  { name: 'talys', left: 522, top: 295, width: 236, height: 122 },
  { name: 'chez-soeurettes', left: 778, top: 295, width: 236, height: 122 },

  // Row 3: STB starts around x: 210 and Apave starts around x: 530
  { name: 'stb', left: 210, top: 435, width: 290, height: 125 },
  { name: 'apave', left: 530, top: 435, width: 280, height: 125 },
];

async function generateCleanLogos() {
  console.log('Generating high-res cropped partner logos...');
  for (const item of regions) {
    const outPath = path.join(outDir, `${item.name}.png`);
    
    // Extract region, trim excess white space, and add proportional white margin
    const croppedBuffer = await sharp(imgPath)
      .extract({ left: item.left, top: item.top, width: item.width, height: item.height })
      .trim({ background: { r: 255, g: 255, b: 255 }, threshold: 15 })
      .toBuffer();

    await sharp(croppedBuffer)
      .extend({
        top: 14,
        bottom: 14,
        left: 20,
        right: 20,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png({ quality: 95 })
      .toFile(outPath);

    console.log(`✓ Generated ${item.name}.png`);
  }
  console.log('All 14 partner logos generated!');
}

generateCleanLogos();
