---
name: workflow-branche-pr
description: Chaque évolution = une branche dédiée + une PR ; jamais de commit sur main (sauf le tout premier) ; Claude fusionne seulement après l'accord explicite de l'utilisateur, via outils/pr.mjs
metadata:
  type: feedback
---

Pour chaque évolution : branche `feat/…` ou `fix/…` depuis `origin/main` frais, migration testée si la base change, `docs/HISTORIQUE.md` mis à jour, preuve des contrôles (`node outils/pr.mjs controler`), PR, `node outils/pr.mjs verifier <n>`, résumé et question « Je fusionne et je mets en ligne ? », puis — seulement après la réponse « Fusionner » — `node outils/pr.mjs fusionner <n>`.

**Why:** `main` part en production automatiquement (Vercel) ; l'utilisateur décide de chaque mise en ligne, et l'outil refuse toute fusion risquée (conflit, contrôles, aperçu Vercel, migration, PR modifiée depuis le résumé).
**How to apply:** ne jamais pousser sur `main` ni lancer `gh pr merge` (interdits par les réglages) ; ne jamais contourner un refus de `pr.mjs` ; voir [[accord-avant-fusion]], [[pr-complete-avant-ouverture]], [[brancher-sur-main-a-jour]] et `.claude/rules/10-workflow-git.md`.
