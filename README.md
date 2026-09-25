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
| `settings.tex` | **À la racine du dossier sélectionné** (cherché aussi sous les noms `Settings.tex` / `SETTINGS.tex`). Préréglages LaTeX partagés : macros `\newcommand`, environnements `\newtheorem` / `\newenvironment`. Sert à reconnaître les « notions » et à injecter vos macros dans le rendu. Sans lui, l'app se rabat sur les environnements `definition`/`theoreme`/`theoremebis` et ceux détectés automatiquement. |
| `lecons/*.tex` | Plans de leçons d'oral créés dans l'app (section dédiée) : plan en LaTeX + métadonnées (numéro, titre) en en-tête. Plusieurs plans peuvent partager le même numéro. Exclu du scan des notions. |
| `oral/lessons.json` | Registre des leçons officielles de l'oral (numéro unique + titre), créé et maintenu par la section **Oral**. |
| `developpements/*.tex` | Développements créés dans l'app (section dédiée) : LaTeX + métadonnées (titre, leçons compatibles) en en-tête. Exclu du scan des notions. |
| `*.tex` | Cours LaTeX. Les notions sont détectées via `\begin{Nom}{Titre}{} ... \end{Nom}`. Les `.tex` ne s'affichent pas dans la section Cours (réservée aux PDF) mais alimentent la section Notions. |
| `*.pdf` | Cours en PDF, lisibles dans la section **Cours**. |

Voir le dossier [`exemple/`](exemple/) pour un modèle fonctionnel.

> Ajoutez simplement le PDF compilé correspondant à un `.tex` pour le lire dans la section Cours.

### Rechargement automatique

Le dossier sélectionné est **surveillé en permanence** : dès qu'un `.tex` ou un `.pdf` est modifié, ajout ou supprimé, l'application se met à jour toute seule :

- la liste des cours et les notions sont re-scanées, **sans perdre votre contexte** (onglets de notions ouverts, notion active, filtres, recherche) ;
- si le PDF actuellement ouvert a changé sur le disque, il est **rechargé automatiquement sur la page où vous étiez** ;
- si un fichier ouvert a été supprimé, il est fermé proprement.

Le bouton « Actualiser » force un re-scan avec la même préservation de contexte.

## Interface

