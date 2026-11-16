# E8 — Premier cycle complet (votre première évolution)

Objectif : faire vivre **une fois, en vrai**, tout le circuit qui servira pour chaque évolution :
branche → migration testée → contrôles → PR → **fusion par l'utilisateur** → mise en ligne
automatique → vérification. L'évolution est utile mais minuscule : une **page « état »** qui vérifie
que l'application en ligne parle bien à sa base de données.

Expliquer d'abord le circuit avec une image simple : « On prépare la modification à côté (une
branche), on la contrôle, je vous la présente (une PR) ; vous la validez d'un clic ; elle part en ligne
toute seule. »

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
3. **Test** (`.claude/kit/deroules/tester-sql.md`) : en rôle `anon`, `select public.sante()` fonctionne ; une nouvelle fonction
   de test créée dans le bloc n'est **pas** exécutable par `anon` (droits par défaut).
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
8. Commit, `git push -u origin feat/page-etat`, PR (corps selon `10-workflow-git.md`).

## Le moment clé : l'utilisateur fusionne
Lui montrer la PR (lien), expliquer ce qu'il y voit (description, fichiers modifiés, aperçu Vercel
après une à deux minutes), puis le guider : bouton vert **Merge pull request** → **Confirm merge**.
Lui demander de **dire quand c'est fait** (« c'est fusionné ») : c'est ainsi que se terminera chaque
évolution.

## Vérification (déroulé « après fusion », `.claude/kit/deroules/apres-fusion.md`)
- PR `MERGED` ; statut Vercel `success` sur le commit de fusion.
- `node outils/capture.mjs https://<domaine>/etat --largeurs=390` : code 0, et l'image montre
  « Base de données connectée » (pastille verte).
- `migrations` : 0001 appliquée ; `main` local à jour.
Preuve : « PR #n fusionnée ; /etat en ligne OK ; migration 0001 appliquée ».
