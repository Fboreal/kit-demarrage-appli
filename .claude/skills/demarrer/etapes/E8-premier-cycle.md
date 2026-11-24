# E8 — Premier cycle complet (votre première évolution)

Objectif : faire vivre **une fois, en vrai**, tout le circuit qui servira pour chaque évolution :
branche → migration testée → contrôles → PR → **résumé et accord de l'utilisateur** → fusion par
Claude → mise en ligne automatique → vérification. L'évolution est utile mais minuscule : une
**page « état »** qui vérifie que l'application en ligne parle bien à sa base de données.

Expliquer d'abord le circuit avec une image simple : « On prépare la modification à côté (une
branche), je la contrôle, je vous la présente (une PR) ; si vous me dites « fusionner », je la mets en
ligne moi-même. Rien ne part en ligne sans votre accord. »

## Déroulé (celui de toute évolution, `.claude/kit/deroules/evolution.md`, en version courte : le plan est celui-ci)
1. Branche : `git fetch origin` puis `git switch -c feat/page-etat origin/main`.
2. **Migration `supabase/migrations/0001_socle.sql`** :
   - droits par défaut prudents (une nouvelle fonction n'est ouverte à personne sans décision
     explicite) — les deux niveaux sont nécessaires :
     `alter default privileges for role postgres revoke execute on functions from public;`
     `alter default privileges for role postgres in schema public revoke execute on functions from anon;` ;
   - fonction `public.sante()` en `security invoker`, qui renvoie un petit objet JSON
     (`{"ok": true, "base": "connectée", "heure": now()}`) sans aucune donnée : pas même le nombre
     de migrations, car un visiteur non connecté ne peut pas lire la table de suivi (vérifié) et
     c'est voulu ; `revoke execute … from public;` puis `grant execute … to anon, authenticated;`
     (exception documentée : c'est une fonction de santé publique) ;
   - en-tête commenté expliquant tout cela.
3. **Test** `supabase/tests/0001_socle.test.sql` (même nom que la migration, exigé par
   `pr.mjs controler` ; `.claude/kit/deroules/tester-sql.md`) : en rôle `anon`, `select public.sante()`
   fonctionne ; une nouvelle fonction de test créée dans le bloc n'est **pas** exécutable par `anon`
   (droits par défaut).
   Puis `node outils/supabase.mjs migrer --essai`.
4. **Appliquer** (migration compatible : avant fusion) : `node outils/supabase.mjs migrer`, puis
   `node outils/supabase.mjs migrations`.
5. **Page `src/app/etat/page.tsx`** : créer `src/lib/supabase/server.ts` et appeler `sante()` côté
   serveur comme dans `nextjs.md` § Supabase dans le code (jamais de plantage si la base est
   injoignable) ; afficher « Application OK · Base de données connectée » et l'heure de la base, dans
   la charte (carte, pastille verte / rouge), avec un lien retour vers l'accueil. Ajouter le lien
   « État de l'application » en bas de la page d'accueil.
6. Contrôles : `npm run typecheck`, `npm run lint`, `npm run build` ; puis `npm run start` en
   arrière-plan (`.env.local` est lu en local) et `node outils/capture.mjs http://localhost:3000/etat`
   — pastille verte attendue ; arrêter le serveur (`captures.md` § Arrêter le serveur).
7. Documentation : `docs/MODELE_DONNEES.md` (fonction `sante()`, migration 0001),
   `docs/PERMISSIONS.md` (exception publique `sante()`), `docs/HISTORIQUE.md` (entrée `[Démarrage]`
   avec « Vérifié »), `docs/ROADMAP.md` et `CLAUDE.md` (état d'avancement).
8. Commit, **preuve des contrôles** (`node outils/pr.mjs controler`), `git push -u origin
   feat/page-etat`, PR (corps selon `10-workflow-git.md`), puis `node outils/pr.mjs verifier <n>`.

## Le moment clé : l'utilisateur donne son accord
1. Lui montrer la PR (lien) et ce qu'il y voit : la description en français, les fichiers modifiés,
   et le lien d'**aperçu** Vercel posté au bout d'une à deux minutes (l'application avec la
   modification, avant sa mise en ligne). Il n'a **rien à cliquer** sur GitHub.
2. Résumé + question (`10-workflow-git.md` § Fusion) : « Je fusionne et je mets en ligne ? ».
   Expliquer que c'est ainsi que se terminera chaque évolution, et que **rien ne part en ligne sans
   cette réponse**.
3. Réponse « Fusionner » → `node outils/pr.mjs fusionner <n>` : fusion, attente de la mise en ligne,
   ordinateur à jour. Commenter chaque ligne du résultat en une phrase simple.

## Vérification (déroulé « après fusion », `.claude/kit/deroules/apres-fusion.md`)
- PR `MERGED` (fusionnée par `pr.mjs`, après accord) ; statut Vercel `success` sur le commit de fusion.
- `node outils/capture.mjs https://<domaine>/etat --largeurs=390` : code 0, et l'image montre
  « Base de données connectée » (pastille verte).
- `migrations` : 0001 appliquée ; `main` local à jour.
Preuve : « PR #n fusionnée ; /etat en ligne OK ; migration 0001 appliquée ».
