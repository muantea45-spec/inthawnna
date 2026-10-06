const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('beamApi', {
  getInitialData: () => ipcRenderer.invoke('get-initial-data'),
  changeInterface: (address) => ipcRenderer.invoke('change-interface', address),
  selectSaveFolder: () => ipcRenderer.invoke('select-save-folder'),
  openSaveFolder: () => ipcRenderer.invoke('open-save-folder'),
  openFile: (filePath) => ipcRenderer.invoke('open-file', filePath),
  showItemInFolder: (filePath) => ipcRenderer.invoke('show-item-in-folder', filePath),
  addFilesDialog: () => ipcRenderer.invoke('add-files-dialog'),
  addFilesByPaths: (filePaths) => ipcRenderer.invoke('add-files-by-paths', filePaths),
  stageDataUrl: (data) => ipcRenderer.invoke('stage-data-url', data),
  removeStagedFile: (id) => ipcRenderer.invoke('remove-staged-file', id),
  clearStagedFiles: () => ipcRenderer.invoke('clear-staged-files'),
  copyToClipboard: (text) => ipcRenderer.invoke('copy-to-clipboard', text),
  sendClipboardToPhone: (text) => ipcRenderer.invoke('send-clipboard-to-phone', text),
  refreshNetwork: () => ipcRenderer.invoke('refresh-network'),

  // Listeners
  onFilesReceived: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('files-received', handler);
    return () => ipcRenderer.removeListener('files-received', handler);
  },
  onClientConnected: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('client-connected', handler);
    return () => ipcRenderer.removeListener('client-connected', handler);
  },
  onClientDisconnected: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('client-disconnected', handler);
    return () => ipcRenderer.removeListener('client-disconnected', handler);
  },
  onClipboardUpdated: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('clipboard-updated', handler);
    return () => ipcRenderer.removeListener('clipboard-updated', handler);
  },
  onStagedFilesUpdated: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('staged-files-updated', handler);
    return () => ipcRenderer.removeListener('staged-files-updated', handler);
  }
});
