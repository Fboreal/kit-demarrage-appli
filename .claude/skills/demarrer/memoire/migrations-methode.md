---
name: migrations-methode
description: Migrations NNNN_*.sql rejouables, avec GRANT + RLS ; testées en bloc annulé (attaque refusée + usage normal) ; appliquées avant la fusion, sauf retrait d'un droit utilisé en ligne (après déploiement)
metadata:
  type: feedback
---

Tester avec `node outils/tester-sql.mjs` et `node outils/supabase.mjs migrer --essai` (rien n'est enregistré), puis appliquer avec `node outils/supabase.mjs migrer` — avant la fusion si la migration est compatible avec la version en ligne ; après le déploiement si elle retire un droit, une colonne ou une fonction encore utilisés (le signaler en tête de PR, le déroulé « après fusion » s'en charge).

**Why:** une migration appliquée trop tôt casse la version en ligne ; une migration non testée peut ouvrir une faille (table sans RLS) ou casser l'usage normal.
**How to apply:** appliquer soi-même seulement si l'autorisation durable est notée dans [[preferences-utilisateur]] ; jamais de modification manuelle dans l'interface Supabase ; jamais réécrire une migration déjà appliquée. Voir `.claude/rules/30-migrations.md`.
