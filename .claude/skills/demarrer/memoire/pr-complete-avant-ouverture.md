---
name: pr-complete-avant-ouverture
description: N'ouvrir une PR qu'une fois complète (code, migration testée, docs, fichiers) ; une PR ouverte est figée, toute correction part dans une nouvelle PR
metadata:
  type: feedback
---

Une PR n'est ouverte que lorsque tout est commité et vérifié. Après ouverture, on n'y ajoute plus rien : une correction, même minime, va dans une nouvelle branche et une nouvelle PR.

**Why:** retour d'expérience : des commits ajoutés après coup se sont retrouvés hors de la version en ligne (images manquantes, correctifs perdus) ; et le résumé présenté pour l'accord doit décrire exactement ce qui sera mis en ligne (`outils/pr.mjs` refuse toute PR modifiée depuis).
**How to apply:** si un fichier doit venir de l'utilisateur (logo, image), l'attendre avant d'ouvrir la PR. Vérifier qu'un commit est bien en ligne : `git merge-base --is-ancestor <sha> origin/main`. Voir [[workflow-branche-pr]].
