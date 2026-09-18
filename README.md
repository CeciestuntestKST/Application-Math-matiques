# Application Mathématiques

Application PC **hors-ligne** (Electron) pour la lecture de cours et de notions mathématiques, dans le cadre de la préparation à l'agrégation externe de Mathématiques. Charte graphique inspirée de Zotero.

## Démarrage rapide

```bash
npm install      # installe les modules et copie les assets KaTeX / pdf.js dans vendor/
npm start        # lance l'application
# ou
npm run dev      # lance l'application avec les DevTools ouverts
npm test         # tests unitaires de la logique LaTeX (Node, sans Electron)
```

## Organisation du dossier de cours

L'utilisateur sélectionne un dossier via « Ouvrir un dossier » (mémorisé d'une session à l'autre). Le dossier peut contenir, **dans des sous-dossiers** (parcours récursif) :

| Fichier | Rôle |
|---|---|
| `settings.tex` | Préréglages LaTeX partagés : macros `\newcommand`, environnements `\newtheorem` / `\newenvironment`. Sert à reconnaître les « notions » et à injecter vos macros dans le rendu. |
| `*.tex` | Cours LaTeX. Les notions sont détectées via `\begin{Nom}{Titre}{} ... \end{Nom}`. Les `.tex` ne s'affichent pas dans la section Cours (réservée aux PDF) mais alimentent la section Notions. |
| `*.pdf` | Cours en PDF, lisibles dans la section **Cours**. |

Voir le dossier [`exemple/`](exemple/) pour un modèle fonctionnel.

> Ajoutez simplement le PDF compilé correspondant à un `.tex` pour le lire dans la section Cours.

## Interface

- **Thème sombre** façon VS Code / Zotero : barre d'icônes verticale à gauche (activity bar) pour basculer entre les sections, puis panneau latéral (liste du dossier) et zone de lecture.
- **Cours** : réservée aux **PDF uniquement** (les fichiers `.tex` non compilés n'y apparaissent pas ; ils servent uniquement à l'extraction des notions). Le lecteur est le **viewer PDF natif de Chromium** embarqué dans Electron : sélection/copie de texte native, zoom, sommaire, recherche dans le document, rotation, impression… Servi via un protocole interne sécurisé (`pdfview:`) qui n'autorise que les fichiers du dossier sélectionné.
- **Notions** : un **répertoire** de toutes les notions de tous les cours (groupées par cours, filtrables par recherche). Les notions ne s'affichent plus toutes en même temps : on clique sur une notion pour l'ouvrir, plusieurs peuvent être ouvertes simultanément (une par onglet, fermables par ×), chaque onglet affiche la notion compilée en LaTeX (KaTeX) avec les macros de `settings.tex`, un bouton **Copier le code LaTeX** et une bascule **Code source**.

## Architecture (pensée pour évoluer)

```
main.js                 Processus principal : fenêtre, IPC, préférences, protocole pdfview: (PDF natif)
preload.js              Pont sécurisé contextIsolation (window.api)
lib/
  settings-parser.js     Lecture/parsing de settings.tex (macros, environnements) — Node pur, testable
  latex-notions.js       Découverte des notions, scan récursif du dossier — Node pur, testable
renderer/
  index.html             UI (CSP stricte)
  styles.css             Charte Zotero-like (variables CSS, sidebar, toolbars, cartes de notions)
  app.js                 Logique UI : sections, lecteur PDF (pdf.js), rendu LaTeX (KaTeX)
vendor/                  Assets copiés depuis node_modules (KaTeX, pdf.js) — régénéré par postinstall
scripts/copy-vendor.js  Copie des assets vendor après npm install
test/run-tests.js        Tests unitaires (npm test)
exemple/                 Dossier de cours d'exemple (settings.tex + topologie.tex)
```

Points d'extension prévus :
- nouvelles sections : ajouter un `<button class="section" data-section="…">` dans `renderer/index.html` et un bloc correspondant dans `renderer/app.js` ;
- nouveau canal IPC : ajouter le `handle` dans `main.js` et l'exposer dans `preload.js` ;
- nouvelle règle de détection des notions : tout est centralisé dans `lib/latex-notions.js` (fonctions `extractTitledEnvironments`, `discoverTitledEnvironments`, `extractAllNotions`).

## Empaquetage (plus tard)

`electron-builder` est déjà configuré (`npm run dist` pour un test de dossier, `npm run dist:installer` pour un installateur NSIS / AppImage / dmg).

## Sécurité

- `contextIsolation: true`, `nodeIntegration: false`, pont IPC minimal dans `preload.js`.
- CSP stricte dans `renderer/index.html` ; aucun accès réseau — l'application est 100 % hors-ligne.
- Le processus principal vérifie que les chemins demandés appartiennent bien au dossier sélectionné.
