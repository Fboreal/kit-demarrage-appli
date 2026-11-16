# Workflow Git — une branche et une PR par évolution

Le code vit sur GitHub. La branche `main` est la version **en ligne** : tout ce qui y arrive part en
production automatiquement (Vercel). On ne travaille donc **jamais** directement dessus.

## Règles
1. **Chaque évolution** (fonctionnalité, écran, menu, correction, documentation) a sa **branche
   dédiée** : `feat/<sujet-court>` ou `fix/<sujet-court>` (minuscules, tirets, sans accent).
2. **Seule exception** : le tout premier commit d'un dépôt neuf (démarrage, étape E5).
3. **Toujours partir de la dernière version en ligne** : considérer que la PR précédente a été fusionnée.
   ```
   git fetch origin
   git switch -c feat/<sujet> origin/main
   ```
   Jamais depuis un `origin/main` récupéré plus tôt dans la conversation.
4. Juste **avant de pousser**, refaire `git fetch origin` : si `main` a avancé, rebaser
   (`git rebase origin/main`) puis pousser avec `git push --force-with-lease`.
5. **Une PR n'est ouverte que lorsqu'elle est complète** : code, migration testée, documentation,
   historique, fichiers (images…) — tout est commité et vérifié. L'utilisateur fusionne souvent dès que
   la PR apparaît.
6. **Une PR ouverte est figée** : aucune modification ajoutée après coup. Toute correction, même
   minime, part dans une **nouvelle branche et une nouvelle PR**.
7. **C'est l'utilisateur qui fusionne** la PR sur GitHub (bouton « Merge pull request »). Claude ne
   fusionne jamais et ne pousse jamais sur `main`.
8. **Conflit sur `docs/HISTORIQUE.md`** (fréquent : chaque PR y ajoute une entrée en tête) : garder
   **les deux entrées**, la plus récente en premier — jamais `--ours` ni `--theirs`.

## Commits
- Messages en français, courts, à l'infinitif ou au nom (« Ajouter la page d'accueil »).
- Avant chaque commit : `git status` ; **aucun** fichier `.env*` (hors `.env.example`) dans l'index,
  aucune clé (`sb_secret_`, `sbp_`, mot de passe) dans le diff.
- Un hook Git local (installé au démarrage) refuse tout commit sur `main` : ne jamais le contourner
  (`--no-verify` interdit).

## Pull Request
Créée avec `gh pr create --base main --head <branche> --title "…" --body-file <fichier>`.
Corps de la PR, en français, pour l'utilisateur :
```
## Objet
(le besoin, en une ou deux phrases)

## Changements
(liste simple de ce qui change pour l'utilisateur)

## Base de données
(migration NNNN : ce qu'elle fait ; appliquée AVANT fusion, ou À APPLIQUER APRÈS DÉPLOIEMENT)

## Vérifié
(tests SQL, tsc, lint, build, captures PC et mobile…)

## À vérifier après la mise en ligne
1. … (recette pas à pas, en langage simple)
```
Après création : donner le lien de la PR à l'utilisateur, lui expliquer comment la relire et la
fusionner, puis lui demander de dire quand c'est fait (« c'est fusionné ») : appliquer alors
`.claude/kit/deroules/apres-fusion.md`.

## Vérifier qu'une PR est fusionnée
`gh pr view <n> --json state,mergedAt,mergeCommit` → `state` = `MERGED`. Seul l'état `CONFLICTING`
bloque une fusion ; un aperçu Vercel en échec n'empêche pas de fusionner.
