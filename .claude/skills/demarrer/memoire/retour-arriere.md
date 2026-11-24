---
name: retour-arriere
description: Annuler une évolution = nouvelle PR (jamais réécrire main), migrations appliquées conservées + migration compensatoire, sauvegarde vérifiée et autorisation spécifique avant toute suppression de données, blocage si intégrité non garantie
metadata:
  type: feedback
---

« Annule la dernière évolution » suit `.claude/kit/deroules/retour-arriere.md` : `node outils/retour.mjs analyser` (risque vert / orange / rouge), plan validé, `preparer` (branche d'annulation), migration compensatoire testée, sauvegarde `outils/sauvegarde.mjs creer` + `verifier`, fusion sécurisée, puis `instantane` / `migrer` / `comparer`.

**Why:** une annulation mal faite détruit des données ou casse la version en ligne ; l'offre gratuite de Supabase n'a aucune sauvegarde récupérable.
**How to apply:** jamais de `reset` ni de `push --force` sur `main` ; jamais modifier ni supprimer une migration appliquée ; toute suppression de données = sauvegarde vérifiée (essai de restauration réussi) + question séparée qui nomme tables / colonnes et nombre de lignes ; risque rouge ou alerte de `comparer` = arrêt et explication. Voir [[migrations-methode]], [[accord-avant-fusion]].
