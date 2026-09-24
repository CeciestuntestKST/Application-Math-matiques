'use strict';

const LESSON_COLOR = '#e8c97a';

function createLessonModel({ id, title, notionIds, createdAt, updatedAt } = {}) {
  const now = new Date().toISOString();
  return {
    id: id || `lesson::${now}::${Math.random().toString(36).slice(2, 8)}`,
    title: typeof title === 'string' && title.trim() ? title.trim() : 'Nouvelle leçon',
    notionIds: Array.isArray(notionIds) ? notionIds.filter((v) => typeof v === 'string') : [],
    createdAt: createdAt || now,
    updatedAt: updatedAt || now
  };
}

function normalizeLessons(raw) {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .filter((entry) => entry && typeof entry === 'object')
    .map((entry) => createLessonModel(entry))
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0));
}

function touchLesson(lesson) {
  lesson.updatedAt = new Date().toISOString();
  return lesson;
}

function resolveLessonNotions(lesson, allNotions) {
  const byId = new Map();
  for (const notion of allNotions) {
    if (!byId.has(notion.id)) {
      byId.set(notion.id, []);
    }
    byId.get(notion.id).push(notion);
  }
  const resolved = [];
  for (const notionId of lesson.notionIds) {
    const entries = byId.get(notionId) || null;
    resolved.push(entries ? { ok: true, notionId, notions: entries } : { ok: false, notionId });
  }
  return resolved;
}

function setLessonTitle(lessons, lessonId, title) {
  const lesson = lessons.find((l) => l.id === lessonId);
  if (!lesson) {
    return false;
  }
  const clean = typeof title === 'string' && title.trim() ? title.trim() : null;
  if (!clean || clean === lesson.title) {
    return true;
  }
  lesson.title = clean;
  touchLesson(lesson);
  return true;
}

function addNotionToLesson(lessons, lessonId, notionId) {
  const lesson = lessons.find((l) => l.id === lessonId);
  if (!lesson) {
    return false;
  }
  if (lesson.notionIds.includes(notionId)) {
    return true;
  }
  lesson.notionIds.push(notionId);
  touchLesson(lesson);
  return true;
}

function removeNotionFromLesson(lessons, lessonId, notionId) {
  const lesson = lessons.find((l) => l.id === lessonId);
  if (!lesson) {
    return false;
  }
  const idx = lesson.notionIds.indexOf(notionId);
  if (idx === -1) {
    return true;
  }
  lesson.notionIds.splice(idx, 1);
  touchLesson(lesson);
  return true;
}

function moveNotionInLesson(lessons, lessonId, notionId, offset) {
  const lesson = lessons.find((l) => l.id === lessonId);
  if (!lesson) {
    return false;
  }
  const idx = lesson.notionIds.indexOf(notionId);
  if (idx === -1) {
    return true;
  }
  const target = idx + offset;
  if (target < 0 || target >= lesson.notionIds.length) {
    return true;
  }
  const [moved] = lesson.notionIds.splice(idx, 1);
  lesson.notionIds.splice(target, 0, moved);
  touchLesson(lesson);
  return true;
}

function upsertLesson(lessons, lesson) {
  const existing = lessons.find((l) => l.id === lesson.id);
  if (existing) {
    Object.assign(existing, lesson);
    touchLesson(existing);
    return existing;
  }
  lessons.unshift(lesson);
  touchLesson(lesson);
  return lesson;
}

function deleteLesson(lessons, lessonId) {
  const idx = lessons.findIndex((l) => l.id === lessonId);
  if (idx === -1) {
    return false;
  }
  lessons.splice(idx, 1);
  return true;
}

function lessonStats(lesson, allNotions) {
  const resolved = resolveLessonNotions(lesson, allNotions);
  const ok = resolved.filter((r) => r.ok);
  const missing = resolved.length - ok.length;
  return { total: lesson.notionIds.length, ok: ok.length, missing };
}

module.exports = {
  LESSON_COLOR,
  createLessonModel,
  normalizeLessons,
  touchLesson,
  resolveLessonNotions,
  setLessonTitle,
  addNotionToLesson,
  removeNotionFromLesson,
  moveNotionInLesson,
  upsertLesson,
  deleteLesson,
  lessonStats
};
