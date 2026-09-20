'use strict';

const fs = require('fs');
const path = require('path');

const SETTINGS_FILENAME = 'settings.tex';

const MACRO_NAME_RE = /[\\][A-Za-z@]+|[\\][0-9]/;

function stripComments(source) {
  if (typeof source !== 'string') {
    return '';
  }
  let out = '';
  let i = 0;
  while (i < source.length) {
    const ch = source[i];
    if (ch === '\\') {
      out += source.slice(i, i + 2);
      i += 2;
      continue;
    }
    if (ch === '%') {
      while (i < source.length && source[i] !== '\n') {
        i++;
      }
      if (source[i] === '\n') {
        out += '\n';
        i++;
      }
      continue;
    }
    out += ch;
    i++;
  }
  return out;
}

function readGroup(content, startPos) {
  let pos = startPos;
  while (pos < content.length && /\s/.test(content[pos])) {
    pos++;
  }
  if (content[pos] !== '{') {
    return null;
  }
  let depth = 0;
  let i = pos;
  let body = '';
  while (i < content.length) {
    const ch = content[i];
    if (ch === '\\') {
      if (depth > 0) {
        body += content.slice(i, i + 2);
      }
      i += 2;
      continue;
    }
    if (ch === '{') {
      depth++;
      if (depth > 1) {
        body += ch;
      }
    } else if (ch === '}') {
      depth--;
      if (depth === 0) {
        return { value: body, end: i + 1 };
      }
      body += ch;
    } else if (depth > 0) {
      body += ch;
    }
    i++;
  }
  return null;
}

function readBracketOption(content, startPos) {
  let pos = startPos;
  while (pos < content.length && /\s/.test(content[pos])) {
    pos++;
  }
  if (content[pos] !== '[') {
    return null;
  }
  let depth = 0;
  for (let i = pos; i < content.length; i++) {
    const ch = content[i];
    if (ch === '\\') {
      i++;
      continue;
    }
    if (ch === '[' || ch === '{') {
      depth++;
    } else if (ch === ']' || ch === '}') {
      depth--;
      if (depth === 0 && ch === ']') {
        return { value: content.slice(pos + 1, i), end: i + 1 };
      }
    }
  }
  return null;
}

function normalizeMacroBody(body) {
  return typeof body === 'string' ? body.replace(/\s+/g, ' ').trim() : '';
}

function pushMacro(settings, macro) {
  if (!macro || !macro.name || typeof macro.body !== 'string') {
    return;
  }
  settings.macros.push(macro);
}

