'use strict';

const fs = require('fs');
const path = require('path');

const ORAL_DIRNAME = 'oral';
const ORAL_REGISTRY_NAME = 'lessons.json';

function getOralDir(folderPath) {
  return path.join(folderPath, ORAL_DIRNAME);
}

function getOralRegistryPath(folderPath) {
  return path.join(getOralDir(folderPath), ORAL_REGISTRY_NAME);
}

function makeOralLessonId(number, title) {
  const raw = `oral::${typeof number === 'number' && number > 0 ? number : 'x'}::${String(title || '').trim()}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0;
  }
  return `oral-${Math.abs(hash).toString(36)}`;
}

function normalizeOralLesson(entry) {
  if (!entry || typeof entry !== 'object') {
    return null;
  }
  const number = typeof entry.number === 'number' && Number.isInteger(entry.number) && entry.number > 0
    ? entry.number
    : null;
  const title = typeof entry.title === 'string' ? entry.title.trim() : '';
  if (number === null || !title) {
    return null;
  }
  return {
    id: typeof entry.id === 'string' && entry.id ? entry.id : makeOralLessonId(number, title),
    number,
    title
  };
}

function readOralRegistry(folderPath) {
  const registryPath = getOralRegistryPath(folderPath);
  if (!fs.existsSync(registryPath)) {
    return [];
  }
  let raw;
  try {
    raw = fs.readFileSync(registryPath, 'utf-8');
  } catch (err) {
    return [];
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return [];
  }
  if (!Array.isArray(parsed)) {
    return [];
  }
  const seenNumbers = new Set();
  const lessons = [];
  for (const entry of parsed) {
    const lesson = normalizeOralLesson(entry);
    if (!lesson || seenNumbers.has(lesson.number)) {
      continue;
    }
    seenNumbers.add(lesson.number);
    lessons.push(lesson);
  }
  lessons.sort((a, b) => a.number - b.number);
  return lessons;
}

function writeOralRegistry(folderPath, lessons) {
  const dir = getOralDir(folderPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const seenNumbers = new Set();
  const entries = [];
  for (const entry of lessons || []) {
    const lesson = normalizeOralLesson(entry);
    if (!lesson || seenNumbers.has(lesson.number)) {
      continue;
    }
    seenNumbers.add(lesson.number);
    entries.push({ id: lesson.id, number: lesson.number, title: lesson.title });
  }
  entries.sort((a, b) => a.number - b.number);
  const registryPath = getOralRegistryPath(folderPath);
  const tmpPath = `${registryPath}.tmp`;
  fs.writeFileSync(tmpPath, `${JSON.stringify(entries, null, 2)}\n`, 'utf-8');
  fs.renameSync(tmpPath, registryPath);
  return entries.map(normalizeOralLesson);
}

function saveOralLesson(folderPath, lesson) {
  const normalized = normalizeOralLesson(lesson);
  if (!normalized) {
    return { error: 'invalid-oral-lesson' };
  }
  const lessons = readOralRegistry(folderPath);
  const existing = lessons.find((l) => l.number === normalized.number);
  if (existing) {
    existing.title = normalized.title;
    return { lesson: existing };
  }
  lessons.push(normalized);
  const saved = writeOralRegistry(folderPath, lessons);
  const created = saved.find((l) => l.number === normalized.number) || null;
  return created ? { lesson: created } : { error: 'save-failed' };
}

function deleteOralLesson(folderPath, number) {
  if (typeof number !== 'number' || !Number.isInteger(number) || number <= 0) {
    return { error: 'invalid-number' };
  }
  const lessons = readOralRegistry(folderPath);
  const remaining = lessons.filter((l) => l.number !== number);
  if (remaining.length === lessons.length) {
    return { error: 'not-found' };
  }
  writeOralRegistry(folderPath, remaining);
  return { ok: true };
}

module.exports = {
  ORAL_DIRNAME,
  ORAL_REGISTRY_NAME,
  getOralDir,
  getOralRegistryPath,
  makeOralLessonId,
  normalizeOralLesson,
  readOralRegistry,
  writeOralRegistry,
  saveOralLesson,
  deleteOralLesson
};
