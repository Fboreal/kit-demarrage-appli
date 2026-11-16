# Audit de sécurité

**Déclencheur** : l'utilisateur demande de vérifier la sécurité (« fais un audit de sécurité », « est-ce bien protégé ? »…).

Lecture seule pendant tout l'audit : **aucune modification** avant la validation d'un lot.

## 1. Examen (trois volets ; sous-agents d'exploration en parallèle si disponibles)
1. **Code serveur** : actions serveur et routes (session active vérifiée ? rôle ? usage de la clé
   secrète après contrôle des droits ?), fichiers déposés (contrôle du contenu, nom calculé par le
   serveur), redirections, messages d'erreur, exports CSV.
2. **Base de données** : RLS sur toutes les tables, politiques trop larges, fonctions `security definer`
   (search_path, contrôle des droits, exécutables par `anon` ?), droits des tables, stockage (écriture
   ouverte ?), règles d'inscription. Contrôles **en lecture** sur la vraie base avec
   `outils/tester-sql.mjs` (requêtes sur `pg_policies`, `pg_proc`, `information_schema`, dans un bloc
   annulé) et `node outils/supabase.mjs reglages-auth --lire`.
3. **Configuration** : en-têtes HTTP, cookies, variables (aucune clé secrète en `NEXT_PUBLIC_`, type
   Secret dans Vercel), dépendances (`npm audit --omit=dev`), fichiers suivis par Git (aucun secret).
Référence : `.claude/rules/40-securite.md`.

## 2. Constats
Tableau trié par gravité (haute / moyenne / basse) : constat, scénario concret (qui peut faire quoi),
fichier ou objet concerné. **Revérifier** chaque constat grave (code + base) avant de le présenter.
Indiquer aussi ce qui est **correct**.

## 3. Lots
Regrouper les corrections en lots cohérents. Pour chaque lot, en langage simple : le problème, ce qui
est corrigé, **ce qui change pour les utilisateurs** (idéalement rien), la migration éventuelle et son
ordre (avant / après fusion). Présenter tous les lots, puis demander lesquels valider (choix multiple).

## 4. Corriger
Un lot à la fois, chacun selon `evolution.md` (branche, PR) ; tests SQL « attaque refusée » **et**
« usage normal identique » ; entrée `[Sécurité]` dans `docs/HISTORIQUE.md`. Noter les lots restants
dans `docs/ROADMAP.md` pour ne pas les perdre.
