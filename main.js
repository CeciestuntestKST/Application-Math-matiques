'use strict';

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { scanFolder } = require('./lib/latex-notions');
const { flattenNotions } = require('./lib/notions-model');
const { readSettings } = require('./lib/settings-parser');
const { createFolderWatcher } = require('./lib/folder-watcher');
const autoUpdate = require('./lib/auto-update');
const lessonFiles = require('./lib/lesson-files');
const devFiles = require('./lib/dev-files');

const isDev = process.argv.includes('--dev');
let mainWindow = null;

const state = {
  folder: null
};

let folderWatcher = null;

function stopFolderWatcher() {
  if (folderWatcher) {
    folderWatcher.stop();
    folderWatcher = null;
  }
}

function startFolderWatcher(folder) {
  stopFolderWatcher();
  if (!folder) {
    return;
  }
  folderWatcher = createFolderWatcher({
    onChange: (changedPaths) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('app:folder-changed', changedPaths);
      }
    },
    onError: (err) => {
      if (isDev) {
        console.error('folder watcher error:', err);
      }
    }
  });
  if (!folderWatcher.start(folder) && isDev) {
    console.error('impossible de surveiller le dossier:', folder);
  }
}

function setActiveFolder(folder) {
  state.folder = folder;
  if (folder) {
    startFolderWatcher(folder);
  } else {
    stopFolderWatcher();
  }
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

let lastPrefsError = null;

function savePrefs(prefs) {
  lastPrefsError = null;
  const target = getPrefsPath();
  const tmp = target + '.tmp';
  try {
    fs.writeFileSync(tmp, JSON.stringify(prefs, null, 2), 'utf-8');
    fs.renameSync(tmp, target);
  } catch (err) {
    lastPrefsError = `${err.message} (chemin : ${target})`;
    if (isDev) {
      console.error('savePrefs failed:', err);
    }
  }
}

function updatePrefs(patch) {
  const prefs = loadPrefs();
  const merged = Object.assign({}, prefs, patch);
  savePrefs(merged);
  return merged;
}

function notifyUpdateStatus(status) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('app:update-status', status);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#1e1e1e',
    icon: path.join(__dirname, 'assets', 'icons', 'icon-256.png'),
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
    setActiveFolder(prefs.folder);
  }
  createWindow();
  autoUpdate.initAutoUpdate({ isDev, notify: notifyUpdateStatus });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  stopFolderWatcher();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopFolderWatcher();
});

ipcMain.handle('app:select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  if (result.canceled || result.filePaths.length === 0) {
    return { canceled: true, folder: null };
  }
  const folder = result.filePaths[0];
  setActiveFolder(folder);
  updatePrefs({ folder });
  return { canceled: false, folder };
});

ipcMain.handle('app:get-version', () => app.getVersion());

ipcMain.handle('app:get-state', async () => {
  const prefs = loadPrefs();
  return {
    folder: state.folder || (prefs.folder && fs.existsSync(prefs.folder) ? prefs.folder : null),
    appVersion: app.getVersion(),
    prefsError: lastPrefsError,
    userDataPath: app.getPath('userData')
  };
});

ipcMain.handle('app:scan-folder', async () => {
  if (!state.folder) {
    const prefs = loadPrefs();
    if (prefs.folder && fs.existsSync(prefs.folder)) {
      setActiveFolder(prefs.folder);
    } else {
      return { error: 'no-folder' };
    }
  }
  try {
    const scan = scanFolder(state.folder);
    const notions = flattenNotions(scan);
    return {
      folder: scan.folder,
      settings: {
        found: scan.settings.found,
        path: scan.settings.path,
        macros: scan.settings.settings.macros,
        environments: scan.settings.settings.environments
      },
      courses: scan.courses,
      notions,
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

ipcMain.handle('app:get-update-status', async () => {
  return autoUpdate.getStatus();
});

ipcMain.handle('app:check-updates', async () => {
  return autoUpdate.checkNow();
});

ipcMain.handle('app:install-update', async () => {
  return autoUpdate.quitAndInstall();
});

function requireCourseFolder() {
  if (!state.folder) {
    const prefs = loadPrefs();
    if (prefs.folder && fs.existsSync(prefs.folder)) {
      setActiveFolder(prefs.folder);
    }
  }
  return state.folder || null;
}

ipcMain.handle('app:lessons-list', async () => {
  const folder = requireCourseFolder();
  if (!folder) {
    return { error: 'no-folder' };
  }
  try {
    return { lessons: lessonFiles.listLessonFiles(folder) };
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle('app:lessons-save', async (_event, lesson) => {
  const folder = requireCourseFolder();
  if (!folder) {
    return { error: 'no-folder' };
  }
  if (!lesson || typeof lesson !== 'object') {
    return { error: 'invalid-lesson' };
  }
  if (lesson.path && !lessonFiles.isPathInLessonsDir(folder, lesson.path)) {
    return { error: 'path-outside-folder' };
  }
  try {
    const saved = lessonFiles.writeLessonFile(folder, lesson);
    return { lesson: saved };
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle('app:lessons-delete', async (_event, lessonPath) => {
  const folder = requireCourseFolder();
  if (!folder) {
    return { error: 'no-folder' };
  }
  if (typeof lessonPath !== 'string' || !lessonFiles.isPathInLessonsDir(folder, lessonPath)) {
    return { error: 'path-outside-folder' };
  }
  const ok = lessonFiles.deleteLessonFile(lessonPath);
  return ok ? { ok: true } : { error: 'delete-failed' };
});

ipcMain.handle('app:devs-list', async () => {
  const folder = requireCourseFolder();
  if (!folder) {
    return { error: 'no-folder' };
  }
  try {
    return { devs: devFiles.listDevFiles(folder) };
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle('app:devs-save', async (_event, dev) => {
  const folder = requireCourseFolder();
  if (!folder) {
    return { error: 'no-folder' };
  }
  if (!dev || typeof dev !== 'object') {
    return { error: 'invalid-dev' };
  }
  if (dev.path && !devFiles.isPathInDevsDir(folder, dev.path)) {
    return { error: 'path-outside-folder' };
  }
  try {
    const saved = devFiles.writeDevFile(folder, dev);
    return { dev: saved };
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle('app:devs-delete', async (_event, devPath) => {
  const folder = requireCourseFolder();
  if (!folder) {
    return { error: 'no-folder' };
  }
  if (typeof devPath !== 'string' || !devFiles.isPathInDevsDir(folder, devPath)) {
    return { error: 'path-outside-folder' };
  }
  const ok = devFiles.deleteDevFile(devPath);
  return ok ? { ok: true } : { error: 'delete-failed' };
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
