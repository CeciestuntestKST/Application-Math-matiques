'use strict';

const path = require('path');
const fs = require('fs');
const os = require('os');
const assert = require('assert');

const { parseSettings } = require('../lib/settings-parser');
const {
  splitArguments,
  parseLeadingGroups,
  extractTitledEnvironments,
  discoverTitledEnvironments,
  extractAllNotions,
  scanFolder,
  listFiles
} = require('../lib/latex-notions');
const { flattenNotions } = require('../lib/notions-model');
const { createFolderWatcher, isWatchedFile } = require('../lib/folder-watcher');
const {
  createLessonModel,
  normalizeLessons,
  resolveLessonNotions,
  setLessonTitle,
  addNotionToLesson,
  removeNotionFromLesson,
  moveNotionInLesson,
  upsertLesson,
  deleteLesson,
  lessonStats
} = require('../lib/lessons-model');

function makeTempFolder() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'maths-app-test-'));
}

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`ok - ${name}`);
  } catch (err) {
    failed++;
    console.error(`FAIL - ${name}`);
    console.error(err.stack);
  }
}

const asyncTests = [];

function asyncTest(name, fn) {
  asyncTests.push({ name, fn });
}

test('parseSettings extrait newcommand et newtheorem', () => {
  const settings = parseSettings([
    '\\newcommand{\\R}{\\mathbb{R}}',
    '\\newcommand{\\norme}[1]{\\left\\|#1\\right\\|}',
    '\\newtheorem{theoreme}{Théorème}',
    '\\newtheorem{definition}{Définition}',
    '% commentaire ignoré',
    '\\newenvironment{remarque}{\\begin{itemize}}{\\end{itemize}}'
  ].join('\n'));
  assert.strictEqual(settings.macros.length, 2);
  assert.strictEqual(settings.macros[0].name, '\\R');
  assert.strictEqual(settings.macros[0].body, '\\mathbb{R}');
  assert.strictEqual(settings.macros[1].args, 1);
  const envNames = settings.environments.map((e) => e.name);
  assert.ok(envNames.includes('theoreme'));
  assert.ok(envNames.includes('definition'));
  assert.ok(envNames.includes('remarque'));
});

test('splitArguments gère accolades imbriquées', () => {
  const args = splitArguments('{Titre}{\\frac{a}{b}} suite');
  assert.deepStrictEqual(args, ['Titre', '\\frac{a}{b}']);
});

test('parseLeadingGroups sépare titre et corps', () => {
  const parsed = parseLeadingGroups('{Continuité}{HP}Soit $f$ continue.');
  assert.deepStrictEqual(parsed.args, ['Continuité', 'HP']);
  assert.strictEqual(parsed.rest, 'Soit $f$ continue.');
});

test('extractTitledEnvironments extrait une notion complète', () => {
  const source = [
    '\\begin{theoreme}{Théorème de Rolle}',
    'Soit $f : [a,b] \\to \\R$.',
    '\\end{theoreme}'
  ].join('\n');
  const notions = extractTitledEnvironments(source, ['theoreme']);
  assert.strictEqual(notions.length, 1);
  assert.strictEqual(notions[0].title, 'Théorème de Rolle');
  assert.ok(notions[0].body.includes('$f : [a,b]'));
});

test('extractTitledEnvironments gère plusieurs notions du même environnement', () => {
  const source = [
    '\\begin{definition}{Ouvert}{}Un ouvert est…\\end{definition}',
    '\\begin{definition}{Fermé}{}Un fermé est…\\end{definition}'
  ].join('\n');
  const notions = extractTitledEnvironments(source, ['definition']);
  assert.strictEqual(notions.length, 2);
  assert.strictEqual(notions[0].title, 'Ouvert');
  assert.strictEqual(notions[1].title, 'Fermé');
});

test('extractAllNotions utilise les environnements du settings', () => {
  const source = '\\begin{lemme}{Lemme des berlins}{}Blabla\\end{lemme}';
  const settings = { environments: [{ name: 'lemme', display: 'Lemme' }] };
  const notions = extractAllNotions(source, settings);
  assert.strictEqual(notions.length, 1);
  assert.strictEqual(notions[0].environment, 'lemme');
});