- **Thème sombre** façon VS Code / Zotero : barre d'icônes verticale à gauche (activity bar) pour basculer entre les sections, puis panneau latéral (liste du dossier) et zone de lecture.
- **Cours** : réservée aux **PDF uniquement** (les fichiers `.tex` non compilés n'y apparaissent pas ; ils servent uniquement à l'extraction des notions). Le lecteur est **pdf.js** (rendu canvas + couche texte alignée par l'algorithme officiel `renderTextLayer`, sélectionnable), embarqué dans l'app : navigation page par page, zoom (boutons, ajustement à la largeur et **Ctrl+molette** avec conservation de la page affichée), rendu virtuel, **liens cliquables** (internes : sommaires renvoient à la bonne page ; externes : ouverts dans le navigateur via le shell de l'OS) et **sommaire du document** (outline) interactif : panneau latéral toujours visible (si le PDF a un outline), entièrement déplié, avec suivi de lecture en temps réel (la section/chapitre courant est mise en évidence pendant le défilement), et **recherche texte** dans le PDF : champ dans la toolbar, insensible à la casse et aux accents, toutes les occurrences surlignées (les autres en orange, la courante en jaune), navigation avec ▲▼ ou Entrée / Maj+Entrée, compteur « n / total », Échap ou × pour effacer. Les PDF sont lus via IPC (`app:read-pdf`) avec un contrôle que le fichier est bien dans le dossier sélectionné, et l'UI est chargée via `loadFile` (`file://`) et pdf.js tourne en worker intégré (aucune requête réseau).
- **Oral** : répertoire des numéros de leçon de l'oral. Chaque numéro déclaré (« + Ajouter une leçon » : numéro + titre officiel) est affiché en carte avec le **nombre de plans rédigés** et le **nombre de développements associés** ; les numéros utilisés par des plans ou des développements y apparaissent automatiquement. Un clic sur un numéro ouvre la vue dédiée : **plans rédigés à gauche** (clic = édition dans la section Leçons d'oral, « + Plan » crée un nouveau plan pour ce numéro), **développements potentiels à droite** (clic = édition dans la section Développements). Le titre officiel est modifiable ; « Retirer » retire le numéro du registre sans toucher aux plans ni aux développements. Le registre est stocké dans `oral/lessons.json`.
- **Leçons d'oral** : rédigez vos plans de leçons d'oral en LaTeX, directement dans l'app. L'accueil de la section liste vos plans en cartes (numéro, titre, date de modification) ; **« + Créer une leçon »** ouvre un formulaire à **numéro seul** (plusieurs plans peuvent exister pour un même numéro ; le plan reçoit un titre « Plan N », modifiable ensuite). L'éditeur offre deux modes : **aperçu rendu** (défaut) — le plan est décomposé en blocs type notions (théorèmes, définitions…) rendus par KaTeX avec **démonstrations pliables/dépliables** — et **code source** pour éditer le LaTeX libre (sauvegardé automatiquement dans un petit fichier `.tex` créé dans le sous-dossier `lecons/` du dossier de cours). Un **panneau latéral « Bibliothèque de notions »** avec recherche — un clic sur une notion **insère son code LaTeX** à l'emplacement du curseur dans la leçon (bascule automatique en mode code). Chaque leçon est donc un vrai fichier `.tex` (numéro et titre stockés en en-tête sous forme de commentaire `% lesson-meta:`), éditable aussi hors de l'app ; le dossier `lecons/` est exclu du scan des notions et du rechargement automatique. Le titre et le numéro sont modifiables (le fichier est renommé automatiquement), et « Supprimer » efface le fichier avec confirmation.
- **Développements** : section dédiée aux développements potentiels pour l'oral, affichée **plein écran comme les autres sections**. Accueil en cartes (titre, leçons concernées, date), **« + Créer un développement »** → formulaire de titre. L'éditeur offre deux modes : **aperçu rendu** (défaut) — le contenu est décomposé en blocs type notions (théorèmes, exercices, énoncés…) rendus par KaTeX avec **démonstrations pliables/dépliables** comme dans la section Notions — et **code source** pour éditer le LaTeX libre. Autosauvegarde dans un petit fichier `.tex` du sous-dossier `developpements/` du dossier de cours. Le panneau latéral réunit : **« Leçons compatibles »** — champ libre de **numéros de leçons** (ex. `12, 142, 158`) et cases à cocher de vos leçons d'oral (le lien survit au renommage grâce à un identifiant stable) — et **« Bibliothèque de notions »** avec recherche et insertion du LaTeX au clic. Métadonnées `% dev-meta:` (titre, leçons) en en-tête ; dossier exclu du scan des notions et du watcher.
- **Notions** : toutes les notions de tous les cours sont regroupées **en haut de la section** (grille de cartes paginée par lots de 200, sous la barre de recherche ; un séparateur horizontal déplaçable redimensionne le bloc, double-clic pour réinitialiser). Filtres dans **la barre latérale de la section Notions** : **Type de Notions** (cases à cocher par nature, tout sélectionner/désélectionner via l'en-tête), **Nom** (Toutes / Nommées / Anonymes) et **Matières** (cases à cocher par cours). Recherche plein texte dans la barre du haut : titre, nature, matière et **corps de la notion, démonstrations incluses**, avec priorité aux titres concordants (tri par pertinence : titre, puis nature, puis matière, puis corps ; les cartes à titre concordant sont encadrées). Les notions sans titre reçoivent un nom générique numéroté (`Définition 1`, `Définition 2`…, selon l'environnement : `df` → Définition, `re` → Remarque, `ra` → Rappel, `dfprop` → Définition-Proposition, `prop` → Proposition, `tm` → Théorème, `not`/`nt` → Notation, `lm` → Lemme, `cor` → Corollaire, `ex` → Exemple, `exo` → Exercice). Les notions **nommées identiques** (même titre **et même nature**, toutes matières confondues) sont **fusionnées** : une seule carte dans la grille, plusieurs cases dans le même onglet à l'ouverture. Deux notions de même nom mais de natures différentes (ex. une Définition et un Théorème) restent **séparées** : deux cartes, deux onglets. Les **démonstrations** (`proof`/`proof*`/`demonstration`) ne s'affichent pas dans la liste : elles sont rattachées à la notion qu'elles suivent (ou à la notion de même nom) et apparaissent repliées sous la notion dans l'onglet ouvert. Chaque carte de la grille n'affiche que le **nom** de la notion, en **couleur selon sa nature** (code couleur par environnement : Définition bleu, Théorème orange, Lemme violet, Proposition rose, Exemple ocre, Exercice mauve, Notation vert d'eau, Remarque jaune pâle, Rappel bleu-gris…, info-bulle nature + matière) ; une coche en surimpression signale les notions **avec démonstration**. La **nature** (colorée), le titre et la/les **matière(s)** figurent dans chaque onglet, qui se ferme individuellement (bouton ×) ou tous en bloc (bouton ✕ en fin de rangée). Chaque onglet affiche la notion compilée en LaTeX (KaTeX) avec les macros de `settings.tex`. Le bouton **Code source** déroule le code LaTeX brut de la notion ; le petit bouton **Copier** qui apparaît alors dans l'en-tête du bloc permet de le copier dans le presse-papiers. Le rendu est mis en cache (vues persistantes par notion) : les clics restent instantanés même avec ~1500 notions et des dizaines d'onglets ouverts.

