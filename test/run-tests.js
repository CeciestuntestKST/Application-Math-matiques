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

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