test('discoverTitledEnvironments détecte les environnements à titre', () => {
  const source = [
    '\\begin{theoreme}{Pythagore}',
    ' Corps',
    '\\end{theoreme}',
    '\\begin{itemize}',
    '\\item x',
    '\\end{itemize}'
  ].join('\n');
  const found = discoverTitledEnvironments([source], {});
  assert.ok(found.includes('theoreme'));
  assert.ok(!found.includes('itemize'));
});

test('scanFolder parcourt récursivement et collecte notions et PDF', () => {
  const folder = makeTempFolder();
  const sub = path.join(folder, 'analyse');
  fs.mkdirSync(sub);
  fs.writeFileSync(path.join(folder, 'settings.tex'), [
    '\\newtheorem{theoreme}{Théorème}',
    '\\newcommand{\\R}{\\mathbb{R}}'
  ].join('\n'));
  fs.writeFileSync(path.join(folder, 'topologie.tex'), [
    '\\begin{theoreme}{Borel-Lebesgue}{}',
    'Tout recouvrement…',
    '\\end{theoreme}'
  ].join('\n'));
  fs.writeFileSync(path.join(sub, 'analyse.tex'), [
    '\\begin{theoreme}{Accroissements finis}{}',
    'Il existe $c$…',
    '\\end{theoreme}'
  ].join('\n'));
  fs.writeFileSync(path.join(folder, 'dummy.pdf'), '%PDF-1.4 dummy');

  const scan = scanFolder(folder);
  assert.strictEqual(scan.settings.found, true);
  assert.strictEqual(scan.courses.length, 2);
  const allNotions = scan.courses.reduce((acc, c) => acc + c.notions.length, 0);
  assert.strictEqual(allNotions, 2);
  assert.strictEqual(scan.pdfFiles.length, 1);

  fs.rmSync(folder, { recursive: true, force: true });
});

test('listFiles ignore les fichiers non .tex/.pdf', () => {
  const folder = makeTempFolder();
  fs.writeFileSync(path.join(folder, 'notes.txt'), 'x');
  fs.writeFileSync(path.join(folder, 'cours.tex'), 'x');
  const texFiles = listFiles(folder, ['.tex']);
  assert.strictEqual(texFiles.length, 1);
  fs.rmSync(folder, { recursive: true, force: true });
});

test('scanFolder sans settings.tex fonctionne quand même', () => {
  const folder = makeTempFolder();
  fs.writeFileSync(path.join(folder, 'cours.tex'), '\\begin{definition}{Test}{}Corps\\end{definition}');
  const scan = scanFolder(folder);
  assert.strictEqual(scan.settings.found, false);
  assert.strictEqual(scan.courses.length, 1);
  assert.strictEqual(scan.courses[0].notions.length, 1);
  fs.rmSync(folder, { recursive: true, force: true });
});

test('parseSettings ignore les commentaires % même en fin de ligne', () => {
  const settings = parseSettings([
    '\\newcommand{\\R}{\\mathbb{R}} % commentaire fin de ligne',
    'texte 50\% pas un commentaire',
    '% \\newcommand{\\fake}{x}',
    '\\newcommand{\\Q}{\\mathbb{Q}}'
  ].join('\n'));
  const names = settings.macros.map((m) => m.name);
  assert.ok(names.includes('\\R'));
  assert.ok(names.includes('\\Q'));
  assert.ok(!names.includes('\\fake'));
});

test('parseSettings gère \\def multi-lignes et macros numérotées', () => {
  const settings = parseSettings([
    '\\def\\Xint#1{\\mathchoice{\\XXint\\displaystyle\\textstyle{#1}}%',
    '{\\XXint\\textstyle\\scriptstyle{#1}}%',
    '{\\XXint\\scriptstyle\\scriptscriptstyle{#1}}%',
    '{\\XXint\\scriptscriptstyle\\scriptscriptstyle{#1}}%',
    '\\!\\int}',
    '\\def\\dashint{\\Xint-}',
    '\\newcommand{\\1}{\\mathbb{1}}'
  ].join('\n'));
  const xint = settings.macros.find((m) => m.name === '\\Xint');
  assert.ok(xint);
  assert.strictEqual(xint.args, 1);
  assert.ok(xint.body.includes('\\mathchoice'));
  const dashint = settings.macros.find((m) => m.name === '\\dashint');
  assert.ok(dashint);
  assert.strictEqual(dashint.body, '\\Xint-');
  assert.strictEqual(dashint.args, 0);
  const one = settings.macros.find((m) => m.name === '\\1');
  assert.ok(one);
  assert.strictEqual(one.body, '\\mathbb{1}');
});

