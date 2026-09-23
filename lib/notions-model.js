'use strict';

const GENERIC_ENV_LABELS = {
  df: 'Définition',
  re: 'Remarque',
  ra: 'Rappel',
  dfprop: 'Définition-Proposition',
  prop: 'Proposition',
  tm: 'Théorème',
  not: 'Notation',
  nt: 'Notation',
  lm: 'Lemme',
  cor: 'Corollaire',
  ex: 'Exemple',
  exo: 'Exercice',
  qs: 'Question',
  proof: 'Démonstration'
};

const PROOF_ENVIRONMENTS = new Set(['proof', 'proof*', 'demonstration']);

function isProofEnvironment(environment) {
  return PROOF_ENVIRONMENTS.has(environment);
}

function buildDisplayMap(settings) {
  const displayMap = {};
  if (settings && Array.isArray(settings.environments)) {
    for (const env of settings.environments) {
      displayMap[env.name] = env.display;
    }
  }
  return displayMap;
}

function environmentDisplay(environment, displayMap) {
  return displayMap[environment] || GENERIC_ENV_LABELS[environment] || environment;
}

function flattenNotions(scan) {
  const displayMap = buildDisplayMap(scan.settings);
  const envCounters = {};
  const courses = Array.isArray(scan.courses) ? scan.courses : [];
  const notions = [];
  const proofQueue = [];

  for (const course of courses) {
    const courseNotions = Array.isArray(course.notions) ? course.notions : [];
    let lastNotion = null;
    courseNotions.forEach((raw) => {
      const isProof = isProofEnvironment(raw.environment);
      const entry = {
        ...raw,
        environmentDisplay: environmentDisplay(raw.environment, displayMap),
        course: course.name,
        coursePath: course.path,
        isProof,
        proofs: []
      };
      if (isProof) {
        proofQueue.push({ entry, after: lastNotion, course: course.name });
        lastNotion = null;
        return;
      }
      if (raw.hasTitle) {
        entry.id = `titled::${raw.environment}::${raw.title}`;
      } else {
        const key = `${course.name}::${raw.environment}`;
        envCounters[key] = (envCounters[key] || 0) + 1;
        entry.title = `${entry.environmentDisplay} ${envCounters[key]}`;
        entry.id = `${key}::${entry.title}`;
      }
      lastNotion = entry;
      notions.push(entry);
    });
  }

  for (const { entry, after, course } of proofQueue) {
    let target = after;
    if (entry.hasTitle) {
      target = notions.find(
        (n) => n.course === course && n.hasTitle && n.title === entry.title
      ) || target;
    }
    if (!target) {
      target = notions.find(
        (n) => n.course === course && !n.hasTitle && n.proofs.length === 0
      ) || null;
    }
    if (target) {
      target.proofs.push(entry);
    }
  }

  return notions;
}

module.exports = {
  GENERIC_ENV_LABELS,
  PROOF_ENVIRONMENTS,
  isProofEnvironment,
  flattenNotions,
  environmentDisplay
};
