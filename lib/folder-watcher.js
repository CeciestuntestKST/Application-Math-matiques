'use strict';

const fs = require('fs');
const path = require('path');

const WATCHED_EXTENSIONS = new Set(['.tex', '.pdf']);
const EXCLUDED_DIR_NAMES = new Set(['lecons']);

function isWatchedFile(filePath) {
  return WATCHED_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

function isInExcludedDir(root, filePath) {
  const rel = path.relative(path.resolve(root), path.resolve(filePath));
  if (!rel || rel.startsWith('..')) {
    return false;
  }
  const first = rel.split(path.sep)[0];
  return EXCLUDED_DIR_NAMES.has(first);
}

function createFolderWatcher(options) {
  const opts = options || {};
  const debounceMs = typeof opts.debounceMs === 'number' ? opts.debounceMs : 800;
  const pollMs = typeof opts.pollMs === 'number' ? opts.pollMs : 2000;
  const onChange = typeof opts.onChange === 'function' ? opts.onChange : null;
  const onError = typeof opts.onError === 'function' ? opts.onError : null;

  let root = null;
  let closed = false;
  let watcher = null;
  let pollTimer = null;
  let pollSnapshot = null;
  let debounceTimer = null;
  let pendingEvents = new Set();

  function normalize(filePath) {
    return path.resolve(filePath);
  }

  function belongsToRoot(filePath) {
    const rel = path.relative(root, normalize(filePath));
    return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel);
  }

  function record(filePath) {
    if (closed || !belongsToRoot(filePath) || !isWatchedFile(filePath)) {
      return;
    }
    if (isInExcludedDir(root, filePath)) {
      return;
    }
    pendingEvents.add(normalize(filePath));
    scheduleNotify();
  }

  function scheduleNotify() {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(flush, debounceMs);
  }

  function flush() {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    if (closed || pendingEvents.size === 0) {
      return;
    }
    const changed = Array.from(pendingEvents);
    pendingEvents = new Set();
    if (onChange) {
      try {
        onChange(changed);
      } catch (err) {
        if (onError) {
          onError(err);
        }
      }
    }
  }

  function buildPollSnapshot() {
    const snapshot = new Map();
    const walk = (dir, top) => {
      let entries;
      try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
      } catch (err) {
        return;
      }
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (top && EXCLUDED_DIR_NAMES.has(entry.name)) {
            continue;
          }
          walk(full, false);
        } else if (isWatchedFile(full)) {
          try {
            const stat = fs.statSync(full);
            snapshot.set(normalize(full), stat.mtimeMs + ':' + stat.size);
          } catch (err) {
            snapshot.set(normalize(full), 'missing');
          }
        }
      }
    };
    walk(root, true);
    return snapshot;
  }

  function diffSnapshot(previous, current) {
    const changed = [];
    for (const [file, stamp] of current) {
      if (!previous.has(file) || previous.get(file) !== stamp) {
        changed.push(file);
      }
    }
    for (const file of previous.keys()) {
      if (!current.has(file)) {
        changed.push(file);
      }
    }
    return changed;
  }

  function startPolling() {
    if (pollTimer || closed) {
      return;
    }
    pollSnapshot = buildPollSnapshot();
    pollTimer = setInterval(() => {
      if (closed) {
        return;
      }
      const current = buildPollSnapshot();
      const changed = diffSnapshot(pollSnapshot, current);
      pollSnapshot = current;
      if (changed.length > 0 && onChange) {
        try {
          onChange(changed);
        } catch (err) {
          if (onError) {
            onError(err);
          }
        }
      }
    }, pollMs);
  }

  return {
    start(folder) {
      if (closed) {
        return false;
      }
      if (!folder || typeof folder !== 'string') {
        return false;
      }
      root = normalize(folder);
      try {
        fs.accessSync(root);
      } catch (err) {
        return false;
      }
      watcher = fs.watch(root, { recursive: true }, (_eventType, filename) => {
        if (filename) {
          record(path.join(root, filename));
        } else {
          record(root);
        }
      });
      watcher.on('error', (err) => {
        if (onError) {
          onError(err);
        }
        startPolling();
        try {
          if (watcher) {
            watcher.close();
          }
        } catch (closeErr) {
          /* déjà fermé */
        }
        watcher = null;
      });
      return true;
    },
    stop() {
      closed = true;
      if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }
      if (watcher) {
        try {
          watcher.close();
        } catch (err) {
          /* déjà fermé */
        }
        watcher = null;
      }
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
      pendingEvents = new Set();
    }
  };
}

module.exports = {
  createFolderWatcher,
  isWatchedFile
};
