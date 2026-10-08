/**
 * Lightweight local preview server for Inthawnna Web App
 * Serves the static `web/` folder locally with offline LAN discovery
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = process.env.PORT || 3300;
const WEB_DIR = path.join(__dirname, 'web');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml'
};

// In-memory registry for local Wi-Fi auto-discovery
const lanPeers = new Map();

function cleanStaleLanPeers() {
  const now = Date.now();
  for (const [id, peer] of lanPeers.entries()) {
    if (now - peer.lastSeen > 20000) {
      lanPeers.delete(id);
    }
  }
}
setInterval(cleanStaleLanPeers, 10000);

const server = http.createServer((req, res) => {
  // CORS & PWA headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  let reqPath = decodeURI(req.url.split('?')[0]);

  // A. Local LAN Auto-Discovery Endpoints (Offline Hotspot mode)
  if (reqPath === '/api/lan/announce' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        if (data.peerId && data.roomId) {
          lanPeers.set(data.peerId, {
            ...data,
            lastSeen: Date.now()
          });
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  if (reqPath === '/api/lan/peers' && req.method === 'GET') {
    cleanStaleLanPeers();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ peers: Array.from(lanPeers.values()) }));
    return;
  }

  // B. Web Share Target fallback (if Service Worker isn't active yet)
  if (reqPath === '/share-target' || reqPath === './share-target') {
    res.writeHead(303, { 'Location': './?shared=true' });
    res.end();
    return;
  }

  // C. Static File Serving
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';

  const filePath = path.join(WEB_DIR, reqPath);

  // Security check to prevent directory traversal
  if (!filePath.startsWith(WEB_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for SPA routing
      const indexPath = path.join(WEB_DIR, 'index.html');
      fs.readFile(indexPath, (readErr, content) => {
        if (readErr) {
          res.writeHead(404);
          res.end('Not Found');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(content);
        }
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    const headers = {
      'Content-Type': contentType
    };

    if (filePath.endsWith('sw.js')) {
      headers['Service-Worker-Allowed'] = '/';
      headers['Cache-Control'] = 'no-cache';
    }

    res.writeHead(200, headers);
    fs.createReadStream(filePath).pipe(res);
  });
});

function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }
  return addresses;
}

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`⚡ Inthawnna Web App running locally!`);
  console.log(`======================================================`);
  console.log(`Local (PC):       http://localhost:${PORT}`);
  
  const ips = getLocalIPs();
  ips.forEach(ip => {
    console.log(`Network (Phone):  http://${ip}:${PORT}`);
  });
  console.log(`Live Link:        https://inthawnna.pages.dev`);
  console.log(`======================================================\n`);
});
