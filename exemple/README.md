# Exemple de dossier de cours pour tester l'application

Placez vos fichiers dans un dossier comme celui-ci, puis sélectionnez-le dans l'application via « Ouvrir un dossier ».

## Contenu attendu

- `settings.tex` — préambule LaTeX partagé : macros (`\newcommand`), environnements (`\newtheorem`, `\newenvironment`). L'application lit ce fichier pour reconnaître les environnements « à titre » et pour compiler les formules avec vos macros.
- `*.tex` — vos cours LaTeX. Les notions sont détectées via `\begin{NomDeLEnvironnement}{Titre}... \end{NomDeLEnvironnement}`.
- `*.pdf` — vos cours en PDF, lisibles dans la section **Cours**.

Les sous-dossiers sont parcourus récursivement.

## Astuce

Si un `.tex` et un `.pdf` portent le même nom de base, seul le PDF apparaît dans la liste des cours (le PDF est prioritaire pour la lecture).