test('parseSettings gère \\renewcommand sans accolades et DeclareMathOperator', () => {
  const settings = parseSettings([
    '\\renewcommand\\thesection{\\Roman{section}}',
    '\\DeclareMathOperator{\\inde}{\\perp \\!\\!\\! \\perp}'
  ].join('\n'));
  const thesection = settings.macros.find((m) => m.name === '\\thesection');
  assert.ok(thesection);
  assert.strictEqual(thesection.body, '\\Roman{section}');
  const inde = settings.macros.find((m) => m.name === '\\inde');
  assert.ok(inde);
  assert.ok(inde.body.includes('\\mathrm'));
});

test('parseSettings gère newtcbtheorem avec compteur partagé', () => {
  const settings = parseSettings([
    '\\newtcbtheorem[number within=section]{df}{Définition}{set1}{df}',
    '\\newtcbtheorem[use counter from=df]{dfprop}{Définition-Proposition}{set1}{dfprop}',
    '\\newtheorem{lemme}[compteur]{Lemme}'
  ].join('\n'));
  const envs = settings.environments.map((e) => e.name);
  assert.ok(envs.includes('df'));
  assert.ok(envs.includes('dfprop'));
  assert.ok(envs.includes('lemme'));
  assert.strictEqual(settings.environments.find((e) => e.name === 'df').display, 'Définition');
});

test('extractAllNotions sépare les preuves des notions', () => {
  const source = [
    '\\begin{df}{Vraie notion}{}',
    '\\[ x\\in\\R \\]',
    'avec \\begin{pmatrix}a\\\\b\\end{pmatrix} dedans.',
    '\\begin{array}{ll}a & b\\end{array}',
    '\\end{df}',
    '\\begin{proof}',
    'Démonstration.',
    '\\end{proof}'
  ].join('\n');
  const notions = extractAllNotions(source, { environments: [{ name: 'df', display: 'Définition' }] });
  assert.strictEqual(notions.length, 2);
  assert.strictEqual(notions[0].environment, 'df');
  assert.ok(notions[0].body.includes('pmatrix'));
  assert.ok(!notions[0].body.includes('Démonstration'));
  assert.strictEqual(notions[1].environment, 'proof');
});

test('extractTitledEnvironments gère les étoiles et titres absents', () => {
  const source = [
    '\\begin{qs*}{}{}',
    'Pourquoi ?',
    '\\end{qs*}',
    '\\begin{df}',
    'Corps commutatif.',
    '\\end{df}'
  ].join('\n');
  const notions = extractTitledEnvironments(source, ['qs*', 'df']);
  assert.strictEqual(notions.length, 2);
  assert.strictEqual(notions[0].environment, 'qs*');
  assert.strictEqual(notions[0].title, 'qs');
  assert.strictEqual(notions[1].environment, 'df');
  assert.strictEqual(notions[1].title, 'df');
  assert.ok(notions[1].body.includes('Corps'));
});

test('extractTitledEnvironments gère l’argument optionnel en titres', () => {
  const source = [
    '\\begin{df}[Définition (Solution)]',
    'Une solution de $(E)$ est une fonction dérivable.',
    '\\end{df}'
  ].join('\n');
  const notions = extractTitledEnvironments(source, ['df']);
  assert.strictEqual(notions.length, 1);
  assert.strictEqual(notions[0].title, 'Définition (Solution)');
  assert.ok(notions[0].body.startsWith('Une solution'));
});

test('stripComments préserve \\% et le texte', () => {
  const cleaned = require('../lib/latex-notions').stripComments(
    'A 50\\% et \\% suit\n% commentaire\nB'
  );
  assert.ok(cleaned.includes('50\\%'));
  assert.ok(cleaned.includes('B'));
  assert.ok(!cleaned.includes('commentaire'));
});

