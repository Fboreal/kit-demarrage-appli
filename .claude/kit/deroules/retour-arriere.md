# Retour arrière sécurisé

**Déclencheur** : « annule la dernière évolution », « reviens à la version précédente », « retire … »,
« remets comme avant », « ça a tout cassé, reviens en arrière ».

**Interdits absolus** : réécrire l'historique de `main` (jamais de `reset`, `push --force`, ni de
commit direct) ; modifier ou supprimer une migration **appliquée** ; supprimer une donnée sans
**sauvegarde vérifiée** et sans **autorisation spécifique** ; continuer si l'intégrité des données ne
peut pas être garantie. Un retour arrière est une **nouvelle évolution** : branche, PR, accord, fusion
sécurisée (`10-workflow-git.md`).

## 1. Identifier
```
node outils/retour.mjs analyser          # dernière PR fusionnée dans main
node outils/retour.mjs analyser <n>      # une PR précise
```
Faire confirmer l'évolution visée (outil de questions à choix, avec les 3 dernières PR si la demande
est ambiguë). Une seule évolution à la fois, de la plus récente à la plus ancienne.

## 2. Vérifier et 3. analyser les risques
L'outil indique : fusion (commit), fichiers, migrations et leur état (appliquées ou non), objets créés
(tables, colonnes, fonctions, politiques, index, déclencheurs, droits, données insérées), données
présentes (comptes en lecture seule), évolutions plus récentes qui en dépendent. Compléter par la
**lecture du code** de la PR : l'évolution écrit-elle dans des tables existantes ? Ces données-là ne
sont pas détectées par l'outil.

| Niveau | Situation | Suite |
|---|---|---|
| 🟢 vert | code seul, ou objets sans données (fonctions, politiques, droits, index) | plan, puis §5 |
| 🟠 orange | tables / colonnes créées par l'évolution **contenant des données**, ou données insérées | plan + sauvegarde vérifiée + **autorisation spécifique** avant toute suppression |
| 🔴 rouge | l'évolution a détruit ou transformé des données (`drop`, `alter … type`, `update`, `delete`) ; une évolution plus récente en dépend ; PR non fusionnée ; intégrité non garantissable | **bloqué** : l'expliquer simplement et proposer une correction « vers l'avant » (nouvelle évolution) |

PR **non fusionnée** : rien n'est en ligne ; proposer de la fermer. Si une de ses migrations a déjà été
appliquée (avant fusion), la compenser par une PR dédiée (§6).

## 4. Le plan, puis les accords
Présenter en langage simple : ce qui disparaît pour les utilisateurs, ce qui reste, les données
concernées (table / colonne, nombre de lignes), la sauvegarde prévue, l'ordre des opérations.
1. **Validation du plan** (outil de questions à choix).
2. **Si des données seraient supprimées : une question séparée**, qui nomme exactement ce qui sera
   détruit, par exemple « Supprimer définitivement la table *prets* (3 lignes) ? Une sauvegarde
   vérifiée est faite avant. » — **Supprimer** (recommandé par défaut, après sauvegarde vérifiée) ·
   **Conserver les données** (table / colonne gardée mais plus utilisée ni accessible). La validation
   du plan ne vaut **jamais** autorisation de supprimer.

## 5. Branche d'annulation
```
node outils/retour.mjs preparer <n>
```
Crée `fix/retour-pr-<n>` depuis `origin/main`, annule le commit de fusion (`git revert`), **remet**
les migrations appliquées, leurs tests et `docs/HISTORIQUE.md`. Refus en cas de conflit (rien n'est
modifié) ou de risque rouge. Si la PR ne touchait que la base, la branche ne contient pas de
commit d'annulation : la migration compensatoire fait tout.

## 6. Migration compensatoire (si une migration avait été appliquée)
`supabase/migrations/NNNN_retour_pr_<n>.sql` (numéro donné par `preparer`) — rejouable, en-tête
commenté (PR annulée, migration compensée, sauvegarde, autorisation), et la mention
**« À APPLIQUER APRÈS DÉPLOIEMENT »** dans la PR (la version en ligne utilise ces objets jusqu'à la
fusion). Modèles :
```sql
drop function if exists public.nom_fonction(<types des paramètres>);
drop policy if exists "nom_politique" on public.nom_table;
drop trigger if exists nom_declencheur on public.nom_table;
drop index if exists public.nom_index;
revoke select, insert, update, delete on public.nom_table from authenticated;
-- Données : SEULEMENT après sauvegarde vérifiée et autorisation spécifique.
drop table if exists public.nom_table;
alter table public.nom_table drop column if exists nom_colonne;
-- « Conserver les données » : ne rien supprimer, retirer seulement les droits (ci-dessus).
```
Son test `supabase/tests/NNNN_retour_pr_<n>.test.sql` (obligatoire pour `pr.mjs controler`) vérifie
que les objets sont retirés **et** que les autres tables gardent leurs lignes (comptes avant / après
`-- @MIGRATION`).

## 7. Sauvegarde (dès qu'une donnée peut disparaître)
Juste avant de pousser la PR, puis de nouveau juste avant d'appliquer la migration si du temps a
passé :
```
node outils/sauvegarde.mjs creer --tables=<tables> --colonnes=<table.colonne> --motif="retour PR #<n>"
node outils/sauvegarde.mjs verifier .kit/sauvegardes/<date>
```
`verifier` contrôle les fichiers, puis **essaie la restauration** dans un bloc annulé et compare
l'empreinte des données à la base : toute différence (fichier altéré, donnée modifiée depuis) la rend
**non exploitable** → pas de suppression. Les sauvegardes contiennent des **données réelles** :
locales, jamais committées, envoyées ni collées dans la conversation. Au-delà du plafond de l'outil,
la suppression est bloquée (conseiller une sauvegarde de l'offre Pro, ou « Conserver les données »).

## 8. Tests et fusion sécurisée
`docs/HISTORIQUE.md` (entrée `[Correctif]` : évolution annulée, PR, migration compensatoire, sauvegarde,
données supprimées autorisées), `MODELE_DONNEES`, `PERMISSIONS`, `ROADMAP`, puis le circuit habituel :
`node outils/pr.mjs controler` → PR → `verifier` → résumé + question → « Fusionner » →
`node outils/pr.mjs fusionner <n>`.

## 9. Après la mise en ligne
```
node outils/sauvegarde.mjs verifier .kit/sauvegardes/<date>     # toujours exploitable ?
node outils/retour.mjs instantane --sortie=.kit/retours/pr-<n>/avant.json --colonnes=<table.colonne>
node outils/supabase.mjs migrer --essai
node outils/supabase.mjs migrer
node outils/retour.mjs comparer .kit/retours/pr-<n>/avant.json --autorise=<tables et colonnes autorisées>
```
- `comparer` en alerte (perte non autorisée) : **arrêter**, prévenir l'utilisateur, restaurer
  (`node outils/sauvegarde.mjs restaurer <dossier> --element=…`, avec son accord) et analyser.
- Capture de l'application en ligne (`node outils/capture.mjs https://<domaine>/ --largeurs=390`) ;
  recette guidée des écrans concernés.
- Bilan à l'utilisateur : ce qui a été retiré, ce qui a été gardé, où est la sauvegarde.

## Réactiver plus tard
Pour remettre l'évolution : nouvelle évolution qui « annule l'annulation » (`git revert` du commit de
retour) **et** une nouvelle migration qui recrée les objets ; données restaurées depuis la sauvegarde
si l'utilisateur le souhaite (`sauvegarde.mjs restaurer`, table recréée vide d'abord).
