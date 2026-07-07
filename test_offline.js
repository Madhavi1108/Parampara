const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });

    console.log("Navigating to gallery...");
    await page.goto('http://localhost:3000/gallery.html', { waitUntil: 'networkidle0' });
    
    // Wait for Service Worker to install and cache assets
    await new Promise(r => setTimeout(r, 2000));

    // Create CDP Session to emulate offline mode
    const client = await page.target().createCDPSession();
    await client.send('Network.enable');
    await client.send('Network.emulateNetworkConditions', {
      offline: true,
      latency: 0,
      downloadThroughput: 0,
      uploadThroughput: 0,
    });
    
    console.log("Network set to OFFLINE. Reloading page...");

    // Reload page in offline mode
    await page.reload({ waitUntil: 'domcontentloaded' });
    console.log("Page reloaded in offline mode.");
    
    // Wait for a little bit for rendering
    await new Promise(r => setTimeout(r, 1000));
    
    // Check if offline toast exists (it should, because window triggers 'offline' event if navigator.onLine is false, but sometimes Puppeteer needs it manually triggered on reload)
    const isOnline = await page.evaluate(() => navigator.onLine);
    if (isOnline) {
       // Force the offline event just in case
       await page.evaluate(() => window.dispatchEvent(new Event('offline')));
       await new Promise(r => setTimeout(r, 500));
    }
    
    if (!fs.existsSync('x:/SSOC/Parampara/screenshots')) {
      fs.mkdirSync('x:/SSOC/Parampara/screenshots', { recursive: true });
    }

    const dest = 'x:/SSOC/Parampara/screenshots/offline_toast.png';
    await page.screenshot({ path: dest });
    console.log('Screenshot saved to ' + dest);
    
    await browser.close();
  } catch (err) {
    console.error('Error taking offline screenshot:', err);
    process.exit(1);
  }
})();
