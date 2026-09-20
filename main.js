'use strict';

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { scanFolder } = require('./lib/latex-notions');
const { readSettings } = require('./lib/settings-parser');

const isDev = process.argv.includes('--dev');
let mainWindow = null;

const state = {
  folder: null
};

function getPrefsPath() {
  return path.join(app.getPath('userData'), 'prefs.json');
}

function loadPrefs() {
  try {
    const raw = fs.readFileSync(getPrefsPath(), 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return {};
  }
}

function savePrefs(prefs) {
  try {
    fs.writeFileSync(getPrefsPath(), JSON.stringify(prefs, null, 2), 'utf-8');
  } catch (err) {
    if (isDev) {
      console.error('savePrefs failed:', err);
    }
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#1e1e1e',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      plugins: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  const prefs = loadPrefs();
  if (prefs.folder && fs.existsSync(prefs.folder)) {
    state.folder = prefs.folder;
  }
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('app:select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  if (result.canceled || result.filePaths.length === 0) {
    return { canceled: true, folder: null };
  }
  const folder = result.filePaths[0];
  state.folder = folder;
  savePrefs({ folder });
  return { canceled: false, folder };
});

ipcMain.handle('app:get-state', async () => {
  const prefs = loadPrefs();
  return {
    folder: state.folder || (prefs.folder && fs.existsSync(prefs.folder) ? prefs.folder : null),
    appVersion: app.getVersion()
  };
});

ipcMain.handle('app:scan-folder', async () => {
  if (!state.folder) {
    const prefs = loadPrefs();
    if (prefs.folder && fs.existsSync(prefs.folder)) {
      state.folder = prefs.folder;
    } else {
      return { error: 'no-folder' };
    }
  }
  try {
    const scan = scanFolder(state.folder);
    return {
      folder: scan.folder,
      settings: {
        found: scan.settings.found,
        path: scan.settings.path,
        macros: scan.settings.settings.macros,
        environments: scan.settings.settings.environments
      },
      courses: scan.courses,
      pdfFiles: scan.pdfFiles
    };
  } catch (err) {
    if (isDev) {
      console.error('scan failed:', err);
    }
    return { error: err.message };
  }
});

ipcMain.handle('app:read-settings', async () => {
  if (!state.folder) {
    return { error: 'no-folder' };
  }
  const result = readSettings(state.folder);
  if (!result.found) {
    return { found: false, content: '' };
  }
  return {
    found: true,
    path: result.path,
    content: fs.readFileSync(result.path, 'utf-8'),
    macros: result.settings.macros,
    environments: result.settings.environments
  };
});

ipcMain.handle('app:read-pdf', async (_event, filePath) => {
  if (!filePath || typeof filePath !== 'string') {
    return { error: 'invalid-path' };
  }
  if (!state.folder || !path.resolve(filePath).startsWith(path.resolve(state.folder))) {
    return { error: 'path-outside-folder' };
  }
  try {
    const data = await fs.promises.readFile(filePath);
    return { data: data.buffer, byteOffset: data.byteOffset, byteLength: data.byteLength };
  } catch (err) {
    return { error: err.code || 'read-error' };
  }
});

ipcMain.handle('app:read-tex', async (_event, filePath) => {
  if (!filePath || typeof filePath !== 'string') {
    return { error: 'invalid-path' };
  }
  if (!state.folder || !path.resolve(filePath).startsWith(path.resolve(state.folder))) {
    return { error: 'path-outside-folder' };
  }
  try {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    return { content };
  } catch (err) {
    return { error: err.code || 'read-error' };
  }
});

ipcMain.handle('app:open-external', async (_event, url) => {
  if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
    return { error: 'invalid-url' };
  }
  try {
    await shell.openExternal(url);
    return { ok: true };
  } catch (err) {
    return { error: err.message };
  }
});