## Logo

Le logo (`assets/logo.svg`) représente un **livre ouvert surmonté d'un Σ** (sigma, symbole de sommation) : les notions mathématiques issues de vos cours de lecture. Dégradé bleu → vert (couleurs des Définitions et des théorèmes dans l'app), fond sombre arrondi accordé à la charte de l'application. Les icônes dérivées (`assets/icons/`) sont générées à partir du SVG : PNG de 16 à 512 px et `icon.ico` Windows multi-tailles pour la fenêtre, la barre des tâches et l'installateur. Le SVG est la source à modifier pour changer le logo.

## Architecture (pensée pour évoluer)

```
main.js                 Processus principal : fenêtre, IPC, préférences (prefs.json, sauvegarde atomique), chargement de l'UI (loadFile)
preload.js              Pont sécurisé contextIsolation (window.api)
lib/
  settings-parser.js     Lecture/parsing de settings.tex (macros, environnements) — Node pur, testé (npm test)
  oral-files.js          Registre des leçons officielles de l'oral (oral/lessons.json : numéro unique + titre) — Node pur, testé (npm test)
  lesson-files.js        Leçons d'oral : fichiers .tex du sous-dossier lecons/ (métadonnées, identifiant stable, tri, renommage) — Node pur, testé (npm test)
  dev-files.js          Développements : fichiers .tex du sous-dossier developpements/ (métadonnées, leçons compatibles, tri, renommage) — Node pur, testé (npm test)
  latex-notions.js       Découverte des notions, scan récursif du dossier — Node pur, testé (npm test)
  notions-model.js       Nommage générique, couplage des démonstrations, fusion des notions de même nom — Node pur, testé (npm test)
  folder-watcher.js      Surveillance du dossier de cours (fs.watch récursif + repli par polling si le watch échoue) — Node pur, testé (npm test)
  auto-update.js         Mise à jour automatique via electron-updater + releases GitHub (inactive en dev) — requiert Electron, log de diagnostic dans userData/update.log, non couvert par les tests
renderer/
  index.html             UI (CSP stricte)
  styles.css             Charte Zotero-like (variables CSS, sidebar, toolbars, cartes de notions)
  app.js                 Logique UI : sections, lecteur PDF (pdf.js), rendu LaTeX (KaTeX)
vendor/                  Assets copiés depuis node_modules (KaTeX, pdf.js) — régénéré par postinstall
scripts/copy-vendor.js  Copie des assets vendor après npm install
test/run-tests.js        Tests unitaires (npm test) — 54 tests, sans Electron
exemple/                 Dossier de cours d'exemple (L3/M1/M2, settings.tex à la racine)
```

Points d'extension prévus :
- nouvelles sections : ajouter un `<button class="section" data-section="…">` dans `renderer/index.html` et un bloc correspondant dans `renderer/app.js` ;
- nouveau canal IPC : ajouter le `handle` dans `main.js` et l'exposer dans `preload.js` ;
- nouvelle règle de détection des notions : tout est centralisé dans `lib/latex-notions.js` (fonctions `extractTitledEnvironments`, `discoverTitledEnvironments`, `extractAllNotions`).

### Robustesse du parsing LaTeX

