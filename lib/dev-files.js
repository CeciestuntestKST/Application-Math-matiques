'use strict';

const fs = require('fs');
const path = require('path');

const DEVS_DIRNAME = 'developpements';
const DEV_EXTENSION = '.tex';
const META_PREFIX = '% dev-meta:';

function getDevsDir(folderPath) {
  return path.join(folderPath, DEVS_DIRNAME);
}

function slugify(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'developpement';
}

function buildDevFileName(title, usedNames) {
  const base = `dev-${slugify(title)}`;
  let candidate = base;
  let suffix = 2;
  const taken = new Set(usedNames || []);
  while (taken.has(candidate + DEV_EXTENSION)) {
    candidate = `${base}-${suffix}`;
    suffix++;
  }
  return candidate + DEV_EXTENSION;
}

function normalizeLessonIds(lessonIds) {
  if (!Array.isArray(lessonIds)) {
    return [];
  }
  const seen = new Set();
  const ids = [];
  for (const id of lessonIds) {
    if (typeof id !== 'string' || !id || seen.has(id)) {
      continue;
    }
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

function normalizeLessonNumbers(lessonNumbers) {
  if (!Array.isArray(lessonNumbers)) {
    return [];
  }
  const seen = new Set();
  const numbers = []
  for (const value of lessonNumbers) {
    const num = typeof value === 'number' ? value : parseInt(value, 10);
    if (!Number.isInteger(num) || num <= 0 || seen.has(num)) {
      continue;
    }
    seen.add(num);
    numbers.push(num);
  }
  return numbers.sort((a, b) => a - b);
}

function encodeDevMeta(dev) {
  const meta = {
    title: dev.title || '',
    lessons: normalizeLessonIds(dev.lessonIds),
    lessonNumbers: normalizeLessonNumbers(dev.lessonNumbers)
  };
  return META_PREFIX + ' ' + JSON.stringify(meta);
}

function decodeDevMeta(line) {
  if (typeof line !== 'string' || !line.startsWith(META_PREFIX)) {
    return null;
  }
  try {
    const meta = JSON.parse(line.slice(META_PREFIX.length).trim());
    if (!meta || typeof meta !== 'object') {
      return null;
    }
    return {
      title: typeof meta.title === 'string' ? meta.title : '',
      lessons: normalizeLessonIds(meta.lessons),
      lessonNumbers: normalizeLessonNumbers(meta.lessonNumbers)
    };
  } catch (err) {
    return null;
  }
}

function buildDevFileContent(dev) {
  const lines = [
    encodeDevMeta(dev),
    `% Développement — ${dev.title || 'sans titre'}`,
    ''
  ];
  const body = typeof dev.content === 'string' ? dev.content : '';
  lines.push(body.replace(/\s+$/, ''));
  lines.push('');
  return lines.join('\n');
}

function parseDevFile(content, filePath) {
  if (typeof content !== 'string') {
    return null;
  }
  const lines = content.split(/\r?\n/);
  let meta = null;
  let firstMetaIdx = -1;
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    if (lines[i].startsWith(META_PREFIX)) {
      meta = decodeDevMeta(lines[i]);
      firstMetaIdx = i;
      break;
    }
  }
  let bodyStart = 0;
  if (firstMetaIdx !== -1) {
    bodyStart = firstMetaIdx + 1;
    if (bodyStart < lines.length && lines[bodyStart].startsWith('% Développement')) {
      bodyStart++;
    }
  }
  const body = lines.slice(bodyStart).join('\n').replace(/^\n+/, '').replace(/\s+$/, '');
  const title = meta && meta.title ? meta.title : path.basename(filePath, DEV_EXTENSION);
  return {
    id: filePath,
    path: filePath,
    fileName: path.basename(filePath),
    title,
    lessonIds: meta ? meta.lessons : [],
    lessonNumbers: meta ? meta.lessonNumbers : [],
    content: body,
    updatedAt: null
  };
}

function listDevFiles(folderPath) {
  const dir = getDevsDir(folderPath);
  if (!fs.existsSync(dir)) {
    return [];
  }
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    return [];
  }
  const devs = [];
  for (const entry of entries) {
    if (!entry.isFile() || path.extname(entry.name).toLowerCase() !== DEV_EXTENSION) {
      continue;
    }
    const filePath = path.join(dir, entry.name);
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const dev = parseDevFile(content, filePath);
      if (dev) {
        const stat = fs.statSync(filePath);
        dev.updatedAt = stat.mtime.toISOString();
        devs.push(dev);
      }
    } catch (err) {
      /* fichier illisible : ignoré */
    }
  }
  devs.sort((a, b) => a.title.localeCompare(b.title, 'fr'));
  return devs;
}

function ensureDevsDir(folderPath) {
  const dir = getDevsDir(folderPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function writeDevFile(folderPath, dev) {
  const dir = ensureDevsDir(folderPath);
  const previousFileName = dev.fileName || null;
  const existing = listDevFiles(folderPath)
    .map((d) => d.fileName)
    .filter((name) => name !== previousFileName);
  let fileName = previousFileName;
  if (!fileName || fileName !== buildDevFileName(dev.title, existing)) {
    const base = buildDevFileName(dev.title, existing);
    if (base !== fileName) {
      fileName = base;
    }
  }
  const target = path.join(dir, fileName);
  fs.writeFileSync(target, buildDevFileContent(dev), 'utf-8');
  if (previousFileName && previousFileName !== fileName) {
    try {
      fs.unlinkSync(path.join(dir, previousFileName));
    } catch (err) {
      /* l'ancien fichier a pu être déplacé entre-temps */
    }
  }
  const stat = fs.statSync(target);
  return {
    id: target,
    path: target,
    fileName,
    title: dev.title || '',
    lessonIds: normalizeLessonIds(dev.lessonIds),
    lessonNumbers: normalizeLessonNumbers(dev.lessonNumbers),
    content: typeof dev.content === 'string' ? dev.content : '',
    updatedAt: stat.mtime.toISOString()
  };
}

function deleteDevFile(filePath) {
  if (typeof filePath !== 'string' || path.extname(filePath).toLowerCase() !== DEV_EXTENSION) {
    return false;
  }
  try {
    fs.unlinkSync(filePath);
    return true;
  } catch (err) {
    return false;
  }
}

function isPathInDevsDir(folderPath, filePath) {
  const resolved = path.resolve(filePath);
  const dir = path.resolve(getDevsDir(folderPath));
  return resolved.startsWith(dir + path.sep);
}

module.exports = {
  DEVS_DIRNAME,
  DEV_EXTENSION,
  META_PREFIX,
  getDevsDir,
  slugify,
  buildDevFileName,
  normalizeLessonIds,
  normalizeLessonNumbers,
  encodeDevMeta,
  decodeDevMeta,
  buildDevFileContent,
  parseDevFile,
  listDevFiles,
  ensureDevsDir,
  writeDevFile,
  deleteDevFile,
  isPathInDevsDir
};
