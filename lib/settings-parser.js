'use strict';

const fs = require('fs');
const path = require('path');

const SETTINGS_FILENAME = 'settings.tex';

function parseSettings(content) {
  const settings = {
    macros: [],
    environments: [],
    preamble: []
  };
  if (!content || typeof content !== 'string') {
    return settings;
  }
  const lines = content.split(/\r?\n/);
  for (let rawLine of lines) {
    const line = rawLine.trim();
    settings.preamble.push(rawLine);
    if (!line || line.startsWith('%')) {
      continue;
    }
    const newcommand = line.match(
      /^\\(?:re)?newcommand\*?\s*\{?\s*(\\[A-Za-z@]+)\s*\}?\s*(?:\[\s*(\d+)\s*\])?\s*\{([\s\S]*)\}\s*;?\s*$/
    );
    if (newcommand) {
      settings.macros.push({
        name: newcommand[1],
        args: newcommand[2] ? parseInt(newcommand[2], 10) : 0,
        body: newcommand[3] || ''
      });
      continue;
    }
    const declareOperator = line.match(
      /^\\DeclareMathOperator\*?\s*\{\s*(\\[A-Za-z@]+)\s*\}\s*\{([\s\S]*)\}/
    );
    if (declareOperator) {
      settings.macros.push({
        name: declareOperator[1],
        args: 0,
        body: declareOperator[2] || ''
    });
      continue;
    }
    const defMacro = line.match(
      /^\\def\s*(\\[A-Za-z@]+)#?\d?\s*\{([\s\S]*)\}$/
    );
    if (defMacro) {
      settings.macros.push({
        name: defMacro[1],
        args: 0,
        body: defMacro[2]
      });
      continue;
    }
    const newtheorem = line.match(
      /^\\(?:newtheorem|renewtheorem)\s*\{\s*([^}]+)\s*\}\s*\{\s*([^}]+)\s*\}/
    );
    if (newtheorem) {
      settings.environments.push({
        name: newtheorem[1].trim(),
        display: newtheorem[2].trim()
      });
      continue;
    }
    const tcbtheorem = line.match(
      /^\\newtcbtheorem(?:\[\s*[^\]]*\s*\])?\s*\{\s*([^}]+)\s*\}\s*\{\s*([^}]+)\s*\}/
    );
    if (tcbtheorem) {
      settings.environments.push({
        name: tcbtheorem[1].trim(),
        display: tcbtheorem[2].trim()
      });
      continue;
    }
    const customEnv = line.match(/^\\(?:new|renew)environment\*?\s*\{\s*([^}]+)\s*\}/);
    if (customEnv) {
      settings.environments.push({
        name: customEnv[1].trim(),
        display: customEnv[1].trim()
      });
    }
  }
  return settings;
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
  findSettingsFile,
  readSettings
};
