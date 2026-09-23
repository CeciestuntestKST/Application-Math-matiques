# TODO — Feuille de route de l'application

Référentiel des fonctionnalités envisagées. Les statuts : **À faire** (priorisé), **Plus tard** (retenu mais retardé), **Fait** (livré), **Idée** (piste non priorisée). Cochez en modifiant directement ce fichier quand une fonctionnalité est livrée.

## Priorité 1 — Cœur « préparation agrégation »

### À faire

- [ ] **Mode « leçon d'oral »** : sélectionner des notions (coches sur les cartes de la grille), puis générer un fichier `.tex` autonome — préambule repris du `settings.tex` + les notions choisies dans l'ordre voulu — exportable et compilable, pour construire les plans de leçons directement depuis la bibliothèque de notions.
- [ ] **Recherche dans le corps des notions** : la recherche actuelle porte sur titre / nature / matière ; elle doit aussi trouver les notions qui mentionnent le terme dans leur contenu (ex. « compacité » mentionnée dans un théorème).

### Plus tard (explicitement reportés)

- [ ] **Favoris / notions à revoir** : épingler des notions (stockage dans les préférences, jamais dans les `.tex`), filtre « Favoris » et compteur.
- [ ] **Mode révision** : bascule globale « afficher / masquer toutes les démonstrations » pour s'auto-tester.
- [ ] **Tirage aléatoire** : « une notion au hasard » filtrée par matière / nature, pour l'entraînement de mémoire type oral.

## Priorité 2 — Confort quotidien

- [ ] **Raccourcis clavier** : `Ctrl+F` focus recherche, `Ctrl+W` fermer l'onglet, `Ctrl+Tab` onglet suivant, `F11` plein écran lecture.
- [ ] **Historique de navigation** dans les notions : précédent / suivant façon navigateur quand on saute de notion en notion.
- [ ] **Restauration de session** : réouvrir au démarrage les onglets de notions qui étaient ouverts à la fermeture.
- [ ] **Synchronisation notion ↔ PDF** : bouton « voir dans le cours » depuis une notion, ouvrant le PDF correspondant à la bonne page (via le titre cherché dans la couche texte du PDF ; les `.synctex.gz` du dossier sont aussi exploitables).

## Priorité 3 — Section Cours (PDF)

- [ ] **Surlignage persistant** : annotations colorées par page, stockées en JSON dans les préférences (jamais dans le PDF), avec palette de couleurs et suppression.
- [ ] **Recherche texte dans les PDF** : recherche « aller à la page X » en s'appuyant sur la couche texte extraite par pdf.js.
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
- [x] Onglets de notions persistants (cache de rendu), bouton « Code source » avec **Copier** dans le bloc déroulé.
- [x] **Rechargement automatique du dossier** (watch) avec préservation du contexte (onglets, filtres, PDF rechargé à la page courante).
- [x] Logo (livre ouvert + Σ) : SVG source + icônes PNG/ICO pour la fenêtre, l'installateur et l'écran d'accueil.
- [x] Installateur Windows automatique via GitHub Actions (tag `v*` → release).
- [x] **Mise à jour automatique** de l'app installée (electron-updater + releases GitHub) : bannière dans le footer de la sidebar, téléchargement en arrière-plan, bouton « Redémarrer » pour installer ; silence en dev et non-packagé ; `latest.yml` attaché à la release.
- [x] Raccourcis basiques d'app (recherche, navigation dans la grille).
