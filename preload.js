'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getState: () => ipcRenderer.invoke('app:get-state'),
  selectFolder: () => ipcRenderer.invoke('app:select-folder'),
  scanFolder: () => ipcRenderer.invoke('app:scan-folder'),
  readSettings: () => ipcRenderer.invoke('app:read-settings'),
  readTex: (filePath) => ipcRenderer.invoke('app:read-tex', filePath),
  readPdf: (filePath) => ipcRenderer.invoke('app:read-pdf', filePath),
  platform: process.platform
});
