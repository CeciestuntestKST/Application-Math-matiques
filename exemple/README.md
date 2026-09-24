# Exemple de dossier de cours pour tester l'application

Placez vos fichiers dans un dossier comme celui-ci, puis sélectionnez-le dans l'application via « Ouvrir un dossier ».

## Contenu attendu

- `settings.tex` — **à la racine du dossier sélectionné** (pas dans un sous-dossier) : préambule LaTeX partagé : macros (`\newcommand`), environnements (`\newtheorem`, `\newenvironment`). L'application lit ce fichier pour reconnaître les environnements « à titre » et pour compiler les formules avec vos macros. S'il est absent, elle utilise des environnements par défaut (`definition`, `theoreme`, `theoremebis`) et ceux qu'elle détecte automatiquement.
- `*.tex` — vos cours LaTeX. Les notions sont détectées via `\begin{NomDeLEnvironnement}{Titre}... \end{NomDeLEnvironnement}`.
- `*.pdf` — vos cours en PDF, lisibles dans la section **Cours**.

Les sous-dossiers sont parcourus récursivement.

## Astuce

La section **Cours** liste **tous les PDF** trouvés (les `.tex` n'y apparaissent jamais : ils servent uniquement à l'extraction des notions). Ajoutez simplement le PDF compilé d'un `.tex` pour le lire dans l'app.
