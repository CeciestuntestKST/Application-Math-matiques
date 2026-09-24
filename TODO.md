# TODO — Feuille de route de l'application

Référentiel des fonctionnalités envisagées. Les statuts : **À faire** (priorisé), **Plus tard** (retenu mais retardé), **Fait** (livré), **Idée** (piste non priorisée). Cochez en modifiant directement ce fichier quand une fonctionnalité est livrée.

## Priorité 1 — Cœur « préparation agrégation »

### À faire

- [ ] **Leçons d'oral — compilation autonome** : bouton d'export d'un `.tex` autonome compilable (préambule repris du `settings.tex` autour du plan actuel de la leçon), via une boîte de dialogue native.

- [ ] **Développements — compilation autonome** : bouton d'export d'un `.tex` autonome compilable (préambule repris du `settings.tex`), comme pour les leçons.

### Fait

- [x] **Leçons d'oral — aperçu rendu** : prévisualisation KaTeX du plan dans l'éditeur — bascule « Code source » / « Aperçu rendu » ; le rendu décompose le plan en blocs type notions (démonstrations pliables), comme pour les développements ; à la création d'une leçon, l'éditeur s'ouvre directement en mode code ; l'import d'une notion bascule en mode code pour l'insertion au curseur.

- [x] **Leçons / Développements — sections indépendantes** : entrer dans une section affiche toujours son accueil (plus de reprise du dernier élément édité, qui donnait l'impression que la vue principale ne changeait pas) ; correctif de l'aperçu rendu des développements (la vue restait figée : la fonction n'attendait pas le parsing IPC) ; garde-fous contre les rendus asynchrones obsolètes (bascule rapide entre sections).

- [x] **Développements — numéros de leçons libres** : champ « N° de leçons » (ex. `12, 142, 158`) dans le panneau latéral, stocké dans `% dev-meta:` (`lessonNumbers`), en plus des cases à cocher de leçons existantes. Les cartes de l'accueil affichent les numéros concernés.

- [x] **Développements — aperçu rendu type notions** : l'éditeur affiche par défaut le contenu décomposé en blocs (théorèmes, exercices, énoncés) rendus par KaTeX, avec **démonstrations pliables/dépliables** comme dans la section Notions ; bascule « Code source » / « Aperçu rendu » pour éditer le LaTeX ; parse via IPC `app:dev-parse` (couples démonstrations ↔ notion précédente ou de même nom).

- [x] **Développements — section complète** : section dédiée aux développements potentiels pour l'oral ; création depuis l'accueil (« + Créer un développement » → titre) ; **éditeur LaTeX libre** avec autosauvegarde dans un petit fichier `.tex` du sous-dossier `developpements/` du dossier de cours (métadonnées `% dev-meta:` titre/leçons compatibles en en-tête) ; **« Leçons compatibles »** : cases à cocher listant les leçons d'oral (lien par identifiant stable, insensible au renommage du fichier) ; **panneau « Bibliothèque de notions »** avec recherche et insertion du LaTeX au clic ; cartes à l'accueil (titre, leçons, date) ; titre modifiable avec renommage automatique du fichier ; suppression avec confirmation ; le dossier `developpements/` est exclu du scan des notions et du watcher ; `lib/dev-files.js` (Node pur) ; 49 tests au total.

- [x] **Leçons d'oral — identifiant stable** : chaque leçon porte un identifiant dérivé du couple numéro/titre (`lesson-…`), stocké dans les métadonnées `% lesson-meta:` — il survit au renommage du fichier et sert de lien pour les leçons compatibles des développements.

- [x] **Leçons d'oral — section complète (autonome)** : création depuis la section dédiée (« + Créer une leçon » → numéro + titre) ; **éditeur LaTeX libre** avec autosauvegarde dans un petit fichier `.tex` du sous-dossier `lecons/` du dossier de cours (métadonnées `% lesson-meta:` numéro/titre en en-tête) ; **panneau latéral « Bibliothèque de notions »** avec recherche plein texte — clic sur une notion = insertion de son code LaTeX au curseur ; cartes de leçons à l'accueil (numéro, titre, date) ; titre/numéro modifiables avec renommage automatique du fichier ; suppression avec confirmation ; le dossier `lecons/` est exclu du scan des notions et du watcher ; `lib/lesson-files.js` (Node pur). La section Notions reste inchangée (le mode cochage temporaire a été retiré).

- [x] **Recherche dans le corps des notions** : la recherche porte sur titre / nature / matière / corps (y compris démonstrations), avec priorité aux titres concordants (tri par pertinence : titre, puis nature, puis matière, puis corps ; cartes à titre concordant surlignées).

### Plus tard (explicitement reportés)

- [ ] **Favoris / notions à revoir** : épingler des notions (stockage dans les préférences, jamais dans les `.tex`), filtre « Favoris » et compteur.
- [ ] **Mode révision** : bascule globale « afficher / masquer toutes les démonstrations » pour s'auto-tester.
- [ ] **Tirage aléatoire** : « une notion au hasard » filtrée par matière / nature, pour l'entraînement de mémoire type oral.

## Priorité 2 — Confort quotidien

- [ ] **Raccourcis clavier globaux** : `Ctrl+F` focus recherche, `Ctrl+W` fermer l'onglet, `Ctrl+Tab` onglet suivant, `F11` plein écran lecture. *(Naviguer entre les onglets et les fermer se fait aujourd'hui uniquement à la souris ; seule la recherche PDF a des raccourcis locaux : Entrée / Maj+Entrée / Échap.)*
- [ ] **Historique de navigation** dans les notions : précédent / suivant façon navigateur quand on saute de notion en notion.
- [ ] **Restauration de session** : réouvrir au démarrage les onglets de notions qui étaient ouverts à la fermeture.
- [ ] **Synchronisation notion ↔ PDF** : bouton « voir dans le cours » depuis une notion, ouvrant le PDF correspondant à la bonne page (via le titre cherché dans la couche texte du PDF ; les `.synctex.gz` du dossier sont aussi exploitables).

## Priorité 3 — Section Cours (PDF)

- [ ] **Surlignage persistant** : annotations colorées par page, stockées en JSON dans les préférences (jamais dans le PDF), avec palette de couleurs et suppression.
- [x] **Recherche texte dans les PDF** : champ de recherche dans la toolbar du lecteur, insensible à la casse et aux accents, surlignage des occurrences (courante en jaune, autres en orange), navigation Occurrence précédente/suivante (▲▼ ou Entrée / Maj+Entrée), compteur, Échap ou × pour effacer.
- [ ] **Marque-pages / reprise de lecture** : mémoriser la dernière page consultée de chaque cours et la proposer à la réouverture.

## Priorité 4 — Graphisme / polish

- [ ] **Thème clair / sombre commutable** (les variables CSS existent déjà dans `renderer/styles.css`).
- [ ] **Coloration syntaxique** du code source déroulé (bascule « Code source » des notions).
- [ ] **Statistiques de révision** : compteur de vues par notion, badge « souvent revue ».

### Idées (non priorisées)

- Variantes de logo (∫ au lieu de Σ, version avec titre).
- Personnalisation de la taille de police du rendu KaTeX.

## Priorité 5 — Technique

- [ ] **Multi-dossiers** : pouvoir ajouter plusieurs racines de cours (ex. L3/M1/M2 et dossier agrégation) et basculer entre elles.
- [ ] **Test de compilation** : vérifier qu'une notion compile seule en LaTeX (détection des macros manquantes avant l'oral).

