'use strict';

const fs = require('fs');
const path = require('path');
const { readSettings, stripComments: stripTexComments } = require('./settings-parser');

const TEX_EXTENSIONS = ['.tex'];
const PDF_EXTENSIONS = ['.pdf'];

const DEFAULT_TITLED_ENVIRONMENTS = ['definition', 'theoreme', 'theoremebis'];

const NEVER_TITLED_ENVIRONMENTS = new Set([
  'array', 'matrix', 'matrix*', 'pmatrix', 'bmatrix', 'vmatrix', 'Vmatrix',
  'cases', 'dcases', 'rcases', 'smallmatrix', 'align', 'align*', 'aligned',
  'alignat', 'alignat*', 'gather', 'gather*', 'gathered', 'split', 'split*',
  'equation', 'equation*', 'eqnarray', 'eqnarray*', 'multline', 'multline*',
  'flalign', 'flalign*', 'subarray', 'tabular', 'tabular*', 'array*',
  'center', 'flushleft', 'flushright', 'itemize', 'enumerate', 'description',
  'proof', 'quote', 'quotation', 'verbatim', 'lstlisting', 'math', 'displaymath',
  'figure', 'figure*', 'table', 'table*', 'picture', 'scope', 'tikzpicture',
  'axis', 'document', 'abstract'
]);

function stripComments(source) {
  return stripTexComments(source);
}

function splitArguments(source) {
  const args = [];
  let depth = 0;
  let current = '';
  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (ch === '\\') {
      if (depth > 0) {
        current += source.slice(i, i + 2);
      }
      i++;
      continue;
    }
    if (ch === '{') {
      if (depth === 0) {
        current = '';
      } else {
        current += ch;
      }
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) {
        args.push(current);
      } else if (depth > 0) {
        current += ch;
      }
    } else if (depth > 0) {
      current += ch;
    }
  }
  return args;
}

function readBalancedGroup(source, startPos) {
  let pos = startPos;
  while (pos < source.length && /\s/.test(source[pos])) {
    pos++;
  }
  if (source[pos] !== '{') {
    return null;
  }
  let depth = 0;
  let current = '';
  for (let i = pos; i < source.length; i++) {
    const ch = source[i];
    if (ch === '\\') {
      if (depth > 0) {
        current += source.slice(i, i + 2);
      }
      i++;
      continue;
    }
    if (ch === '{') {
      depth++;
      if (depth > 1) {
        current += ch;
      }
    } else if (ch === '}') {
      depth--;
      if (depth === 0) {
        return { value: current, end: i + 1 };
      }
      current += ch;
    } else if (depth > 0) {
      current += ch;
    }
  }
  return null;
}

function readBracketOption(source, startPos) {
  let pos = startPos;
  while (pos < source.length && /\s/.test(source[pos])) {
    pos++;
  }
  if (source[pos] !== '[') {
    return null;
  }
  let depth = 0;
  for (let i = pos; i < source.length; i++) {
    const ch = source[i];
    if (ch === '\\') {
      i++;
      continue;
    }
    if (ch === '[' || ch === '{') {
      depth++;
    } else if (ch === ']' || ch === '}') {
      depth--;
      if (depth === 0 && ch === ']') {
        return { value: source.slice(pos + 1, i), end: i + 1 };
      }
    }
  }
  return null;
}

