# Infrastructure — où vit l'application

> **Aucun secret ici** (ni clé, ni mot de passe, ni jeton) : seulement où sont les choses. Les valeurs
> secrètes sont dans `.env.local` (sur l'ordinateur) et dans les variables de Vercel.
> Complété au fil du démarrage (étapes E3 à E7), puis à chaque changement d'infrastructure.

## GitHub — le code
- Compte : (étape E3)
- Dépôt : (étape E5) — **privé**
- Branche en ligne : `main` ; commits directs refusés par un hook local (`.claude/kit/github.md` § Hook)

## Supabase — les données
- Projet : (référence, étape E6) — région : (étape E6) — offre : Free
- Inscriptions publiques : (étape E6)
- Adresse du site et redirections autorisées : (étape E7)
- Jeton d'accès des outils du kit : créé le (date) — expire le (date, ou « jamais »)
- Mot de passe de la base : généré à la création, rangé dans `.env.local` (`SUPABASE_DB_PASSWORD`)

## Vercel — la mise en ligne
- Projet : (étape E7) — adresse : (étape E7)
- Offre : (étape E7 : Hobby ou Pro) — région des fonctions : `cdg1` (Paris, fichier `vercel.json`)
- Variables (saisies par `node outils/vercel.mjs variables`) : `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` (type **sensible**), `NEXT_PUBLIC_SITE_URL`
- Jeton Vercel des outils du kit : créé le (date) — expire le (date)

## Coûts et limites
- Supabase Free : 2 projets actifs, mise en pause après une semaine sans activité, pas de sauvegarde
  récupérable.
- Vercel Hobby : usage personnel et non commercial uniquement.

## Rappels
- (ex. renouveler le jeton Supabase avant le …, passer à l'offre Pro avant l'ouverture aux clients…)
