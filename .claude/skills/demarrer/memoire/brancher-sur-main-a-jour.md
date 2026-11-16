---
name: brancher-sur-main-a-jour
description: À chaque évolution, considérer la PR précédente comme fusionnée — git fetch puis brancher sur origin/main frais ; rebaser avant de pousser
metadata:
  type: feedback
---

`git fetch origin` puis `git switch -c <branche> origin/main`, jamais depuis un `origin/main` récupéré plus tôt. Avant de pousser : refaire `git fetch` ; si `main` a avancé, `git rebase origin/main` puis `git push --force-with-lease`.

**Why:** `docs/HISTORIQUE.md` reçoit une entrée en tête à chaque évolution : deux PR parallèles s'y heurtent forcément ; partir d'une base périmée provoque des conflits que le débutant ne sait pas résoudre.
**How to apply:** conflit sur `HISTORIQUE.md` = garder les deux entrées, la plus récente en premier (jamais `--ours`/`--theirs`) ; après rebase, relancer tsc, lint et build. Seul l'état `CONFLICTING` bloque une fusion. Voir [[workflow-branche-pr]].
