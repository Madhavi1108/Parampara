const sharp = require('sharp');
const fs = require('fs/promises');
const path = require('path');

const INPUT_DIR = path.join(__dirname, '../public/images');
const OUTPUT_DIR = path.join(__dirname, '../public/optimized');
const MANIFEST_PATH = path.join(OUTPUT_DIR, 'assets-manifest.json');

const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];

const SIZES = [
  { name: 'thumb', width: 300 },
  { name: 'medium', width: 800 },
  { name: 'full', width: null } // original size
];

const FORMATS = ['webp', 'avif'];
const CONCURRENCY_LIMIT = 5;

async function ensureDir(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

async function processImage(inputPath, relativePath) {
  const filename = path.basename(relativePath);
  const ext = path.extname(filename).toLowerCase();
  const nameWithoutExt = path.basename(filename, ext);
  const relDir = path.dirname(relativePath);
  
  const outDir = path.join(OUTPUT_DIR, relDir);
  await ensureDir(outDir);

  const inputStats = await fs.stat(inputPath);
  const inputTime = inputStats.mtimeMs;
  let skipped = 0;
  let processed = 0;
  let bytesSaved = 0;
  
  const manifestEntry = {};

  for (const size of SIZES) {
    manifestEntry[size.name] = {};
    const suffix = size.name === 'full' ? '' : `-${size.name}`;
    
    for (const format of FORMATS) {
      const outFilename = `${nameWithoutExt}${suffix}.${format}`;
      const outPath = path.join(outDir, outFilename);
      const posixRelDir = relDir.split(path.sep).join(path.posix.sep);
      const outRelPath = path.posix.join(posixRelDir === '.' ? '' : posixRelDir, outFilename);

      let shouldProcess = true;
      try {
        const outStats = await fs.stat(outPath);
        if (outStats.mtimeMs >= inputTime) {
          shouldProcess = false; // skip if output is newer
          skipped++;
        }
      } catch {
        // file doesn't exist, proceed
      }

      if (shouldProcess) {
        try {
          let pipeline = sharp(inputPath);
          if (size.width) {
            pipeline = pipeline.resize({ width: size.width, withoutEnlargement: true });
          }
          
          if (format === 'webp') {
            pipeline = pipeline.webp({ quality: 80 });
          } else if (format === 'avif') {
            pipeline = pipeline.avif({ quality: 70 });
          }
          
          await pipeline.toFile(outPath);
          
          const newStats = await fs.stat(outPath);
          
          // calculate bytes saved for 'full' size vs original
          if (size.name === 'full') {
              bytesSaved += Math.max(0, inputStats.size - newStats.size);
          }

          processed++;
        } catch (err) {
          throw new Error(`Failed to process ${outFilename}: ${err.message}`);
        }
      }
      
      // Update manifest
      manifestEntry[size.name][format] = outRelPath;
    }
  }

  return { processed, skipped, bytesSaved, manifestEntry };
}

async function walkDir(dir) {
  let results = [];
  const list = await fs.readdir(dir);
  for (let file of list) {
    file = path.join(dir, file);
    const stat = await fs.stat(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(await walkDir(file));
    } else {
      results.push(file);
    }
  }
  return results;
}

// Simple concurrency limiter for Promise.all
async function processConcurrently(items, limit, processor) {
  let active = 0;
  let index = 0;
  const results = [];
  const errors = [];

  return new Promise((resolve) => {
    const next = async () => {
      if (index >= items.length && active === 0) {
        resolve({ results, errors });
        return;
      }

      while (active < limit && index < items.length) {
        const currentIndex = index++;
        active++;
        
        processor(items[currentIndex])
          .then(res => results.push(res))
          .catch(err => errors.push(err))
          .finally(() => {
            active--;
            next();
          });
      }
    };
    next();
  });
}

async function main() {
  console.log('Starting advanced image optimization pipeline...');
  const startTime = Date.now();
  
  try {
    await ensureDir(INPUT_DIR);
    await ensureDir(OUTPUT_DIR);
  } catch (err) {
    console.error('Failed to initialize directories:', err);
    process.exit(1);
  }

  const files = await walkDir(INPUT_DIR);
  
  const imageFiles = files.filter(f => {
    const ext = path.extname(f).toLowerCase();
    return SUPPORTED_EXTENSIONS.includes(ext);
  });

  console.log(`Found ${imageFiles.length} image(s) to process in ${INPUT_DIR}`);

  let totalProcessed = 0;
  let totalSkipped = 0;
  let totalBytesSaved = 0;
  let totalErrors = 0;
  const manifest = {};

  const { results, errors } = await processConcurrently(
    imageFiles, 
    CONCURRENCY_LIMIT, 
    async (file) => {
      const relPath = path.relative(INPUT_DIR, file);
      const posixRelPath = relPath.split(path.sep).join(path.posix.sep); // Normalize for manifest
      
      try {
        const { processed, skipped, bytesSaved, manifestEntry } = await processImage(file, relPath);
        return { posixRelPath, processed, skipped, bytesSaved, manifestEntry, error: null };
      } catch (err) {
        return { posixRelPath, error: err };
      }
    }
  );

  for (const res of results) {
    if (res.error) {
       console.warn(`[WARN] Skipping ${res.posixRelPath} - ${res.error.message}`);
       totalErrors++;
    } else {
       totalProcessed += res.processed;
       totalSkipped += res.skipped;
       totalBytesSaved += res.bytesSaved;
       manifest[res.posixRelPath] = res.manifestEntry;
    }
  }
  
  for (const err of errors) {
      console.error(`[ERROR] Unexpected pipeline error:`, err);
      totalErrors++;
  }

  // Save manifest
  try {
    await fs.writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
    console.log(`\nManifest generated at: ${MANIFEST_PATH}`);
  } catch (err) {
    console.error(`[ERROR] Failed to save manifest:`, err);
  }

  const timeTaken = ((Date.now() - startTime) / 1000).toFixed(2);
  const megabytesSaved = (totalBytesSaved / (1024 * 1024)).toFixed(2);

  console.log('\n--- Optimization Report ---');
  console.log(`Time taken: ${timeTaken} seconds`);
  console.log(`Variants generated: ${totalProcessed}`);
  console.log(`Variants skipped: ${totalSkipped}`);
  console.log(`Errors encountered: ${totalErrors}`);
  console.log(`Bandwidth saved (full vs original): ~${megabytesSaved} MB`);
  console.log('---------------------------\n');
}

main().catch(err => {
  console.error('Fatal error during optimization:', err);
  process.exit(1);
});
