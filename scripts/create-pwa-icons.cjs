const fs = require('fs');
const path = require('path');

// Create simple 1x1 pixel PNG as placeholder (will be replaced by real icons)
// PWA will still work - icons just won't show on home screen perfectly
// Real icons should be generated from the actual logo

const PNG_192_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const publicDir = path.join(__dirname, 'public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write placeholder PNGs (tiny but valid)
const buf = Buffer.from(PNG_192_BASE64, 'base64');
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), buf);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), buf);

console.log('PWA icon placeholders created in public/');
