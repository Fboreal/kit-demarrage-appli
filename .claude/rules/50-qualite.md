# Qualité — contrôles avant chaque PR

## Contrôles obligatoires (tous à zéro problème)
```
npm run typecheck
npm run lint
npm run build
```
Avant d'ouvrir la PR, sur le commit final (dossier propre) : `node outils/pr.mjs controler`. Il
relance ces trois contrôles **et** les tests SQL des migrations de la branche (chaque migration doit
avoir son test `supabase/tests/<même nom>.test.sql`), puis enregistre la **preuve** liée au commit :
sans elle, la PR ne peut pas être fusionnée.
- `typecheck` = `next typegen && tsc --noEmit` (sans la génération des types de Next, `tsc` échoue sur
  un projet neuf ou fraîchement cloné).
- `npm run build` ne lance **pas** le lint : les trois commandes sont nécessaires.
- Lint à **zéro** problème : on ne laisse jamais un avertissement « pour plus tard ».
- Interface modifiée → **captures** à **1 280 px** et **390 px** avec `node outils/capture.mjs`
  (contrôle automatique du débordement et des erreurs JavaScript), images comparées à la maquette
  (`.claude/kit/captures.md`), et vérification des états vide / chargement / erreur.
- Migration → testée selon `.claude/kit/deroules/tester-sql.md` (usage normal **et** usage interdit), puis appliquée selon
  `30-migrations.md`.

## Journal : `docs/HISTORIQUE.md`
Une entrée **en tête** du fichier par évolution, du plus récent au plus ancien, séparée par `---` :
```
## [Étiquette] — AAAA-MM-JJ — Titre court, compréhensible par l'utilisateur
(une ou deux phrases de contexte : pourquoi)
### Ajouté
- …
### Modifié
- …
### Corrigé
- …
### Mise en ligne
- (seulement si l'ordre migration / déploiement compte)
### Vérifié
- tests SQL N/N ; typecheck 0 ; lint 0 ; build OK ; captures PC et mobile sans anomalie ; …
```
- `### Vérifié` est **obligatoire** : c'est la preuve que l'évolution est terminée.
- **Étiquettes autorisées** (liste fermée) : `[Démarrage]`, `[Fonctionnalité]`, `[Interface]`,
  `[Données]`, `[Sécurité]`, `[Correctif]`, `[Performance]`, `[Documentation]`, `[Technique]`.

## Code
- TypeScript strict ; noms de tables, colonnes et fonctions métier **en français**, `snake_case` en
  base ; composants et fichiers lisibles.
- Pas de code mort, pas de commentaire obsolète ; un commentaire explique **pourquoi**, pas quoi.
- Réutiliser les composants existants avant d'en créer ; un motif répété trois fois devient un composant.
- Chaque zone de l'application a un `loading.tsx` et un `error.tsx`.
