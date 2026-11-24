---
name: accord-avant-fusion
description: Aucune fusion sans accord explicite de l'utilisateur, donné pour CETTE PR et CE commit, en réponse au résumé ; jamais déduit, jamais à l'avance
metadata:
  type: feedback
---

L'accord pour fusionner une PR se donne dans la conversation, en réponse à la question posée après le résumé (« Fusionner et mettre en ligne »). Il vaut pour cette PR et ce commit, une seule fois.

**Why:** la fusion met l'application en ligne pour tous ses utilisateurs ; c'est la décision de l'utilisateur, pas celle de Claude.
**How to apply:** ne jamais déduire l'accord d'un « ok », d'un « continue », d'une validation de plan, d'une autorisation générale ou de l'autorisation durable des migrations ; pas d'accord à l'avance ni pour plusieurs PR ; nouveau commit, « Pas maintenant », hésitation ou silence = pas de fusion. `outils/pr.mjs fusionner` exige en plus un `verifier` du même commit depuis moins de 30 minutes. Voir [[workflow-branche-pr]].