test('flattenNotions numérote les notions anonymes et couple les preuves', () => {
  const scan = {
    settings: { environments: [{ name: 'df', display: 'Définition' }, { name: 'tm', display: 'Théorème' }] },
    courses: [{
      name: 'topologie',
      path: '/tmp/topologie.tex',
      notions: [
        { environment: 'df', title: '', hasTitle: false, body: 'Corps.', position: 0 },
        { environment: 'proof', title: '', hasTitle: false, body: 'Preuve A.', position: 10 },
        { environment: 'df', title: 'Ouverts', hasTitle: true, body: 'Les ouverts.', position: 20 },
        { environment: 'proof', title: 'Ouverts', hasTitle: true, body: 'Preuve B.', position: 30 },
        { environment: 'df', title: '', hasTitle: false, body: 'Fermeture.', position: 40 }
      ]
    }]
  };
  const notions = flattenNotions(scan);
  assert.strictEqual(notions.length, 3);
  assert.strictEqual(notions[0].title, 'Définition 1');
  assert.strictEqual(notions[2].title, 'Définition 2');
  assert.strictEqual(notions[1].title, 'Ouverts');
  assert.strictEqual(notions[1].hasTitle, true);
  assert.strictEqual(notions[0].proofs.length, 1);
  assert.ok(notions[0].proofs[0].body.includes('Preuve A'));
  assert.strictEqual(notions[1].proofs.length, 1);
  assert.ok(notions[1].proofs[0].body.includes('Preuve B'));
  assert.strictEqual(notions[2].proofs.length, 0);
  assert.ok(notions.every((n) => !n.isProof));
  assert.ok(notions.every((n) => n.id));
});

test('flattenNotions fusionne les notions titrées de même nom et de même nature, même entre matières', () => {
  const scan = {
    settings: { environments: [
      { name: 'df', display: 'Définition' },
      { name: 'tm', display: 'Théorème' }
    ] },
    courses: [
      {
        name: 'analyse',
        path: '/tmp/analyse.tex',
        notions: [
          { environment: 'df', title: 'Connexité', hasTitle: true, body: 'V1.', position: 0 },
          { environment: 'df', title: 'Connexité', hasTitle: true, body: 'V1 bis.', position: 1 }
        ]
      },
      {
        name: 'topologie',
        path: '/tmp/topologie.tex',
        notions: [
          { environment: 'tm', title: 'Connexité', hasTitle: true, body: 'V2.', position: 0 }
        ]
      }
    ]
  };
  const notions = flattenNotions(scan);
  assert.strictEqual(notions.length, 3);
  const definitions = notions.filter((n) => n.environment === 'df');
  assert.strictEqual(definitions.length, 2);
  assert.strictEqual(definitions[0].id, definitions[1].id);
  assert.strictEqual(definitions[0].id, 'titled::df::Connexité');
  const theoreme = notions.find((n) => n.environment === 'tm');
  assert.ok(theoreme);
  assert.notStrictEqual(theoreme.id, definitions[0].id);
  assert.strictEqual(theoreme.id, 'titled::tm::Connexité');
});

test('scanFolder extrait les notions du settings réel de l’exemple', () => {
  const repoExample = path.join(__dirname, '..', 'exemple');
  if (!fs.existsSync(path.join(repoExample, 'settings.tex'))) {
    return;
  }
  const scan = scanFolder(repoExample);
  const macros = scan.settings.settings.macros;
  assert.ok(macros.length > 100);
  assert.ok(macros.some((m) => m.name === '\\1'));
  assert.ok(macros.some((m) => m.name === '\\Xint'));
  const envs = scan.settings.settings.environments.map((e) => e.name);
  for (const expected of ['df', 're', 'prop', 'tm', 'lm', 'ex', 'exo', 'cor', 'ra', 'nt', 'qs', 'dfprop']) {
    assert.ok(envs.includes(expected), `environnement manquant : ${expected}`);
  }
  const envCounts = {};
  for (const course of scan.courses) {
    for (const notion of course.notions) {
      envCounts[notion.environment] = (envCounts[notion.environment] || 0) + 1;
    }
  }
  assert.ok((envCounts.df || 0) > 200);
  assert.strictEqual(envCounts.array, undefined);
  assert.ok((envCounts.proof || 0) > 100);
  assert.strictEqual(envCounts.tabular, undefined);
  const notions = flattenNotions(scan);
  assert.ok(notions.length > 1000);
  assert.ok(notions.every((n) => n.id));
  assert.ok(notions.every((n) => typeof n.title === 'string' && n.title.length > 0));
  const proofCount = notions.reduce((acc, n) => acc + n.proofs.length, 0);
  assert.ok(proofCount > 100);
  assert.ok(notions.every((n) => !n.isProof));
});

