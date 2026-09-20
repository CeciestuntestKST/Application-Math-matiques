'use strict';

const { app, BrowserWindow, ipcMain, dialog, protocol } = require('electron');
const path = require('path');
const fs = require('fs');
const { scanFolder } = require('./lib/latex-notions');
const { readSettings } = require('./lib/settings-parser');

const isDev = process.argv.includes('--dev');
let mainWindow = null;

const state = {
  folder: null
};

const APP_SCHEME = 'mathapp';

protocol.registerSchemesAsPrivileged([
  {
    scheme: APP_SCHEME,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true
    }
  }
]);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.map': 'application/json; charset=utf-8'
};

function registerAppProtocol() {
  const allowedRoots = [
    path.resolve(__dirname, 'renderer'),
    path.resolve(__dirname, 'vendor')
  ];
  protocol.handle(APP_SCHEME, async (request) => {
    let relative;
    try {
      relative = decodeURIComponent(new URL(request.url).pathname).replace(/^\/+/, '');
    } catch (err) {
      return new Response('URL invalide', { status: 400 });
    }
    const filePath = path.resolve(__dirname, relative);
    if (!allowedRoots.some((root) => filePath === root || filePath.startsWith(root + path.sep))) {
      return new Response('Accès refusé', { status: 403 });
    }
    try {
      const data = await fs.promises.readFile(filePath);
      const contentType = MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
      return new Response(new Uint8Array(data), {
        status: 200,
        headers: { 'content-type': contentType }
      });
    } catch (err) {
      return new Response('Fichier introuvable', { status: 404 });
    }
  });
}

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

  mainWindow.loadURL(`${APP_SCHEME}://bundle/renderer/index.html`);

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  registerAppProtocol();
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