function parseLeadingGroups(inner) {
  const args = [];
  let pos = 0;
  while (pos < inner.length) {
    const group = readBalancedGroup(inner, pos);
    if (group) {
      args.push(group.value);
      pos = group.end;
      continue;
    }
    const bracket = readBracketOption(inner, pos);
    if (bracket) {
      args.push(bracket.value);
      pos = bracket.end;
      continue;
    }
    if (/\s/.test(inner[pos])) {
      pos++;
      continue;
    }
    break;
  }
  return { args, rest: inner.slice(pos) };
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findEnvironmentBlocks(source, envName) {
  const escaped = escapeRegExp(envName);
  const beginRe = new RegExp(`\\\\begin\\s*\\{\\s*${escaped}\\s*\\}`, 'g');
  const blocks = [];
  let match;
  while ((match = beginRe.exec(source)) !== null) {
    const endPattern = new RegExp(`\\\\end\\s*\\{\\s*${escaped}\\s*\\}`);
    const endMatch = endPattern.exec(source.slice(match.index + match[0].length));
    if (!endMatch) {
      continue;
    }
    const bodyStart = match.index + match[0].length;
    const bodyEnd = bodyStart + endMatch.index;
    blocks.push({
      index: match.index,
      inner: source.slice(bodyStart, bodyEnd)
    });
    beginRe.lastIndex = bodyStart + endMatch.index + endMatch[0].length;
  }
  return blocks;
}

function extractTitledEnvironments(source, envNames) {
  const notions = [];
  if (!source || !Array.isArray(envNames) || envNames.length === 0) {
    return notions;
  }
  for (const envName of envNames) {
    for (const block of findEnvironmentBlocks(source, envName)) {
      const parsed = parseLeadingGroups(block.inner);
      const title = (parsed.args[0] || '').trim();
      const notion = {
        environment: envName,
        title: title || envName.replace(/\*$/, ''),
        hasTitle: title.length > 0,
        body: parsed.rest.trim(),
        args: parsed.args,
        position: block.index
      };
      notions.push(notion);
    }
  }
  notions.sort((a, b) => a.position - b.position);
  notions.forEach((notion, i) => {
    notion.index = i;
  });
  return notions;
}

function discoverTitledEnvironments(sources, settings) {
  const found = new Set();
  const listed = new Set();
  const sourceList = Array.isArray(sources) ? sources : sources ? [sources] : [];
  for (const source of sourceList) {
    if (!source) {
      continue;
    }
    const pattern = /\\begin\s*\{\s*([A-Za-z@]+\*?)\s*\}([^\n]*)/g;
    let match;
    while ((match = pattern.exec(source)) !== null) {
      const rest = (match[2] || '').trim();
      if (!NEVER_TITLED_ENVIRONMENTS.has(match[1]) && (rest.startsWith('{') || rest.startsWith('['))) {
        found.add(match[1]);
      }
      listed.add(match[1]);
    }
  }
  if (settings && Array.isArray(settings.environments)) {
    for (const env of settings.environments) {
      if (listed.has(env.name)) {
        found.add(env.name);
      }
      if (listed.has(`${env.name}*`)) {
        found.add(`${env.name}*`);
      }
    }
  }
  return Array.from(found);
}

const PROOF_ENVIRONMENTS = new Set(['proof', 'proof*', 'demonstration']);

function extractAllNotions(source, settings) {
  let envNames;
  if (settings && Array.isArray(settings.environments) && settings.environments.length > 0) {
    envNames = settings.environments.map((env) => env.name);
  } else {
    envNames = DEFAULT_TITLED_ENVIRONMENTS.slice();
  }
  const discovered = discoverTitledEnvironments([source], settings);
  for (const env of discovered) {
    if (!envNames.includes(env)) {
      envNames.push(env);
    }
  }
  for (const proofEnv of PROOF_ENVIRONMENTS) {
    if (!envNames.includes(proofEnv)) {
      envNames.push(proofEnv);
    }
  }
  return extractTitledEnvironments(source, envNames);
}

function listFiles(folderPath, extensions, excludedDirs) {
  const results = [];
  if (!folderPath || !fs.existsSync(folderPath)) {
    return results;
  }
  const excluded = new Set(Array.isArray(excludedDirs) ? excludedDirs : []);
  let entries;
  try {
    entries = fs.readdirSync(folderPath, { withFileTypes: true });
  } catch (err) {
    return results;
  }
  for (const entry of entries) {
    const entryPath = path.join(folderPath, entry.name);
    if (entry.isDirectory()) {
      if (!excluded.has(entry.name)) {
        results.push(...listFiles(entryPath, extensions, excludedDirs));
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (extensions.includes(ext)) {
        results.push(entryPath);
      }
    }
  }
  return results;
}

function readTexFile(filePath) {
  return fs.readFileSync(filePath, 'utf-8');
}

const EXCLUDED_DIRS = ['lecons', 'developpements'];

function scanFolder(folderPath) {
  const settingsResult = readSettings(folderPath);
  const texFiles = listFiles(folderPath, TEX_EXTENSIONS, EXCLUDED_DIRS).filter(
    (filePath) => path.basename(filePath).toLowerCase() !== 'settings.tex'
  );
  const pdfFiles = listFiles(folderPath, PDF_EXTENSIONS, EXCLUDED_DIRS);
  const courses = texFiles.map((filePath) => {
    const content = readTexFile(filePath);
    const notions = extractAllNotions(stripComments(content), settingsResult.settings);
    return {
      path: filePath,
      name: path.basename(filePath, path.extname(filePath)),
      notions
    };
  });
  return {
    folder: folderPath,
    settings: settingsResult,
    courses,
    pdfFiles
  };
}

module.exports = {
  TEX_EXTENSIONS,
  PDF_EXTENSIONS,
  DEFAULT_TITLED_ENVIRONMENTS,
  NEVER_TITLED_ENVIRONMENTS,
  PROOF_ENVIRONMENTS,
  stripComments,
  splitArguments,
  parseLeadingGroups,
  extractTitledEnvironments,
  discoverTitledEnvironments,
  extractAllNotions,
  listFiles,
  readTexFile,
  scanFolder
};
