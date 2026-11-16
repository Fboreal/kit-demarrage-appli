# Tester une migration ou une règle d'accès sans rien enregistrer

**Déclencheur** : avant d'appliquer toute migration, ou quand un droit d'accès semble incorrect.

Objet du test : la migration en cours (sinon la dernière de `supabase/migrations/`).

## Principe
`outils/tester-sql.mjs` exécute un bloc SQL sur la **vraie** base, puis **annule tout** : le bloc se
termine par une erreur volontaire (`raise exception 'RESULTATS %', r;`) qui renvoie les résultats et
défait chaque écriture. L'outil refuse un test sans cette ligne.

## Écrire le test
1. Partir du modèle : `node outils/tester-sql.mjs --modele` ; enregistrer le test dans
   `supabase/tests/NNNN_<sujet>.test.sql` (versionné avec la migration).
2. Mettre la ligne `-- @MIGRATION` là où la migration doit s'exécuter (avant les vérifications).
3. Prendre le jeu d'essai **dans les données existantes** (comptes, lignes) ; si elles manquent, créer
   les données nécessaires **dans le bloc** (elles seront annulées avec le reste).
4. Se mettre dans la peau d'un utilisateur : `set_config('role','authenticated',true)` et
   `set_config('request.jwt.claims', json_build_object('sub', <id>, 'role','authenticated')::text, true)`
   — ou `set_config('role','anon',true)` pour un visiteur non connecté. Revenir à l'administrateur
   avec `set_config('role','postgres',true)` **et** `set_config('request.jwt.claims','',true)`.
5. Vérifier **les deux faces** pour chaque règle : l'usage normal **fonctionne** (T… OK) et l'usage
   interdit est **refusé** (T… OK refusé). Avec au moins deux utilisateurs (et deux périmètres s'il y en a).
6. Les messages de résultat contiennent « KO » quand une vérification échoue (l'outil les compte).

## Lancer
```
node outils/tester-sql.mjs supabase/tests/NNNN_<sujet>.test.sql --migration=supabase/migrations/NNNN_<sujet>.sql
```
Présenter les résultats à l'utilisateur en langage simple (« un visiteur non connecté ne voit rien ✓ »).
Corriger la migration tant qu'il reste un « KO », puis `node outils/supabase.mjs migrer --essai`.