function parseSettings(content) {
  const settings = {
    macros: [],
    environments: [],
    preamble: []
  };
  if (!content || typeof content !== 'string') {
    return settings;
  }
  settings.preamble.push(...content.split(/\r?\n/));
  const cleaned = stripComments(content);

  const newcommandRe = /\\(?:re)?newcommand\*?\s*/g;
  let match;
  while ((match = newcommandRe.exec(cleaned)) !== null) {
    const name = readMacroName(cleaned, match.index + match[0].length);
    if (!name) {
      continue;
    }
    let pos = name.end;
    let args = 0;
    const bracket = readBracketOption(cleaned, pos);
    if (bracket) {
      const argCount = parseInt(bracket.value.trim(), 10);
      if (!Number.isNaN(argCount)) {
        args = argCount;
      }
      pos = bracket.end;
    }
    const body = readGroup(cleaned, pos);
    if (!body) {
      continue;
    }
    pushMacro(settings, {
      name: name.value,
      args,
      body: normalizeMacroBody(body.value)
    });
    newcommandRe.lastIndex = body.end;
  }

  const declareOperatorRe = /\\DeclareMathOperator\*?\s*/g;
  while ((match = declareOperatorRe.exec(cleaned)) !== null) {
    const name = readMacroName(cleaned, match.index + match[0].length);
    if (!name) {
      continue;
    }
    const body = readGroup(cleaned, name.end);
    if (!body) {
      continue;
    }
    pushMacro(settings, {
      name: name.value,
      args: 0,
      body: `\\mathop{\\mathrm{${normalizeMacroBody(body.value)}}}\\nolimits`
    });
    declareOperatorRe.lastIndex = body.end;
  }

  const defRe = /\\def\s*/g;
  while ((match = defRe.exec(cleaned)) !== null) {
    const name = readMacroName(cleaned, match.index + match[0].length);
    if (!name) {
      continue;
    }
    let pos = name.end;
    let args = 0;
    while (pos < cleaned.length && cleaned[pos] === '#') {
      const digit = cleaned[pos + 1];
      if (/[0-9]/.test(digit)) {
        args++;
        pos += 2;
      } else {
        break;
      }
    }
    const body = readGroup(cleaned, pos);
    if (!body) {
      continue;
    }
    pushMacro(settings, {
      name: name.value,
      args,
      body: body.value.trim()
    });
    defRe.lastIndex = body.end;
  }

  const newtheoremRe = /\\(?:newtheorem|renewtheorem)\*?\s*/g;
  while ((match = newtheoremRe.exec(cleaned)) !== null) {
    const nameGroup = readGroup(cleaned, match.index + match[0].length);
    if (!nameGroup) {
      continue;
    }
    let pos = nameGroup.end;
    const sharedCounter = readBracketOption(cleaned, pos);
    if (sharedCounter) {
      pos = sharedCounter.end;
    }
    const displayGroup = readGroup(cleaned, pos);
    if (!displayGroup) {
      continue;
    }
    pushEnvironment(settings, {
      name: nameGroup.value.trim(),
      display: displayGroup.value.trim()
    });
    newtheoremRe.lastIndex = displayGroup.end;
  }

  const tcbtheoremRe = /\\newtcbtheorem\s*/g;
  while ((match = tcbtheoremRe.exec(cleaned)) !== null) {
    let pos = match.index + match[0].length;
    const option = readBracketOption(cleaned, pos);
    if (option) {
      pos = option.end;
    }
    const nameGroup = readGroup(cleaned, pos);
    if (!nameGroup) {
      continue;
    }
    const displayGroup = readGroup(cleaned, nameGroup.end);
    if (!displayGroup) {
      continue;
    }
    pushEnvironment(settings, {
      name: nameGroup.value.trim(),
      display: displayGroup.value.trim()
    });
    tcbtheoremRe.lastIndex = displayGroup.end;
  }

  const newenvironmentRe = /\\(?:new|renew)environment\*?\s*/g;
  while ((match = newenvironmentRe.exec(cleaned)) !== null) {
    const nameGroup = readGroup(cleaned, match.index + match[0].length);
    if (!nameGroup) {
      continue;
    }
    pushEnvironment(settings, {
      name: nameGroup.value.trim(),
      display: nameGroup.value.trim()
    });
    const secondGroup = readGroup(cleaned, nameGroup.end);
    if (secondGroup) {
      newenvironmentRe.lastIndex = secondGroup.end;
    }
  }

  return settings;
}

function readMacroName(content, startPos) {
  let pos = startPos;
  while (pos < content.length && /\s/.test(content[pos])) {
    pos++;
  }
  const m = content.slice(pos).match(new RegExp(`^(${MACRO_NAME_RE.source})`));
  if (m) {
    return { value: m[1], end: pos + m[1].length };
  }
  const group = readGroup(content, pos);
  if (!group) {
    return null;
  }
  const inner = group.value.trim().match(new RegExp(`^(${MACRO_NAME_RE.source})$`));
  if (!inner) {
    return null;
  }
  return { value: inner[1], end: group.end };
}

function pushEnvironment(settings, env) {
  if (!env || !env.name) {
    return;
  }
  if (settings.environments.some((e) => e.name === env.name)) {
    return;
  }
  settings.environments.push(env);
}

function findSettingsFile(folderPath) {
  if (!folderPath) {
    return null;
  }
  const candidates = ['settings.tex', 'Settings.tex', 'SETTINGS.tex'];
  for (const candidate of candidates) {
    const candidatePath = path.join(folderPath, candidate);
    if (fs.existsSync(candidatePath) && fs.statSync(candidatePath).isFile()) {
      return candidatePath;
    }
  }
  return null;
}

function readSettings(folderPath) {
  const settingsPath = findSettingsFile(folderPath);
  if (!settingsPath) {
    return {
      found: false,
      path: null,
      settings: parseSettings('')
    };
  }
  const content = fs.readFileSync(settingsPath, 'utf-8');
  return {
    found: true,
    path: settingsPath,
    settings: parseSettings(content)
  };
}

module.exports = {
  SETTINGS_FILENAME,
  parseSettings,
  stripComments,
  findSettingsFile,
  readSettings
};
