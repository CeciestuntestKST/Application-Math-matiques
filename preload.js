'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getState: () => ipcRenderer.invoke('app:get-state'),
  getVersion: () => ipcRenderer.invoke('app:get-version'),
  selectFolder: () => ipcRenderer.invoke('app:select-folder'),
  scanFolder: () => ipcRenderer.invoke('app:scan-folder'),
  readSettings: () => ipcRenderer.invoke('app:read-settings'),
  readTex: (filePath) => ipcRenderer.invoke('app:read-tex', filePath),
  readPdf: (filePath) => ipcRenderer.invoke('app:read-pdf', filePath),
  openExternal: (url) => ipcRenderer.invoke('app:open-external', url),
  getUpdateStatus: () => ipcRenderer.invoke('app:get-update-status'),
  checkUpdates: () => ipcRenderer.invoke('app:check-updates'),
  installUpdate: () => ipcRenderer.invoke('app:install-update'),
  onUpdateStatus: (callback) => {
    const listener = (_event, status) => callback(status);
    ipcRenderer.on('app:update-status', listener);
    return () => ipcRenderer.removeListener('app:update-status', listener);
  },
  onFolderChanged: (callback) => {
    const listener = (_event, changedPaths) => callback(changedPaths);
    ipcRenderer.on('app:folder-changed', listener);
    return () => ipcRenderer.removeListener('app:folder-changed', listener);
  },
  getLessons: () => ipcRenderer.invoke('app:lessons-get'),
  saveLesson: (lesson) => ipcRenderer.invoke('app:lessons-save', lesson),
  deleteLesson: (lessonId) => ipcRenderer.invoke('app:lessons-delete', lessonId),
  platform: process.platform
});