## Déjà livré (pour mémoire)

- [x] Lecteur PDF pdf.js embarqué : zoom, ajustement largeur, Ctrl+molette, sommaire interactif avec suivi de lecture, liens cliquables, rendu virtuel.
- [x] Section Notions : extraction depuis tous les `.tex`, fusion par titre **et nature**, démonstrations couplées et repliées, filtres (nommées/anonymes, matières, natures), code couleur par nature, recherche insensible aux accents/casse.
- [x] Onglets de notions persistants (cache de rendu), bouton « Code source » avec **Copier** dans le bloc déroulé, bouton **« fermer tous les onglets »** (✕ en fin de rangée d'onglets).
- [x] **Badge « avec démonstration »** (coche ✓) sur les cartes de notions qui ont une démonstration rattachée.
- [x] **Rechargement automatique du dossier** (watch) avec préservation du contexte (onglets, filtres, PDF rechargé à la page courante).
- [x] Logo (livre ouvert + Σ) : SVG source + icônes PNG/ICO pour la fenêtre, l'installateur et l'écran d'accueil.
- [x] Installateur Windows automatique via GitHub Actions (tag `v*` → release).
- [x] **Mise à jour automatique** de l'app installée (electron-updater + releases GitHub) : bannière dans le footer de la sidebar, téléchargement en arrière-plan, bouton « Redémarrer » pour installer ; silence en dev et non-packagé ; `latest.yml` attaché à la release.
- [x] Raccourcis basiques d'app (recherche, navigation dans la grille).
- [x] **Suite de tests unitaires** (`npm test`) : 25 tests sur le parsing `settings.tex`, l'extraction des notions, le modèle (nommage, preuves, fusion) et le watcher — sans Electron.
- [x] **Version dans le titre de la fenêtre** : « Application Mathématiques vX.Y.Z », lue dynamiquement depuis `package.json` (aucune mise à jour manuelle à prévoir).
- [x] **Bannière de mise à jour corrigée** : la fonction `initUpdateBanner` manquante a été implémentée (ReferenceError qui bloquait le renderer) ; bannière en bas de la sidebar — téléchargement avec pourcentage, bouton « Redémarrer » quand la mise à jour est prête, bouton « Réessayer » en cas d'erreur.
