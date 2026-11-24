# Une évolution, du besoin à la PR

**Déclencheur** : toute demande d'ajout, de modification ou de correction de l'application (« je
voudrais… », « ajoute… », « il faudrait que… », « ça ne marche pas quand… »).

Appliquer toutes les règles de `.claude/rules/`.

## 1. Point de départ
```
git status
git fetch origin
```
- Travail non enregistré en cours ? Le montrer et demander quoi en faire avant tout.
- Une PR est encore ouverte (en attente d'accord) ? La signaler et proposer de la fusionner d'abord
  (résumé + question, §5) : sinon, conflit probable sur `docs/HISTORIQUE.md`.

## 2. Comprendre le besoin
- Reformuler le besoin en une phrase et la faire valider.
- Lire ce qui existe (`docs/`, code concerné) avant de proposer.
- Poser les **questions métier** (outil de questions à choix, une recommandation en premier) :
  qui utilise, qui voit, qui modifie, quelles informations, quel libellé, quel menu… Ne rien trancher
  à la place de l'utilisateur. Ne rien ajouter qui n'ait pas été demandé (application vierge).
- Si c'est le **premier menu** de l'application : annoncer que la coque PC / mobile de la maquette
  (barre latérale, tiroir mobile) apparaît avec lui.

## 3. Le plan (à faire valider AVANT tout code)
Passer en mode plan si disponible. Le plan, en langage simple, contient :
- ce que l'utilisateur verra (écrans, boutons, messages) sur PC et sur mobile ;
- la base de données (tables, règles d'accès, migration n°…) et si elle s'applique **avant** ou
  **après** la fusion ;
- la sécurité concernée (`40-securite.md`) ;
- les vérifications prévues (tests SQL, captures, recette après mise en ligne).
Gros sujet : découper en **lots** et ne réaliser que le lot validé.

## 4. Réaliser (après validation)
1. Branche : `git switch -c feat/<sujet> origin/main` (ou `fix/<sujet>`).
2. Base de données (si besoin) : migration `supabase/migrations/NNNN_….sql` (numéro suivant) selon
   `30-migrations.md` → test selon `tester-sql.md` (usage normal **et** interdit) →
   `node outils/supabase.mjs migrer --essai` → si compatible et autorisé :
   `node outils/supabase.mjs migrer` puis `node outils/supabase.mjs migrations`.
3. Code : consulter `.claude/kit/interface/` avant tout écran ; jetons de couleur uniquement ;
   états vide / chargement / erreur ; PC et mobile.
4. Contrôles (`50-qualite.md`) : `npm run typecheck`, `npm run lint`, `npm run build` ; si l'interface
   change, captures 1 280 et 390 px avec `node outils/capture.mjs` (`.claude/kit/captures.md`), images
   relues, serveur arrêté ensuite.
5. Documentation : `docs/HISTORIQUE.md` (entrée en tête, avec « Vérifié »), `CLAUDE.md` (décisions,
   avancement), et selon le cas `MODELE_DONNEES`, `PERMISSIONS`, `DESIGN`, `ROADMAP`, `INFRA`.

## 5. Livrer, puis fusionner avec l'accord de l'utilisateur
1. `git fetch origin` : si `main` a avancé, `git rebase origin/main`, relancer les contrôles.
2. `git add` des fichiers concernés, contrôle anti-secret (`git diff --cached`), commit.
3. **Preuve des contrôles** sur ce commit : `node outils/pr.mjs controler` (doit finir par « Contrôles
   réussis »). Échec : corriger, commiter, relancer — rien n'est poussé avant.
4. `git push -u origin <branche>`, puis `gh pr create` avec le corps décrit dans `10-workflow-git.md`
   (Objet, Changements, Base de données, Vérifié, À vérifier après la mise en ligne).
   Après ouverture, **ne plus rien ajouter** à cette PR.
5. `node outils/pr.mjs verifier <n>` (attend l'aperçu Vercel, 1 à 3 minutes). Refus : l'expliquer
   simplement et traiter la cause (conflit ou correction : nouvelle branche ; retard sur `main` :
   rebase sans changement de contenu, contrôles, renvoi, revérification).
6. **Résumé + question** (`10-workflow-git.md` § Fusion) : ce qui change, contrôles, base de données,
   lien de la PR et lien d'aperçu ; « Je fusionne et je mets en ligne ? » — Fusionner et mettre en
   ligne · Pas maintenant · Je regarde d'abord l'aperçu (dans ce cas, attendre son retour, puis reposer
   la question).
7. **Seulement après la réponse « Fusionner »** : `node outils/pr.mjs fusionner <n>`. L'outil fusionne,
   attend la mise en ligne et met l'ordinateur à jour ; enchaîner `apres-fusion.md` §3 à §5
   (migration différée, recette, bilan). « Pas maintenant » : la PR attend, sans relance insistante.
