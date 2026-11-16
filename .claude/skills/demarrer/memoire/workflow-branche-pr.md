---
name: workflow-branche-pr
description: Chaque évolution = une branche dédiée + une PR ; jamais de commit sur main (sauf le tout premier) ; c'est l'utilisateur qui fusionne
metadata:
  type: feedback
---

Pour chaque évolution : branche `feat/…` ou `fix/…` depuis `origin/main` frais, migration si la base change, `docs/HISTORIQUE.md` mis à jour, contrôles verts, PR. L'utilisateur relit et fusionne lui-même sur GitHub, puis le dit (« c'est fusionné »).

**Why:** `main` part en production automatiquement (Vercel) ; la PR permet à l'utilisateur de voir et valider chaque changement, et garde un historique propre.
**How to apply:** ne jamais pousser sur `main` ni fusionner une PR (bloqué par les réglages) ; voir [[pr-complete-avant-ouverture]], [[brancher-sur-main-a-jour]] et `.claude/rules/10-workflow-git.md`.
