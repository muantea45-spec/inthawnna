const express = require('express');
const http = require('http');
const net = require('net');
const path = require('path');
const fs = require('fs');
const os = require('os');
const multer = require('multer');
const cors = require('cors');
const { WebSocketServer, WebSocket } = require('ws');
const QRCode = require('qrcode');
const mime = require('mime-types');
const archiver = require('archiver');

class BeamServer {
  constructor(options = {}) {
    this.port = options.port || 5200;
    this.app = express();
    this.server = null;
    this.wss = null;
    this.clients = new Set();
    
    // Default save directory: Downloads/Inthawnte
    this.savePath = options.savePath || path.join(os.homedir(), 'Downloads', 'Inthawnte');
    this.ensureSaveDirectory();

    // Staged files available for phone to download
    this.stagedFiles = new Map(); // id -> { id, name, originalPath, size, mimeType, addedAt }
    
    // Shared clipboard state
    this.sharedClipboard = { text: '', updatedAt: null, source: null };
    
    // Recent incoming transfers list
    this.transferHistory = [];
    this.loadExistingTransfers();

    // Detect network interfaces
    this.networkInterfaces = this.getNetworkInterfaces();
    this.activeInterface = this.selectDefaultInterface();

    this.onDesktopEventCallback = null;
    this.setupExpress();
  }

  ensureSaveDirectory() {
    if (!fs.existsSync(this.savePath)) {
      try {
        fs.mkdirSync(this.savePath, { recursive: true });
      } catch (err) {
        console.error('Failed to create save directory:', err);
      }
    }
  }

  loadExistingTransfers() {
    try {
      if (!fs.existsSync(this.savePath)) return;
      const files = fs.readdirSync(this.savePath);
      const items = [];
      for (const filename of files) {
        const fullPath = path.join(this.savePath, filename);
        try {
          const stat = fs.statSync(fullPath);
          if (stat.isFile()) {
            items.push({
              id: 'local_' + Math.random().toString(36).substring(2, 9),
              filename: filename,
              originalName: filename,
              size: stat.size,
              mimetype: mime.lookup(fullPath) || 'application/octet-stream',
              path: fullPath,
              timestamp: stat.mtime.toISOString()
            });
          }
        } catch (e) {}
      }
      items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      this.transferHistory = items.slice(0, 100);
    } catch (err) {
      console.warn('Failed to load existing transfers:', err);
    }
  }

  setSavePath(newPath) {
    if (newPath && fs.existsSync(newPath)) {
      this.savePath = newPath;
      this.loadExistingTransfers();
      this.broadcast({
        type: 'save-path-changed',
        savePath: this.savePath
      });
      return true;
    }
    return false;
  }

  setDesktopEventCallback(cb) {
    this.onDesktopEventCallback = cb;
  }

  emitToDesktop(event, data) {
    if (this.onDesktopEventCallback) {
      this.onDesktopEventCallback(event, data);
    }
  }

  getNetworkInterfaces() {
    const interfaces = os.networkInterfaces();
    const results = [];

    for (const [name, addrs] of Object.entries(interfaces)) {
      for (const addr of addrs) {
        // Only IPv4 and non-internal
        if (addr.family === 'IPv4' && !addr.internal) {
          const lowerName = name.toLowerCase();
          let type = 'other';
          if (lowerName.includes('wi-fi') || lowerName.includes('wireless') || lowerName.includes('wlan')) {
            type = 'wifi';
          } else if (lowerName.includes('ethernet') || lowerName.includes('eth')) {
            type = 'ethernet';
          } else if (lowerName.includes('hotspot') || lowerName.includes('virtual') || lowerName.includes('local area connection*')) {
            type = 'hotspot';
          }

          results.push({
            name,
            address: addr.address,
            netmask: addr.netmask,
            mac: addr.mac,
            type
          });
        }
      }
    }

    // Sort: Hotspot and Wi-Fi first, then Ethernet, then others
    const priority = { hotspot: 1, wifi: 2, ethernet: 3, other: 4 };
    results.sort((a, b) => (priority[a.type] || 5) - (priority[b.type] || 5));

    return results;
  }

