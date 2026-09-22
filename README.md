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

### Rechargement automatique

Le dossier sélectionné est **surveillé en permanence** : dès qu'un `.tex` ou un `.pdf` est modifi, ajout ou supprimé, l'application se met à jour toute seule :

- la liste des cours et les notions sont re-scanées, **sans perdre votre contexte** (onglets de notions ouverts, notion active, filtres, recherche) ;
- si le PDF actuellement ouvert a changé sur le disque, il est **rechargé automatiquement sur la page où vous étiez** ;
- si un fichier ouvert a été supprimé, il est fermé proprement.

Le bouton « Actualiser » force un re-scan avec la même préservation de contexte.

## Interface

- **Thème sombre** façon VS Code / Zotero : barre d'icônes verticale à gauche (activity bar) pour basculer entre les sections, puis panneau latéral (liste du dossier) et zone de lecture.
- **Cours** : réservée aux **PDF uniquement** (les fichiers `.tex` non compilés n'y apparaissent pas ; ils servent uniquement à l'extraction des notions). Le lecteur est **pdf.js** (rendu canvas + couche texte alignée par l'algorithme officiel `renderTextLayer`, sélectionnable), embarqué dans l'app : navigation page par page, zoom (boutons, ajustement à la largeur et **Ctrl+molette** avec conservation de la page affichée), rendu virtuel, **liens cliquables** (internes : sommaires renvoient à la bonne page ; externes : ouverts dans le navigateur via le shell de l'OS) et **sommaire du document** (outline) interactif : panneau latéral toujours visible (si le PDF a un outline), entièrement déplié, avec suivi de lecture en temps réel (la section/chapitre courant est mise en évidence pendant le défilement). Les PDF sont lus via IPC (`app:read-pdf`) avec un contrôle que le fichier est bien dans le dossier sélectionné, et l'UI est chargée via `loadFile` (`file://`) et pdf.js tourne en worker intégré (aucune requête réseau).
- **Notions** : toutes les notions de tous les cours sont regroupées **en haut de la section** (grille de cartes paginée, sous la barre de recherche). Filtres **dans le panneau de la barre d'activité** (icône entonnoir en bas à gauche) : **Nommées / Anonymes**, **matière** et **taille d'affichage des notions** (curseur 70 %–140 %, défaut compact). Recherche plein texte (titre, environnement, matière) dans la barre du haut. Les notions sans titre reçoivent un nom générique numéroté (`Définition 1`, `Définition 2`…, selon l'environnement : `df` → Définition, `re` → Remarque, `ra` → Rappel, `dfprop` → Définition-Proposition, `prop` → Proposition, `tm` → Théorème, `not`/`nt` → Notation, `lm` → Lemme, `cor` → Corollaire, `ex` → Exemple, `exo` → Exercice). Les notions **nommées identiques** (même titre, toutes matières confondues) sont **fusionnées** : une seule carte dans la grille, plusieurs cases dans le même onglet à l'ouverture. Les **démonstrations** (`proof`/`proof*`/`demonstration`) ne s'affichent pas dans la liste : elles sont rattachées à la notion qu'elles suivent (ou à la notion de même nom) et apparaissent repliées sous la notion dans l'onglet ouvert. Chaque carte de la grille n'affiche que le **nom** de la notion, en **couleur selon sa nature** (code couleur par environnement : Définition bleu, Théorème orange, Lemme violet, Proposition rose, Exemple ocre, Exercice mauve, Notation vert d'eau, Remarque jaune pâle, Rappel bleu-gris…, info-bulle nature + matière) ; la **nature** (colorée) et la/les **matière(s)** sont affichées dans l'onglet ouvert. Chaque onglet affiche la notion compilée en LaTeX (KaTeX) avec les macros de `settings.tex`. Le bouton **Code source** déroule le code LaTeX brut de la notion ; le petit bouton **Copier** qui apparaît alors dans l'en-tête du bloc permet de le copier dans le presse-papiers. Le rendu est mis en cache (vues persistantes par notion) : les clics restent instantanés même avec ~1500 notions et des dizaines d'onglets ouverts.

## Architecture (pensée pour évoluer)

```
main.js                 Processus principal : fenêtre, IPC, préférences, chargement de l'UI (loadFile)
preload.js              Pont sécurisé contextIsolation (window.api)
lib/
  settings-parser.js     Lecture/parsing de settings.tex (macros, environnements) — Node pur, testable
  latex-notions.js       Découverte des notions, scan récursif du dossier — Node pur, testable
  notions-model.js       Nommage générique, couplage des démonstrations, fusion des notions de même nom — Node pur, testable
  folder-watcher.js      Surveillance du dossier de cours (rechargement automatique) — Node pur, testable
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

### Robustesse du parsing LaTeX

`lib/settings-parser.js` lit un vrai fichier LaTeX : commentaires `%` (y compris en fin de ligne, `\%` préservé), `\newcommand`/`\renewcommand` (accolées ou non, `[n]` arguments), `\def` multi-lignes avec `#1`, macros numérotées (`\1`), `\DeclareMathOperator` (converti en `\mathop{\mathrm{…}}\nolimits` pour KaTeX), `\newtheorem` (avec compteur partagé `[…]`), `\newtcbtheorem` (avec options), `\newenvironment`.

`lib/latex-notions.js` ignore les environnements non titrés (`array`, `proof`, `itemize`, `align*`, `tikzpicture`… via `NEVER_TITLED_ENVIRONMENTS`), gère les variantes étoilées (`qs*`), les titres absents, l'argument optionnel `\begin{df}[Titre]`, et nettoie les commentaires des cours avant extraction.

`renderer/app.js` adapte les macros pour KaTeX : fallback pour `\Xint`/`\dashint` (TeX primitives `\setbox`/`\mathchoice` non supportées), neutralisation de `\label`/`\notag`, fallbacks `\eqref`/`\ref`/`\qed`, et fallbacks génériques `\cho` (système d'équations), `\ssi` (« si et seulement si »), `\vvvert` (norme triple), `\mathring` (adhérence/intérieur topologique) utilisés dans les cours même si absents du `settings.tex`. L'extraction du mode math inline `$…$` est robuste : les `$` imbriqués dans les accolades (ex. `\cho{…\text{… $n$ …}…}`) ne coupent plus la formule. Le rendu des corps de notions gère `$$…$$`, `\[…\]`, `\begin{align*}…\end{align*}` (et `gather`, `equation`, `displaymath`), convertit les sauts `\\`, rend `itemize`/`enumerate` en listes HTML, `\textbf`/`\emph` en HTML, et affiche `tikzpicture`/`tabular`/`figure` en code brut.

## Empaquetage (plus tard)

`electron-builder` est déjà configuré (`npm run dist` pour un test de dossier, `npm run dist:installer` pour un installateur NSIS / AppImage / dmg).

## Sécurité

- `contextIsolation: true`, `nodeIntegration: false`, pont IPC minimal dans `preload.js`.
- CSP stricte dans `renderer/index.html` ; aucun accès réseau — l'application est 100 % hors-ligne.
- Le processus principal vérifie que les chemins demandés appartiennent bien au dossier sélectionné.
