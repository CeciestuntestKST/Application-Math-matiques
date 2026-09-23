'use strict';

const { app } = require('electron');

let autoUpdaterRef = null;

function getAutoUpdater() {
  if (autoUpdaterRef) {
    return autoUpdaterRef;
  }
  try {
    autoUpdaterRef = require('electron-updater').autoUpdater;
  } catch (err) {
    autoUpdaterRef = null;
  }
  return autoUpdaterRef;
}

const UPDATE_CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000;

let logStream = null;

function log(message) {
  try {
    if (!logStream && app.getPath) {
      const fs = require('fs');
      const path = require('path');
      logStream = fs.createWriteStream(path.join(app.getPath('userData'), 'update.log'), { flags: 'a' });
    }
    if (logStream) {
      logStream.write(`[${new Date().toISOString()}] ${message}\n`);
    }
  } catch (err) {
    /* le log de diagnostic ne doit jamais faire échouer la mise à jour */
  }
}

const status = {
  supported: false,
  available: false,
  downloaded: false,
  version: null,
  error: null,
  progress: null
};

let configured = false;
let listenersBound = false;
let timer = null;

function isDevRun(argv) {
  return Array.isArray(argv) && argv.includes('--dev');
}

function isPackaged() {
  return app.isPackaged === true;
}

function bindAutoUpdaterEvents(onChange) {
  if (listenersBound) {
    return;
  }

  const autoUpdater = getAutoUpdater();
  if (!autoUpdater) {
    status.error = 'electron-updater indisponible';
    if (onChange) {
      onChange();
    }
    return;
  }
  listenersBound = true;

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    log('vérification des mises à jour…');
    if (onChange) {
      onChange();
    }
  });

  autoUpdater.on('update-available', (info) => {
    log(`mise à jour disponible : ${info ? info.version : '?'}`);
    status.available = true;
    status.version = info ? info.version : null;
    status.error = null;
    if (onChange) {
      onChange();
    }
  });

  autoUpdater.on('update-not-available', () => {
    log('aucune mise à jour disponible');
    status.available = false;
    status.downloaded = false;
    status.error = null;
    if (onChange) {
      onChange();
    }
  });

  autoUpdater.on('download-progress', (progress) => {
    status.progress = {
      percent: progress && typeof progress.percent === 'number' ? Math.floor(progress.percent) : null,
      transferred: progress ? progress.transferred : null,
      total: progress ? progress.total : null
    };
    if (onChange) {
      onChange();
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    log(`mise à jour ${info ? info.version : '?'} téléchargée, en attente de redémarrage`);
    status.downloaded = true;
    status.available = true;
    status.version = info ? info.version : null;
    status.progress = null;
    status.error = null;
    if (onChange) {
      onChange();
    }
  });

  autoUpdater.on('error', (err) => {
    log(`erreur : ${err && err.stack ? err.stack : err}`);
    status.error = err && err.message ? err.message : String(err);
    status.progress = null;
    if (onChange) {
      onChange();
    }
  });
}

function getStatus() {
  return Object.assign({}, status, {
    currentVersion: app.getVersion()
  });
}

function checkNow() {
  if (!configured) {
    return { error: 'not-configured' };
  }
  const autoUpdater = getAutoUpdater();
  if (!autoUpdater) {
    return { error: 'electron-updater indisponible' };
  }
  try {
    autoUpdater.checkForUpdates();
    return { ok: true };
  } catch (err) {
    return { error: err.message };
  }
}

function quitAndInstall() {
  if (!status.downloaded) {
    return { error: 'not-downloaded' };
  }
  const autoUpdater = getAutoUpdater();
  if (!autoUpdater) {
    return { error: 'electron-updater indisponible' };
  }
  try {
    autoUpdater.quitAndInstall();
    return { ok: true };
  } catch (err) {
    return { error: err.message };
  }
}

function startPeriodicChecks() {
  if (timer) {
    return;
  }
  timer = setInterval(() => {
    checkNow();
  }, UPDATE_CHECK_INTERVAL_MS);
}

function initAutoUpdate({ isDev, notify }) {
  if (isDev || !isPackaged()) {
    status.supported = false;
    return false;
  }
  status.supported = true;
  bindAutoUpdaterEvents(() => {
    if (notify) {
      notify(getStatus());
    }
  });
  configured = true;
  checkNow();
  startPeriodicChecks();
  return true;
}

function stopAutoUpdate() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

module.exports = {
  isDevRun,
  isPackaged,
  initAutoUpdate,
  stopAutoUpdate,
  getStatus,
  checkNow,
  quitAndInstall
};
