'use strict';

const fs = require('fs');
const path = require('path');

const LESSONS_DIRNAME = 'lecons';
const LESSON_EXTENSION = '.tex';

function getLessonsDir(folderPath) {
  return path.join(folderPath, LESSONS_DIRNAME);
}

function slugify(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'lecon';
}

function buildLessonFileName(number, title, usedNames) {
  const base = typeof number === 'number' && number > 0
    ? `lecon-${String(number).padStart(2, '0')}-${slugify(title)}`
    : slugify(title);
  let candidate = base;
  let suffix = 2;
  const taken = new Set(usedNames || []);
  while (taken.has(candidate + LESSON_EXTENSION)) {
    candidate = `${base}-${suffix}`;
    suffix++;
  }
  return candidate + LESSON_EXTENSION;
}

const META_PREFIX = '% lesson-meta:';

function makeStableId(number, title) {
  const raw = `${typeof number === 'number' && number > 0 ? number : 'x'}::${String(title || '').trim()}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0;
  }
  return `lesson-${Math.abs(hash).toString(36)}`;
}

function encodeLessonMeta(lesson) {
  const meta = {
    number: lesson.number || null,
    title: lesson.title || '',
    id: makeStableId(lesson.number, lesson.title)
  };
  return META_PREFIX + ' ' + JSON.stringify(meta);
}

function decodeLessonMeta(line) {
  if (typeof line !== 'string' || !line.startsWith(META_PREFIX)) {
    return null;
  }
  try {
    const meta = JSON.parse(line.slice(META_PREFIX.length).trim());
    if (!meta || typeof meta !== 'object') {
      return null;
    }
    return {
      number: typeof meta.number === 'number' && meta.number > 0 ? meta.number : null,
      title: typeof meta.title === 'string' ? meta.title : '',
      id: typeof meta.id === 'string' && meta.id ? meta.id : null
    };
  } catch (err) {
    return null;
  }
}

function buildLessonFileContent(lesson) {
  const lines = [
    encodeLessonMeta(lesson),
    `% Leçon ${lesson.number || '—'} — ${lesson.title || 'sans titre'}`,
    ''
  ];
  const body = typeof lesson.content === 'string' ? lesson.content : '';
  lines.push(body.replace(/\s+$/, ''));
  lines.push('');
  return lines.join('\n');
}

function parseLessonFile(content, filePath) {
  if (typeof content !== 'string') {
    return null;
  }
  const lines = content.split(/\r?\n/);
  let meta = null;
  let firstMetaIdx = -1;
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    if (lines[i].startsWith(META_PREFIX)) {
      meta = decodeLessonMeta(lines[i]);
      firstMetaIdx = i;
      break;
    }
  }
  const number = meta ? meta.number : null;
  const title = meta && meta.title ? meta.title : path.basename(filePath, LESSON_EXTENSION);
  let bodyStart = 0;
  if (firstMetaIdx !== -1) {
    bodyStart = firstMetaIdx + 1;
    if (bodyStart < lines.length && lines[bodyStart].startsWith('% Leçon')) {
      bodyStart++;
    }
  }
  const body = lines.slice(bodyStart).join('\n').replace(/^\n+/, '').replace(/\s+$/, '');
  return {
    id: meta && meta.id ? meta.id : makeStableId(number, title),
    path: filePath,
    fileName: path.basename(filePath),
    number,
    title,
    content: body,
    updatedAt: null
  };
}

function listLessonFiles(folderPath) {
  const dir = getLessonsDir(folderPath);
  if (!fs.existsSync(dir)) {
    return [];
  }
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    return [];
  }
  const lessons = [];
  for (const entry of entries) {
    if (!entry.isFile() || path.extname(entry.name).toLowerCase() !== LESSON_EXTENSION) {
      continue;
    }
    const filePath = path.join(dir, entry.name);
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lesson = parseLessonFile(content, filePath);
      if (lesson) {
        const stat = fs.statSync(filePath);
        lesson.updatedAt = stat.mtime.toISOString();
        lessons.push(lesson);
      }
    } catch (err) {
      /* fichier illisible : ignoré */
    }
  }
  lessons.sort((a, b) => {
    if (a.number !== null && b.number !== null && a.number !== b.number) {
      return a.number - b.number;
    }
    if (a.number !== null && b.number === null) {
      return -1;
    }
    if (a.number === null && b.number !== null) {
      return 1;
    }
    return a.title.localeCompare(b.title, 'fr');
  });
  return lessons;
}

function ensureLessonsDir(folderPath) {
  const dir = getLessonsDir(folderPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function writeLessonFile(folderPath, lesson) {
  const dir = ensureLessonsDir(folderPath);
  const previousFileName = lesson.fileName || null;
  const existing = listLessonFiles(folderPath)
    .map((l) => l.fileName)
    .filter((name) => name !== previousFileName);
  let fileName = previousFileName;
  if (!fileName || fileName !== buildLessonFileName(lesson.number, lesson.title, existing)) {
    const base = buildLessonFileName(lesson.number, lesson.title, existing);
    if (base !== fileName) {
      fileName = base;
    }
  }
  const target = path.join(dir, fileName);
  fs.writeFileSync(target, buildLessonFileContent(lesson), 'utf-8');
  if (previousFileName && previousFileName !== fileName) {
    try {
      fs.unlinkSync(path.join(dir, previousFileName));
    } catch (err) {
      /* l'ancien fichier a pu être déplacé entre-temps */
    }
  }
  const stat = fs.statSync(target);
  const savedNumber = lesson.number || null;
  const savedTitle = lesson.title || '';
  return {
    id: makeStableId(savedNumber, savedTitle),
    path: target,
    fileName,
    number: savedNumber,
    title: savedTitle,
    content: typeof lesson.content === 'string' ? lesson.content : '',
    updatedAt: stat.mtime.toISOString()
  };
}

function deleteLessonFile(filePath) {
  if (typeof filePath !== 'string' || path.extname(filePath).toLowerCase() !== LESSON_EXTENSION) {
    return false;
  }
  try {
    fs.unlinkSync(filePath);
    return true;
  } catch (err) {
    return false;
  }
}

function isPathInLessonsDir(folderPath, filePath) {
  const resolved = path.resolve(filePath);
  const dir = path.resolve(getLessonsDir(folderPath));
  return resolved.startsWith(dir + path.sep);
}

module.exports = {
  LESSONS_DIRNAME,
  LESSON_EXTENSION,
  META_PREFIX,
  getLessonsDir,
  slugify,
  makeStableId,
  buildLessonFileName,
  encodeLessonMeta,
  decodeLessonMeta,
  buildLessonFileContent,
  parseLessonFile,
  listLessonFiles,
  ensureLessonsDir,
  writeLessonFile,
  deleteLessonFile,
  isPathInLessonsDir
};
