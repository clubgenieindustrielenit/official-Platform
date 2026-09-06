const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const publicDir = path.resolve(__dirname, '../public');

async function optimizeImages() {
  const files = fs.readdirSync(publicDir);
  console.log('Starting image optimization in public/...\n');

  let totalSaved = 0;

  for (const file of files) {
    if (file.startsWith('_tmp_')) {
      try { fs.unlinkSync(path.join(publicDir, file)); } catch {}
      continue;
    }

    const ext = path.extname(file).toLowerCase();
    const filePath = path.join(publicDir, file);

    if (['.png', '.jpg', '.jpeg'].includes(ext)) {
      try {
        const inputBuffer = fs.readFileSync(filePath);
        const beforeSize = inputBuffer.length;

        let outputBuffer;
        if (ext === '.png') {
          outputBuffer = await sharp(inputBuffer)
            .png({ compressionLevel: 9, effort: 8 })
            .toBuffer();
        } else {
          outputBuffer = await sharp(inputBuffer)
            .jpeg({ quality: 80, mozjpeg: true })
            .toBuffer();
        }

        const afterSize = outputBuffer.length;
        if (afterSize < beforeSize) {
          fs.writeFileSync(filePath, outputBuffer);
          const savedBytes = beforeSize - afterSize;
          totalSaved += savedBytes;
          const pct = ((savedBytes / beforeSize) * 100).toFixed(1);
          console.log(`✓ ${file}: ${(beforeSize / 1024).toFixed(1)} KB -> ${(afterSize / 1024).toFixed(1)} KB (-${pct}%)`);
        } else {
          console.log(`- ${file}: ${(beforeSize / 1024).toFixed(1)} KB (already optimal)`);
        }
      } catch (err) {
        console.error(`✗ Error processing ${file}:`, err.message);
      }
    }
  }

  console.log(`\nTotal saved: ${(totalSaved / 1024).toFixed(1)} KB`);
}

optimizeImages();