  selectDefaultInterface() {
    if (this.networkInterfaces.length === 0) {
      return { name: 'Loopback', address: '127.0.0.1', type: 'other' };
    }
    // Prefer Wi-Fi or Hotspot
    const pref = this.networkInterfaces.find(i => i.type === 'hotspot' || i.type === 'wifi') || this.networkInterfaces[0];
    return pref;
  }

  setActiveInterface(address) {
    const found = this.networkInterfaces.find(i => i.address === address);
    if (found) {
      this.activeInterface = found;
      this.broadcast({
        type: 'network-changed',
        activeInterface: this.activeInterface,
        url: this.getAccessUrl()
      });
      return true;
    }
    return false;
  }

  getAccessUrl() {
    return `http://${this.activeInterface.address}:${this.port}`;
  }

  async getQrCodeDataUrl() {
    const url = this.getAccessUrl();
    try {
      return await QRCode.toDataURL(url, {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 300,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      });
    } catch (err) {
      console.error('Failed to generate QR Code:', err);
      return null;
    }
  }

  getSafeFilename(dir, originalName) {
    let name = path.basename(originalName);
    let target = path.join(dir, name);
    if (!fs.existsSync(target)) return name;

    const ext = path.extname(name);
    const base = path.basename(name, ext);
    let counter = 1;
    while (fs.existsSync(path.join(dir, `${base} (${counter})${ext}`))) {
      counter++;
    }
    return `${base} (${counter})${ext}`;
  }