test('isWatchedFile filtre les extensions utiles', () => {
  assert.strictEqual(isWatchedFile('cours/topologie.tex'), true);
  assert.strictEqual(isWatchedFile('cours/topologie.pdf'), true);
  assert.strictEqual(isWatchedFile('cours/settings.tex'), true);
  assert.strictEqual(isWatchedFile('cours/topologie.synctex.gz'), false);
  assert.strictEqual(isWatchedFile('cours/notes.txt'), false);
  assert.strictEqual(isWatchedFile('cours/.git/index'), false);
});

asyncTest('createFolderWatcher signale un .tex modifi\u00e9 (debounce)', async () => {
  const folder = makeTempFolder();
  const texPath = path.join(folder, 'cours.tex');
  fs.writeFileSync(texPath, '\\begin{df}{Test}\nCorps\\end{df}\n');

  const events = [];
  const watcher = createFolderWatcher({ debounceMs: 60, onChange: (paths) => events.push(paths) });
  assert.strictEqual(watcher.start(folder), true);

  await new Promise((r) => setTimeout(r, 50));
  fs.writeFileSync(texPath, '\\begin{df}{Test}\nCorps modifi\\u00e9\\end{df}\n');
  await new Promise((r) => setTimeout(r, 250));
  watcher.stop();

  assert.ok(events.length > 0, 'le watcher doit \u00e9mettre au moins un \u00e9v\u00e9nement');
  const all = events.flat();
  assert.ok(all.some((p) => p === path.resolve(texPath)));
  fs.rmSync(folder, { recursive: true, force: true });
});

asyncTest('createFolderWatcher ignore les fichiers non surveill\u00e9s', async () => {
  const folder = makeTempFolder();
  const txtPath = path.join(folder, 'notes.txt');
  fs.writeFileSync(txtPath, 'hello');

  const events = [];
  const watcher = createFolderWatcher({ debounceMs: 60, onChange: (paths) => events.push(paths) });
  assert.strictEqual(watcher.start(folder), true);

  await new Promise((r) => setTimeout(r, 50));
  fs.writeFileSync(txtPath, 'hello world');
  await new Promise((r) => setTimeout(r, 250));
  watcher.stop();

  const all = events.flat();
  assert.ok(!all.some((p) => p === path.resolve(txtPath)));
  fs.rmSync(folder, { recursive: true, force: true });
});

test('createFolderWatcher refuse un dossier inexistant', () => {
  const watcher = createFolderWatcher({});
  assert.strictEqual(watcher.start(path.join(os.tmpdir(), 'dossier-qui-n-existe-pas-xyz')), false);
  watcher.stop();
});

test('createLessonModel crée une leçon avec valeurs par défaut', () => {
  const lesson = createLessonModel();
  assert.strictEqual(lesson.title, 'Nouvelle leçon');
  assert.deepStrictEqual(lesson.notionIds, []);
  assert.ok(lesson.id.startsWith('lesson::'));
  assert.ok(lesson.createdAt);
  assert.ok(lesson.updatedAt);
});

test('createLessonModel normalise les entrées invalides', () => {
  const lesson = createLessonModel({ title: '   ', notionIds: ['a', 42, null, 'b'] });
  assert.strictEqual(lesson.title, 'Nouvelle leçon');
  assert.deepStrictEqual(lesson.notionIds, ['a', 'b']);
});

test('normalizeLessons filtre les entrées invalides et trie par updatedAt décroissant', () => {
  const lessons = normalizeLessons([
    null,
    'pas un objet',
    { title: 'Vieille', notionIds: ['x'], updatedAt: '2026-01-01T00:00:00Z' },
    { title: 'Récente', notionIds: ['y'], updatedAt: '2026-02-01T00:00:00Z' }
  ]);
  assert.strictEqual(lessons.length, 2);
  assert.strictEqual(lessons[0].title, 'Récente');
  assert.strictEqual(lessons[1].title, 'Vieille');
});

