const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const gridImg = 'C:/Users/lenovo/.gemini/antigravity-ide/brain/2a875b47-87a9-48e0-aefd-676ee81c47f8/.user_uploaded/media_1788650312386.jpg';
const stbImg = 'C:/Users/lenovo/.gemini/antigravity-ide/brain/2a875b47-87a9-48e0-aefd-676ee81c47f8/.user_uploaded/media_1788652023305.png';
const outDir = path.resolve(__dirname, '../public/partners');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

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

  { name: 'apave', left: 530, top: 435, width: 280, height: 125 },
];

async function reprocess() {
  console.log('Reprocessing partner logos to maximize logo size inside cards...');

  // 1. Process STB from user-uploaded pic1
  const stbBuffer = await sharp(stbImg)
    .trim({ background: { r: 255, g: 255, b: 255 }, threshold: 25 })
    .extend({ top: 4, bottom: 4, left: 6, right: 6, background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png({ quality: 100 })
    .toFile(path.join(outDir, 'stb.png'));
  console.log('✓ Processed STB Bank from user pic1');

  // 2. Process all other logos with tight trimming (no large empty white borders)
  for (const item of regions) {
    const outPath = path.join(outDir, `${item.name}.png`);
    const trimmed = await sharp(gridImg)
      .extract({ left: item.left, top: item.top, width: item.width, height: item.height })
      .trim({ background: { r: 255, g: 255, b: 255 }, threshold: 20 })
      .extend({ top: 4, bottom: 4, left: 6, right: 6, background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png({ quality: 100 })
      .toFile(outPath);
    console.log(`✓ Processed tight logo: ${item.name}.png`);
  }

  console.log('All logos tightly processed for maximum scale!');
}

reprocess();