  setupExpress() {
    this.app.use(cors());
    this.app.use(express.json());

    // Serve static mobile UI from public directory
    const publicPath = path.join(__dirname, '..', 'public');
    const rendererPath = path.join(__dirname, 'renderer');
    
    this.app.use('/mobile', express.static(publicPath));
    this.app.use('/desktop', express.static(rendererPath));
    this.app.use(express.static(publicPath));

    // Intelligent root route: Mobile gets mobile UI, Desktop gets desktop dashboard
    this.app.get('/', (req, res) => {
      const userAgent = req.headers['user-agent'] || '';
      const isMobile = /mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(userAgent);
      if (isMobile) {
        res.sendFile(path.join(publicPath, 'index.html'));
      } else {
        res.sendFile(path.join(rendererPath, 'index.html'));
      }
    });

    // Multer storage engine
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        this.ensureSaveDirectory();
        cb(null, this.savePath);
      },
      filename: (req, file, cb) => {
        // Decode URI encoded or UTF-8 filenames properly
        let decodedName = file.originalname;
        try {
          decodedName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        } catch (e) {
          decodedName = file.originalname;
        }
        const safeName = this.getSafeFilename(this.savePath, decodedName);
        cb(null, safeName);
      }
    });

    const upload = multer({
      storage,
      limits: { fileSize: 10 * 1024 * 1024 * 1024 } // 10 GB limit per file
    });

    // API: System Info & Network
    this.app.get('/api/info', async (req, res) => {
      this.networkInterfaces = this.getNetworkInterfaces();
      const qrDataUrl = await this.getQrCodeDataUrl();
      res.json({
        activeInterface: this.activeInterface,
        interfaces: this.networkInterfaces,
        port: this.port,
        url: this.getAccessUrl(),
        savePath: this.savePath,
        qrCode: qrDataUrl,
        stagedFiles: Array.from(this.stagedFiles.values()),
        clipboard: this.sharedClipboard,
        clientsCount: this.clients.size,
        transferHistory: this.transferHistory
      });
    });

    this.app.post('/api/interface', async (req, res) => {
      const { address } = req.body;
      if (address) {
        this.setActiveInterface(address);
        const qrCode = await this.getQrCodeDataUrl();
        return res.json({
          success: true,
          activeInterface: this.activeInterface,
          url: this.getAccessUrl(),
          qrCode
        });
      }
      res.status(400).json({ error: 'Address required' });
    });

    // API: Upload files from phone
    this.app.post('/api/upload', upload.any(), (req, res) => {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const receivedList = req.files.map(file => {
        const item = {
          id: Math.random().toString(36).substring(2, 9),
          filename: file.filename,
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          path: file.path,
          timestamp: new Date().toISOString()
        };
        this.transferHistory.unshift(item);
        return item;
      });

      // Keep only last 100 history items
      if (this.transferHistory.length > 100) {
        this.transferHistory = this.transferHistory.slice(0, 100);
      }

      // Broadcast to desktop & clients
      this.broadcast({
        type: 'files-received',
        files: receivedList
      });

      this.emitToDesktop('files-received', receivedList);

      res.json({
        success: true,
        count: receivedList.length,
        files: receivedList
      });
    });

    // API: Shared files (for phone to download from PC)
    this.app.get('/api/shared-files', (req, res) => {
      res.json(Array.from(this.stagedFiles.values()));
    });

    // API: Download a shared file to phone
    this.app.get('/api/download/:id', (req, res) => {
      const file = this.stagedFiles.get(req.params.id);
      if (!file || !fs.existsSync(file.originalPath)) {
        return res.status(404).send('File not found or has been removed');
      }

      res.download(file.originalPath, file.name, (err) => {
        if (err) {
          console.error('Download error:', err);
        } else {
          file.downloadCount = (file.downloadCount || 0) + 1;
          this.broadcast({
            type: 'file-downloaded',
            fileId: file.id,
            downloadCount: file.downloadCount
          });
        }
      });
    });

    // API: Download all staged files as a single ZIP
    this.app.get('/api/download-all-zip', (req, res) => {
      const files = Array.from(this.stagedFiles.values()).filter(f => fs.existsSync(f.originalPath));
      if (files.length === 0) {
        return res.status(404).send('No files staged for download.');
      }

      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const zipFilename = `Inthawnna_Files_${dateStr}.zip`;

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);

      const archive = archiver('zip', {
        zlib: { level: 5 }
      });

      archive.on('error', (err) => {
        console.error('ZIP streaming error:', err);
        if (!res.headersSent) {
          res.status(500).send('Error creating ZIP archive');
        }
      });

      archive.pipe(res);

      for (const file of files) {
        archive.file(file.originalPath, { name: file.name });
        file.downloadCount = (file.downloadCount || 0) + 1;
      }

      archive.finalize();

      this.broadcast({
        type: 'staged-files-updated',
        stagedFiles: Array.from(this.stagedFiles.values())
      });
    });

    // API: Stream/Preview a staged file inline (images, videos, etc.)
    this.app.get('/api/preview/:id', (req, res) => {
      const file = this.stagedFiles.get(req.params.id);
      if (!file || !fs.existsSync(file.originalPath)) {
        return res.status(404).send('File not found');
      }

      const mimeType = file.mimeType || mime.lookup(file.originalPath) || 'application/octet-stream';
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', 'inline; filename="' + encodeURIComponent(file.name) + '"');
      fs.createReadStream(file.originalPath).pipe(res);
    });

    // API: Stream/Preview a received file inline (images, videos, etc.)
    this.app.get('/api/received-file/:id', (req, res) => {
      const file = this.transferHistory.find(f => f.id === req.params.id);
      if (!file || !fs.existsSync(file.path)) {
        return res.status(404).send('File not found');
      }

      const mimeType = file.mimetype || mime.lookup(file.path) || 'application/octet-stream';
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', 'inline; filename="' + encodeURIComponent(file.filename) + '"');
      fs.createReadStream(file.path).pipe(res);
    });

    // API: Clipboard sync
    this.app.get('/api/clipboard', (req, res) => {
      res.json(this.sharedClipboard);
    });

    this.app.post('/api/clipboard', (req, res) => {
      const { text, source } = req.body;
      if (typeof text === 'string') {
        this.sharedClipboard = {
          text,
          source: source || 'mobile',
          updatedAt: new Date().toISOString()
        };

        this.broadcast({
          type: 'clipboard-updated',
          clipboard: this.sharedClipboard
        });

        this.emitToDesktop('clipboard-updated', this.sharedClipboard);
        return res.json({ success: true, clipboard: this.sharedClipboard });
      }
      res.status(400).json({ error: 'Invalid text' });
    });
  }

  addStagedFiles(filePaths) {
    const added = [];
    for (const filePath of filePaths) {
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        if (stats.isFile()) {
          const id = Math.random().toString(36).substring(2, 9);
          const name = path.basename(filePath);
          const item = {
            id,
            name,
            originalPath: filePath,
            size: stats.size,
            mimeType: mime.lookup(filePath) || 'application/octet-stream',
            addedAt: new Date().toISOString(),
            downloadCount: 0
          };
          this.stagedFiles.set(id, item);
          added.push(item);
        }
      }
    }

    if (added.length > 0) {
      this.broadcast({
        type: 'staged-files-updated',
        stagedFiles: Array.from(this.stagedFiles.values())
      });
      this.emitToDesktop('staged-files-updated', Array.from(this.stagedFiles.values()));
    }
    return added;
  }

  removeStagedFile(id) {
    if (this.stagedFiles.has(id)) {
      this.stagedFiles.delete(id);
      this.broadcast({
        type: 'staged-files-updated',
        stagedFiles: Array.from(this.stagedFiles.values())
      });
      this.emitToDesktop('staged-files-updated', Array.from(this.stagedFiles.values()));
      return true;
    }
    return false;
  }

  clearStagedFiles() {
    this.stagedFiles.clear();
    this.broadcast({
      type: 'staged-files-updated',
      stagedFiles: []
    });
    this.emitToDesktop('staged-files-updated', []);
  }

  broadcast(message) {
    const payload = JSON.stringify(message);
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }

  async start() {
    this.port = await this.findAvailablePort(this.port);
    return new Promise((resolve, reject) => {
      this.server = http.createServer(this.app);

      // WebSocket setup
      this.wss = new WebSocketServer({ server: this.server });
      this.wss.on('connection', (ws, req) => {
        this.clients.add(ws);
        
        // Notify desktop of connected phone count
        this.emitToDesktop('client-connected', { clientsCount: this.clients.size });
        this.broadcast({
          type: 'client-count',
          count: this.clients.size
        });

        // Send initial state to newly connected client
        ws.send(JSON.stringify({
          type: 'init-state',
          stagedFiles: Array.from(this.stagedFiles.values()),
          clipboard: this.sharedClipboard,
          savePath: this.savePath
        }));

        ws.on('message', (data) => {
          try {
            const msg = JSON.parse(data.toString());
            if (msg.type === 'clipboard-send') {
              this.sharedClipboard = {
                text: msg.text,
                source: msg.source || 'mobile',
                updatedAt: new Date().toISOString()
              };
              this.broadcast({
                type: 'clipboard-updated',
                clipboard: this.sharedClipboard
              });
              this.emitToDesktop('clipboard-updated', this.sharedClipboard);
            }
          } catch (e) {
            console.error('Invalid WS message:', e);
          }
        });

        ws.on('close', () => {
          this.clients.delete(ws);
          this.emitToDesktop('client-disconnected', { clientsCount: this.clients.size });
          this.broadcast({
            type: 'client-count',
            count: this.clients.size
          });
        });
      });

      this.server.listen(this.port, '0.0.0.0', () => {
        console.log(`Inthawnna server listening on port ${this.port}`);
        resolve({
          port: this.port,
          url: this.getAccessUrl()
        });
      });

      this.server.on('error', (err) => {
        console.error('Server error:', err);
        reject(err);
      });
    });
  }

  static isPortFree(port) {
    return new Promise((resolve) => {
      const tester = net.createServer();
      tester.once('error', () => resolve(false));
      tester.once('listening', () => {
        tester.close(() => resolve(true));
      });
      tester.listen(port, '0.0.0.0');
    });
  }

  async findAvailablePort(startPort) {
    let p = startPort;
    for (let i = 0; i < 50; i++) {
      const free = await BeamServer.isPortFree(p);
      if (free) return p;
      p++;
    }
    return startPort;
  }

  stop() {
    return new Promise((resolve) => {
      if (this.wss) {
        this.wss.close();
      }
      if (this.server) {
        this.server.close(() => resolve());
      } else {
        resolve();
      }
    });
  }
}

module.exports = BeamServer;