test('addNotionToLesson ajoute sans doublon, removeNotionFromLesson retire', () => {
  const lessons = [createLessonModel({ title: 'L1', notionIds: [] })];
  const id = lessons[0].id;
  assert.strictEqual(addNotionToLesson(lessons, id, 'n1'), true);
  assert.strictEqual(addNotionToLesson(lessons, id, 'n1'), true);
  assert.deepStrictEqual(lessons[0].notionIds, ['n1']);
  assert.strictEqual(addNotionToLesson(lessons, id, 'n2'), true);
  assert.deepStrictEqual(lessons[0].notionIds, ['n1', 'n2']);
  assert.strictEqual(removeNotionFromLesson(lessons, id, 'n1'), true);
  assert.deepStrictEqual(lessons[0].notionIds, ['n2']);
  assert.strictEqual(removeNotionFromLesson(lessons, 'id-inconnu', 'n2'), false);
});

test('moveNotionInLesson réordonne avec bornes', () => {
  const lessons = [createLessonModel({ title: 'L1', notionIds: ['a', 'b', 'c'] })];
  const id = lessons[0].id;
  assert.strictEqual(moveNotionInLesson(lessons, id, 'b', -1), true);
  assert.deepStrictEqual(lessons[0].notionIds, ['b', 'a', 'c']);
  assert.strictEqual(moveNotionInLesson(lessons, id, 'b', -1), true);
  assert.deepStrictEqual(lessons[0].notionIds, ['b', 'a', 'c']);
  assert.strictEqual(moveNotionInLesson(lessons, id, 'c', 1), true);
  assert.deepStrictEqual(lessons[0].notionIds, ['b', 'a', 'c']);
  assert.strictEqual(moveNotionInLesson(lessons, id, 'a', 1), true);
  assert.deepStrictEqual(lessons[0].notionIds, ['b', 'c', 'a']);
});

test('setLessonTitle ignore les titres vides et met à jour updatedAt', () => {
  const lessons = [createLessonModel({ title: 'Avant', updatedAt: '2026-01-01T00:00:00Z' })];
  const id = lessons[0].id;
  setLessonTitle(lessons, id, '   ');
  assert.strictEqual(lessons[0].title, 'Avant');
  setLessonTitle(lessons, id, 'Leçon 42 — Développement limité');
  assert.strictEqual(lessons[0].title, 'Leçon 42 — Développement limité');
  assert.notStrictEqual(lessons[0].updatedAt, '2026-01-01T00:00:00Z');
  assert.strictEqual(setLessonTitle(lessons, 'inconnu', 'X'), false);
});

test('resolveLessonNotions résout les notions fusionnées et signale les manquantes', () => {
  const lesson = createLessonModel({ title: 'L', notionIds: ['titled::df::Adhérence', 'titled::tm::Inconnu'] });
  const notions = [
    { id: 'titled::df::Adhérence', title: 'Adhérence', course: 'Topologie' },
    { id: 'titled::df::Adhérence', title: 'Adhérence', course: 'Analyse' },
    { id: 'titled::tm::Autre', title: 'Autre', course: 'Topologie' }
  ];
  const resolved = resolveLessonNotions(lesson, notions);
  assert.strictEqual(resolved.length, 2);
  assert.strictEqual(resolved[0].ok, true);
  assert.strictEqual(resolved[0].notions.length, 2);
  assert.strictEqual(resolved[1].ok, false);
  const stats = lessonStats(lesson, notions);
  assert.strictEqual(stats.total, 2);
  assert.strictEqual(stats.ok, 1);
  assert.strictEqual(stats.missing, 1);
});

test('upsertLesson met à jour ou ajoute, deleteLesson retire', () => {
  const lessons = [];
  const lesson = createLessonModel({ title: 'L1', notionIds: ['a'] });
  upsertLesson(lessons, lesson);
  assert.strictEqual(lessons.length, 1);
  lesson.title = 'L1 renommée';
  upsertLesson(lessons, lesson);
  assert.strictEqual(lessons.length, 1);
  assert.strictEqual(lessons[0].title, 'L1 renommée');
  assert.strictEqual(deleteLesson(lessons, lesson.id), true);
  assert.strictEqual(lessons.length, 0);
  assert.strictEqual(deleteLesson(lessons, lesson.id), false);
});

async function runAsyncTests() {
  for (const t of asyncTests) {
    try {
      await t.fn();
      passed++;
      console.log(`ok - ${t.name}`);
    } catch (err) {
      failed++;
      console.error(`FAIL - ${t.name}`);
      console.error(err.stack);
    }
  }
}

runAsyncTests().then(() => {
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
});
