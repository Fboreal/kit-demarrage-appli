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
- Une PR de l'utilisateur est encore ouverte ? La signaler (elle sera fusionnée avant, ou en parallèle :
  attention au conflit d'HISTORIQUE, cf. `10-workflow-git.md`).

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

## 5. Livrer
1. `git fetch origin` : si `main` a avancé, `git rebase origin/main`, relancer les contrôles.
2. `git add` des fichiers concernés, contrôle anti-secret (`git diff --cached`), commit.
3. `git push -u origin <branche>`.
4. `gh pr create` avec le corps décrit dans `10-workflow-git.md` (Objet, Changements, Base de données,
   Vérifié, À vérifier après la mise en ligne).
5. Donner le lien à l'utilisateur ; lui expliquer comment regarder l'aperçu Vercel (lien posté dans la
   PR après 1 à 2 minutes), puis fusionner (**Merge pull request** → **Confirm merge**) ; lui demander
   de dire quand c'est fait (« c'est fusionné ») : appliquer alors `apres-fusion.md`.
Après ouverture, **ne plus rien ajouter** à cette PR.
