const { app, BrowserWindow, ipcMain, dialog, shell, clipboard, Notification } = require('electron');
const path = require('path');
const fs = require('fs');
const BeamServer = require('./server');

let mainWindow = null;
let beamServer = null;

function createWindow() {
  const iconPath = path.join(__dirname, '..', 'build', 'icon.ico');
  const hasIcon = fs.existsSync(iconPath);

  mainWindow = new BrowserWindow({
    width: 1120,
    height: 760,
    minWidth: 920,
    minHeight: 640,
    backgroundColor: '#000000',
    title: 'Inthawnna File Transfer - Wireless Phone to PC',
    icon: hasIcon ? iconPath : undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    autoHideMenuBar: true,
    show: false
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function initServer() {
  beamServer = new BeamServer({ port: 5200 });
  
  // Forward server events to renderer
  beamServer.setDesktopEventCallback((event, data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(event, data);

      // Show native Windows notification on incoming files
      if (event === 'files-received') {
        const count = data.length;
        const firstName = data[0].filename;
        const msg = count === 1 ? `Received "${firstName}"` : `Received ${count} files (including "${firstName}")`;
        
        if (Notification.isSupported()) {
          new Notification({
            title: '⚡ BeamDrop File Transfer',
            body: msg,
            silent: false
          }).show();
        }
      }
    }
  });

  await beamServer.start();
}

function registerIpcHandlers() {
  ipcMain.handle('get-initial-data', async () => {
    const qrCode = await beamServer.getQrCodeDataUrl();
    return {
      activeInterface: beamServer.activeInterface,
      interfaces: beamServer.networkInterfaces,
      port: beamServer.port,
      url: beamServer.getAccessUrl(),
      savePath: beamServer.savePath,
      qrCode,
      stagedFiles: Array.from(beamServer.stagedFiles.values()),
      clipboard: beamServer.sharedClipboard,
      transferHistory: beamServer.transferHistory
    };
  });

  ipcMain.handle('refresh-network', async () => {
    beamServer.networkInterfaces = beamServer.getNetworkInterfaces();
    // Verify if active interface is still valid
    const stillValid = beamServer.networkInterfaces.some(i => i.address === beamServer.activeInterface.address);
    if (!stillValid) {
      beamServer.activeInterface = beamServer.selectDefaultInterface();
    }
    const qrCode = await beamServer.getQrCodeDataUrl();
    return {
      activeInterface: beamServer.activeInterface,
      interfaces: beamServer.networkInterfaces,
      url: beamServer.getAccessUrl(),
      qrCode
    };
  });

  ipcMain.handle('change-interface', async (event, address) => {
    beamServer.setActiveInterface(address);
    const qrCode = await beamServer.getQrCodeDataUrl();
    return {
      activeInterface: beamServer.activeInterface,
      url: beamServer.getAccessUrl(),
      qrCode
    };
  });

  ipcMain.handle('select-save-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Select Destination Folder for Received Files',
      defaultPath: beamServer.savePath,
      properties: ['openDirectory', 'createDirectory']
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const selected = result.filePaths[0];
      beamServer.setSavePath(selected);
      return { success: true, savePath: selected };
    }
    return { success: false, savePath: beamServer.savePath };
  });

  ipcMain.handle('open-save-folder', async () => {
    beamServer.ensureSaveDirectory();
    await shell.openPath(beamServer.savePath);
    return true;
  });

  ipcMain.handle('open-file', async (event, filePath) => {
    if (filePath) {
      await shell.openPath(filePath);
      return true;
    }
    return false;
  });

  ipcMain.handle('show-item-in-folder', async (event, filePath) => {
    if (filePath) {
      shell.showItemInFolder(filePath);
      return true;
    }
    return false;
  });

  ipcMain.handle('add-files-dialog', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Select Files to Share with Phone',
      properties: ['openFile', 'multiSelections']
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const added = beamServer.addStagedFiles(result.filePaths);
      return added;
    }
    return [];
  });

  ipcMain.handle('add-files-by-paths', async (event, filePaths) => {
    if (Array.isArray(filePaths) && filePaths.length > 0) {
      return beamServer.addStagedFiles(filePaths);
    }
    return [];
  });

  ipcMain.handle('stage-data-url', async (event, { dataUrl, filename }) => {
    try {
      const os = require('os');
      const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) return { success: false };
      const buffer = Buffer.from(matches[2], 'base64');
      const fname = filename || `Screenshot_${Date.now()}.png`;
      const tempPath = path.join(os.tmpdir(), fname);
      fs.writeFileSync(tempPath, buffer);
      beamServer.addStagedFiles([tempPath]);
      return { success: true, filename: fname };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('remove-staged-file', (event, id) => {
    return beamServer.removeStagedFile(id);
  });

  ipcMain.handle('clear-staged-files', () => {
    beamServer.clearStagedFiles();
    return true;
  });

  ipcMain.handle('copy-to-clipboard', (event, text) => {
    if (typeof text === 'string') {
      clipboard.writeText(text);
      return true;
    }
    return false;
  });

  ipcMain.handle('send-clipboard-to-phone', (event, text) => {
    if (typeof text === 'string') {
      beamServer.sharedClipboard = {
        text,
        source: 'desktop',
        updatedAt: new Date().toISOString()
      };
      beamServer.broadcast({
        type: 'clipboard-updated',
        clipboard: beamServer.sharedClipboard
      });
      return true;
    }
    return false;
  });
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    try {
      await initServer();
      registerIpcHandlers();
      createWindow();

      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          createWindow();
        }
      });
    } catch (err) {
      console.error('Failed to start application:', err);
      dialog.showErrorBox('Inthawnna Startup Error', err.message || String(err));
    }
  });
}

app.on('window-all-closed', async () => {
  if (beamServer) {
    await beamServer.stop();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
