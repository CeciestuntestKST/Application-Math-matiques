'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getState: () => ipcRenderer.invoke('app:get-state'),
  selectFolder: () => ipcRenderer.invoke('app:select-folder'),
  scanFolder: () => ipcRenderer.invoke('app:scan-folder'),
  readSettings: () => ipcRenderer.invoke('app:read-settings'),
  readTex: (filePath) => ipcRenderer.invoke('app:read-tex', filePath),
  readPdf: (filePath) => ipcRenderer.invoke('app:read-pdf', filePath),
  openExternal: (url) => ipcRenderer.invoke('app:open-external', url),
  onFolderChanged: (callback) => {
    const listener = (_event, changedPaths) => callback(changedPaths);
    ipcRenderer.on('app:folder-changed', listener);
    return () => ipcRenderer.removeListener('app:folder-changed', listener);
  },
  platform: process.platform
});
