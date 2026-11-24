# Après la fusion d'une PR

**Déclencheurs** :
- **après `node outils/pr.mjs fusionner <n>`** (cas normal) : l'outil a déjà fusionné, mis
  l'ordinateur à jour et attendu la mise en ligne ; reprendre §2 seulement si la mise en ligne était
  encore en cours, puis §3 à §5 ;
- l'utilisateur dit qu'il a fusionné **lui-même** sur GitHub (« c'est fusionné », « c'est mergé ») :
  tout le déroulé.

PR concernée : celle que cite l'utilisateur, sinon la dernière PR de la branche en cours
(`gh pr list --state all --head <branche> --limit 1`), sinon demander laquelle.

## 1. La fusion a-t-elle eu lieu ?
```
gh pr view <n> --json number,title,state,mergedAt,mergeCommit,headRefName,body
```
- `state` ≠ `MERGED` : la PR attend toujours. Proposer la fusion par Claude (`evolution.md` §5 :
  vérification, résumé, accord). Conflit : le résoudre dans une **nouvelle** branche (la PR ouverte
  reste figée : la fermer et en ouvrir une autre) — garder les deux entrées d'HISTORIQUE.

## 2. La mise en ligne
```
gh api repos/<depot>/commits/<sha de mergeCommit>/status --jq ".statuses[] | {context, state}"
```
- `success` pour Vercel : continuer.
- `pending` : la mise en ligne prend 1 à 3 minutes ; prévenir l'utilisateur, attendre 1 à 2 minutes et
  revérifier soi-même.
- `failure` : lire le journal de déploiement avec l'utilisateur (Vercel → Deployments → le dernier →
  Build Logs) ; corriger dans une nouvelle branche (`fix/…`) selon `evolution.md`.

## 3. Migration différée
Si le corps de la PR contient « À APPLIQUER APRÈS DÉPLOIEMENT » et que la mise en ligne est `success` :
```
node outils/supabase.mjs migrer --essai
node outils/supabase.mjs migrer
node outils/supabase.mjs migrations
```
(avec l'autorisation durable notée en mémoire ; sinon demander).

## 4. Mettre l'ordinateur à jour (déjà fait par `pr.mjs fusionner`)
```
git switch main
git pull --ff-only origin main
git branch -d <branche fusionnée>
```
(Si Git répond « not fully merged » alors que la PR est bien `MERGED` — fusion faite en mode
« Squash » ou « Rebase » sur GitHub — `git branch -D <branche>` est sans risque.)

## 5. La recette
Reprendre la section « À vérifier après la mise en ligne » de la PR et guider l'utilisateur point par
point sur l'application **en ligne** (PC puis téléphone). Vérifier soi-même ce qui peut l'être :
`node outils/capture.mjs https://<domaine>/<page> --largeurs=390` (statut, débordement, erreurs, image).
Si un défaut apparaît : nouvelle branche et nouvelle PR selon
`evolution.md` (jamais de correction directe sur `main`).

## Bilan
« PR #n fusionnée, en ligne (statut Vercel success), [migration NNNN appliquée], ordinateur à jour. »
Proposer la prochaine évolution de `docs/ROADMAP.md`.
