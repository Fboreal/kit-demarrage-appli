# E7 — Vercel : la mise en ligne

Pourquoi (une phrase) : Vercel prend le code sur GitHub et le publie sur Internet, **automatiquement**
à chaque modification validée. Détails des écrans : `.claude/kit/vercel.md`.

Ce que fait l'utilisateur : **créer son compte avec GitHub**, **importer son dépôt** (c'est ce qui relie
Vercel à GitHub), puis **créer un jeton** et le coller dans `.env.local`. Claude saisit les variables
et vérifie la mise en ligne.

## 1. Le compte, relié à GitHub (environ 2 minutes)
Guider clic par clic, en attendant « fait » à chaque point :
1. Ouvrir https://vercel.com/signup.
2. Type d'usage : **Hobby** (personnel, gratuit) — ou **Pro** si `infos.usage_commercial` vaut `true`
   et que l'utilisateur est prêt à payer (sinon Hobby pour tester, et le noter dans `docs/INFRA.md`).
   Saisir un nom (son prénom).
3. **Continue with GitHub** → **Authorize Vercel**. Le compte Vercel est désormais lié au compte GitHub.

## 2. Importer le dépôt
1. Vercel affiche « Import Git Repository » (sinon : **Add New…** → **Project**).
2. Si le dépôt n'apparaît pas : **Install** (ou « Adjust GitHub App Permissions ») → GitHub demande
   quels dépôts Vercel peut voir → **Only select repositories** → choisir **uniquement** le dépôt de
   l'application → **Install** / **Save**.
3. Cliquer **Import** à côté du dépôt. Framework détecté : **Next.js**. **Ne rien remplir** (pas de
   variable : Claude s'en charge) → **Deploy**.
4. Attendre « Congratulations » (1 à 3 minutes) : l'application vierge est en ligne.
   Échec du déploiement : Vercel > le déploiement > **Build Logs** ; cause la plus fréquente : e-mail
   Git non rattaché au compte (`github.md` § Identité Git).

## 3. Le jeton Vercel → `.env.local`
1. Avatar en haut à droite → **Account Settings** → **Tokens**.
2. Nom : le nom de l'application ; **Scope** : l'espace personnel proposé ; **Expiration** : la plus
   longue proposée (la noter pour `docs/INFRA.md`) → **Create** → **Copy**.
3. Le coller dans `.env.local` après `VERCEL_TOKEN=`, puis **enregistrer**.
Ne jamais le coller dans la conversation.

## 4. Claude saisit les variables et remet en ligne
```
node outils/vercel.mjs projet
node outils/vercel.mjs variables --essai
node outils/vercel.mjs variables
node outils/vercel.mjs deployer
```
- `variables` envoie l'adresse et la clé publique Supabase, la clé secrète (type **sensible** :
  illisible une fois enregistrée) et `NEXT_PUBLIC_SITE_URL` = l'adresse en ligne. Le jeton Supabase et
  le jeton Vercel ne sont **jamais** envoyés.
- `deployer` relance la mise en ligne (une variable ne compte qu'au déploiement suivant) et attend la fin.
Puis déclarer l'adresse du site à Supabase (liens envoyés par e-mail) :
```
node outils/supabase.mjs reglages-auth --site-url=https://<domaine> --redirections="http://localhost:3000/**,https://<domaine>/**"
node outils/supabase.mjs reglages-auth --lire
```

## Vérification
- `node outils/vercel.mjs projet` : dernier déploiement de production `READY`.
- `node outils/capture.mjs https://<domaine>/ --largeurs=390` : code 0 (statut 200, aucun
  débordement) et l'image montre la page d'accueil. Donner l'adresse à l'utilisateur pour qu'il
  l'ouvre sur son ordinateur **et son téléphone**.
- Réglages Supabase : adresse du site et redirections correctes.
Noter `infos.vercel_domaine` ; compléter `docs/INFRA.md` (projet, adresse, offre, région des fonctions,
expiration du jeton).
Preuve : « https://<domaine> en ligne (200) ; variables enregistrées ; site déclaré à Supabase ».
