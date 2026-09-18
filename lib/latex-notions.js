'use strict';

const fs = require('fs');
const path = require('path');
const { readSettings } = require('./settings-parser');

const TEX_EXTENSIONS = ['.tex'];
const PDF_EXTENSIONS = ['.pdf'];

const DEFAULT_TITLED_ENVIRONMENTS = ['definition', 'theoreme', 'theoremebis'];

function stripComments(source) {
  return source
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith('%'))
    .join('\n');
}

function splitArguments(source) {
  const args = [];
  let depth = 0;
  let current = '';
  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
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

function parseLeadingGroups(inner) {
  const args = [];
  let pos = 0;
  while (pos < inner.length) {
    const ch = inner[pos];
    if (ch === '{') {
      let depth = 0;
      let current = '';
      let end = pos;
      for (let i = pos; i < inner.length; i++) {
        const c = inner[i];
        if (c === '{') {
          depth++;
          if (depth > 1) {
            current += c;
          }
        } else if (c === '}') {
          depth--;
          if (depth === 0) {
            end = i;
            break;
          }
          current += c;
        } else if (depth > 0) {
          current += c;
        }
      }
      args.push(current);
      pos = end + 1;
    } else if (/\s/.test(ch)) {
      pos++;
    } else {
      break;
    }
  }
  return { args, rest: inner.slice(pos) };
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractTitledEnvironments(source, envNames) {
  const notions = [];
  if (!source || !Array.isArray(envNames) || envNames.length === 0) {
    return notions;
  }
  for (const envName of envNames) {
    const escaped = escapeRegExp(envName);
    const pattern = new RegExp(
      `\\\\begin\\{\\s*${escaped}\\s*\\}([\\s\\S]*?)\\\\end\\{\\s*${escaped}\\s*}`,
      'g'
    );
    let match;
    while ((match = pattern.exec(source)) !== null) {
      const inner = match[1];
      const parsed = parseLeadingGroups(inner);
      const title = (parsed.args[0] || '').trim();
      notions.push({
        environment: envName,
        title: title || envName,
        body: parsed.rest.trim(),
        args: parsed.args,
        position: match.index
      });
    }
  }
  notions.sort((a, b) => a.position - b.position);
  notions.forEach((notion, i) => {
    notion.index = i;
    delete notion.position;
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
    const pattern = /\\begin\{\s*([A-Za-z@]+\*?)\s*\}([^\\\n]*)/g;
    let match;
    while ((match = pattern.exec(source)) !== null) {
      const rest = (match[2] || '').trim();
      if (rest.startsWith('{')) {
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
    }
  }
  return Array.from(found);
}

function extractAllNotions(source, settings) {
  let envNames;
  if (settings && Array.isArray(settings.environments) && settings.environments.length > 0) {
    envNames = settings.environments.map((env) => env.name);
  } else {
    envNames = DEFAULT_TITLED_ENVIRONMENTS;
  }
  const discovered = discoverTitledEnvironments([source], settings);
  for (const env of discovered) {
    if (!envNames.includes(env)) {
      envNames.push(env);
    }
  }
  return extractTitledEnvironments(source, envNames);
}

function listFiles(folderPath, extensions) {
  const results = [];
  if (!folderPath || !fs.existsSync(folderPath)) {
    return results;
  }
  let entries;
  try {
    entries = fs.readdirSync(folderPath, { withFileTypes: true });
  } catch (err) {
    return results;
  }
  for (const entry of entries) {
    const entryPath = path.join(folderPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...listFiles(entryPath, extensions));
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

function scanFolder(folderPath) {
  const settingsResult = readSettings(folderPath);
  const texFiles = listFiles(folderPath, TEX_EXTENSIONS).filter(
    (filePath) => path.basename(filePath).toLowerCase() !== 'settings.tex'
  );
  const pdfFiles = listFiles(folderPath, PDF_EXTENSIONS);
  const courses = texFiles.map((filePath) => {
    const content = readTexFile(filePath);
    const notions = extractAllNotions(content, settingsResult.settings);
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
