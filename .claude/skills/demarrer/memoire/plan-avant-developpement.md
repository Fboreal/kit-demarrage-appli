---
name: plan-avant-developpement
description: Toute évolution suit le déroulé evolution.md — questions métier, plan étape par étape, validation de l'utilisateur, puis seulement le code
metadata:
  type: feedback
---

Ne jamais écrire de code avant que l'utilisateur ait validé un plan. Les décisions métier (qui voit quoi, quel menu, quel libellé) lui reviennent : poser la question avec une recommandation.

**Why:** méthode reprise d'une application en production : les développements lancés sans plan validé ont produit des retours en arrière ; l'utilisateur veut décider, Claude exécute.
**How to apply:** déroulé `.claude/kit/deroules/evolution.md` ; mode plan si disponible ; un gros sujet est découpé en lots validés un par un ([[audit-par-lots]]). Voir `.claude/rules/20-methode.md`.
