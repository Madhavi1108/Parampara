const { ZipArchive } = require('archiver');
const fs = require('fs');
const path = require('path');
const store = require('../data/store');

const generateArchive = async (req, res) => {
  try {
    const { collections = ['culturalItems', 'heritagePaths', 'artisans', 'timelineEvents', 'storySourceData'] } = req.body;
    
    // Set headers for ZIP download
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="parampara-archive.zip"');

    // Create an archiver instance
    const archive = new ZipArchive({
      zlib: { level: 9 } // Highest compression level
    });

    // Listen for all archive data to be written
    archive.on('error', (err) => {
      console.error('Error generating archive:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to generate archive' });
      }
    });

    // Pipe archive data to the response
    archive.pipe(res);

    let totalRecords = 0;
    const metadata = {
      exportDate: new Date().toISOString(),
      collectionsExported: [],
      recordCounts: {}
    };

    // Extract requested collections
    for (const collectionName of collections) {
      if (store[collectionName]) {
        // Handle SearchProxy/AuditProxy vs raw object/array
        let dataToExport;
        if (typeof store[collectionName].values === 'function') {
          dataToExport = store[collectionName].values();
        } else if (Array.isArray(store[collectionName])) {
          dataToExport = store[collectionName];
        } else {
          // Object
          dataToExport = Object.values(store[collectionName]);
        }

        const dataString = JSON.stringify(dataToExport, null, 2);
        
        archive.append(dataString, { name: `data/${collectionName}.json` });
        
        metadata.collectionsExported.push(collectionName);
        metadata.recordCounts[collectionName] = dataToExport.length;
        totalRecords += dataToExport.length;

        // Extract image references if it's artisans (portfolio images)
        if (collectionName === 'artisans') {
          dataToExport.forEach(artisan => {
            if (artisan.portfolio) {
              artisan.portfolio.forEach(item => {
                if (item.image) {
                  const imagePath = path.join(__dirname, '..', 'public', item.image);
                  if (fs.existsSync(imagePath)) {
                    archive.file(imagePath, { name: item.image });
                  }
                }
              });
            }
          });
        }
      }
    }

    metadata.totalRecords = totalRecords;
    
    // Append manifest
    archive.append(JSON.stringify(metadata, null, 2), { name: 'manifest.json' });

    // Finalize the archive (we are done appending files)
    await archive.finalize();

  } catch (error) {
    console.error('Archive export error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error during export' });
    }
  }
};

module.exports = {
  generateArchive
};
