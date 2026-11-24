# Migrations — la base de données est versionnée

On ne modifie **jamais** la base à la main dans l'interface de Supabase. Toute évolution de la base
(table, colonne, règle d'accès, fonction) passe par un **fichier de migration** versionné avec le code.

## Écrire une migration
- Fichier `supabase/migrations/NNNN_description.sql` : **4 chiffres** qui se suivent (`0001`, `0002`…),
  description en minuscules avec tirets bas. Ne **jamais** utiliser `supabase migration new` (qui crée
  des noms horodatés et casse l'ordre).
- En-tête commenté en français : pourquoi, ce que fait la migration, ce qui ne change pas.
- **Rejouable** : `create table if not exists`, `create or replace function`, `drop policy if exists`
  avant `create policy`, `add column if not exists`…
- Pour **chaque nouvelle table** (les nouvelles tables ne sont plus exposées automatiquement) :
  1. `alter table … enable row level security;`
  2. des **politiques** explicites, `to authenticated`, jamais `using (true)` sans raison écrite ;
  3. les **droits** nécessaires : `grant select, insert, update, delete on … to authenticated;`
     (seulement ceux utilisés) — **rien** pour `anon` sauf besoin public explicite.
- Pour **chaque fonction** : `revoke execute on function … from public, anon;` puis
  `grant execute … to authenticated;` si l'application l'appelle. Une fonction `security definer` a
  `set search_path = public` et **vérifie elle-même** les droits de l'appelant en premier.
- Valeurs calculées par le serveur (numéros, statuts, auteurs, dates) : imposées par la base
  (déclencheur ou fonction), jamais fournies par le navigateur.

## Tester avant d'appliquer
Selon `.claude/kit/deroules/tester-sql.md` (outil `outils/tester-sql.mjs`) : la migration et les vérifications s'exécutent sur
la **vraie base**, dans un bloc qui **annule tout** à la fin — rien n'est enregistré.
Vérifier **les deux faces** : l'usage normal fonctionne, et l'usage interdit est refusé (autre
utilisateur, rôle insuffisant, compte non connecté…).

## Appliquer
```
node outils/supabase.mjs migrations        # appliquées / en attente
node outils/supabase.mjs migrer --essai    # exécute les migrations en attente sur la vraie base, PUIS ANNULE
node outils/supabase.mjs migrer            # applique, dans l'ordre, chacune en « tout ou rien »
```
`outils/supabase.mjs` passe par l'API officielle de Supabase avec le jeton de `.env.local` (jamais
affiché) et inscrit chaque migration dans la table de suivi `supabase_migrations.schema_migrations`.
Aucune autre installation n'est nécessaire (pas de CLI Supabase). Une migration ne contient ni
`BEGIN`, ni `COMMIT`, ni `ROLLBACK` : l'outil gère la transaction.
- Appliquer **avant la fusion** de la PR, si la migration est **compatible** avec la version en ligne
  (elle ajoute sans rien retirer). C'est le cas le plus courant.
- **Exception** : une migration qui **retire** un droit, une colonne ou une fonction **encore utilisés**
  par la version en ligne s'applique **après** le déploiement de la PR. L'écrire en tête de la PR
  (« À APPLIQUER APRÈS DÉPLOIEMENT ») ; le déroulé « après fusion » s'en charge.
- Appliquer soi-même seulement si l'utilisateur en a donné l'**autorisation durable** (notée en
  mémoire) ; sinon demander son accord à chaque fois.
- **Interdit** : vider ou réinitialiser la base en ligne, supprimer un projet, modifier ou renuméroter
  une migration déjà appliquée (on en écrit une nouvelle, au numéro suivant).

## Supprimer des données, revenir en arrière
- Toute migration qui **supprime des données** (`drop table`, `drop column`, `delete`, `truncate`,
  `update` qui écrase) exige, avant son application : une **sauvegarde vérifiée**
  (`node outils/sauvegarde.mjs creer` puis `verifier` : essai de restauration réussi, identique à la
  base) **et** l'**autorisation spécifique** de l'utilisateur, qui nomme les tables / colonnes et le
  nombre de lignes. La validation d'un plan ou l'autorisation durable des migrations ne suffisent pas.
- Annuler une évolution (déroulé `.claude/kit/deroules/retour-arriere.md`) : les migrations déjà
  appliquées **restent** ; on écrit une **migration compensatoire** (numéro suivant, testée, appliquée
  après déploiement), puis on contrôle l'intégrité (`node outils/retour.mjs instantane` / `comparer`).
- Si l'intégrité des données ne peut pas être garantie : **ne pas continuer** ; expliquer et proposer
  une correction « vers l'avant ».

## Après
Mettre à jour `docs/MODELE_DONNEES.md` (tables, règles, index des migrations) et, si des droits
changent, `docs/PERMISSIONS.md`.