`lib/settings-parser.js` lit un vrai fichier LaTeX : commentaires `%` (y compris en fin de ligne, `\%` préservé), `\newcommand`/`\renewcommand` (accolées ou non, `[n]` arguments), `\def` multi-lignes avec `#1`, macros numérotées (`\1`), `\DeclareMathOperator` (converti en `\mathop{\mathrm{…}}\nolimits` pour KaTeX), `\newtheorem` (avec compteur partagé `[…]`), `\newtcbtheorem` (avec options), `\newenvironment`.

`lib/latex-notions.js` ignore les environnements non titrés (`array`, `proof`, `itemize`, `align*`, `tikzpicture`… via `NEVER_TITLED_ENVIRONMENTS`), gère les variantes étoilées (`qs*`), les titres absents, l'argument optionnel `\begin{df}[Titre]`, et nettoie les commentaires des cours avant extraction.

`renderer/app.js` adapte les macros pour KaTeX : fallback pour `\Xint`/`\dashint` (TeX primitives `\setbox`/`\mathchoice` non supportées), neutralisation de `\label`/`\notag`, fallbacks `\eqref`/`\ref`/`\qed`, et fallbacks génériques `\cho` (système d'équations), `\ssi` (« si et seulement si »), `\vvvert` (norme triple), `\mathring` (adhérence/intérieur topologique) utilisés dans les cours même si absents du `settings.tex`. L'extraction du mode math inline `$…$` est robuste : les `$` imbriqués dans les accolades (ex. `\cho{…\text{… $n$ …}…}`) ne coupent plus la formule. Le rendu des corps de notions gère `$$…$$`, `\[…\]`, `\begin{align*}…\end{align*}` (et `gather`, `equation`, `displaymath`), convertit les sauts `\\`, rend `itemize`/`enumerate` en listes HTML, `\textbf`/`\emph` en HTML, et affiche `tikzpicture`/`tabular`/`figure` en code brut.

## Installation

### Télécharger l'installateur Windows (recommandé)

1. Sur GitHub, onglet **Actions** → **Build installateurs** → dernier run → **Artifacts** → télécharger `installateur-windows` (contient le `.exe`).
2. Lancer le `.exe` : l'application s'installe et apparaìt dans le menu Démarrer. Elle fonctionne 100 % hors-ligne.

Vous pouvez aussi la lancer sans l'installer en testant : onglet **Actions** → télécharger l'artefact et exécuter directement.

### Mettre à jour vers une nouvelle version

L'application installée se met à jour **toute seule** : au démarrage (puis toutes les 4 heures), elle interroge les releases GitHub ; si une nouvelle version existe, elle la télécharge en arrière-plan et une **bannière « Mise à jour prête — Redémarrer »** apparaît en bas de la barre latérale. Un clic sur **Redémarrer** installe la mise à jour et relance l'application — **sans passer par GitHub**. En cas d'échec de la vérification, la bannière propose **Réessayer**.

Ce mécanisme (electron-updater) ne fonctionne que sur l'application **installée** : en dev (`npm start` / `npm run dev`), la vérification est désactivée et la bannière reste masquée. Un log de diagnostic des mises à jour est écrit dans `<userData>/update.log`. Pour essayer une nouvelle version en dev, `npm install && npm start` depuis GitHub Desktop reste la voie ; l'app installée et l'app dev cohabitent sans conflit et utilisent le même dossier de cours.

> Côté GitHub, la release doit contenir à la fois le `.exe` **et** le fichier `latest.yml` (le workflow le joint automatiquement) : c'est lui qui permet à l'app de connaître la dernière version.

### Construire soi-même

`npm run dist` produit un dossier exécutable (`dist/<plateforme>-unpacked`), `npm run dist:installer` produit l'installateur (NSIS sous Windows, AppImage sous Linux, dmg sous macOS). Le workflow GitHub **Actions** (`.github/workflows/build.yml`) construit automatiquement l'installateur Windows à chaque tag `v*` et le joint à une Release ; il est aussi déclenchable à la main (**Actions → Build installateurs → Run workflow**).

## Sécurité

- `contextIsolation: true`, `nodeIntegration: false`, pont IPC minimal dans `preload.js`.
- CSP stricte dans `renderer/index.html` ; la lecture des cours est 100 % hors-ligne, la seule requête réseau est la vérification de mises à jour (releases GitHub, app installée uniquement).
- Le processus principal vérifie que les chemins demandés appartiennent bien au dossier sélectionné.
