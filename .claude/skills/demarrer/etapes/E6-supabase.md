# E6 — Supabase : la base de données et les comptes

Pourquoi (une phrase) : Supabase stocke les données de l'application et gère la connexion de ses
utilisateurs. Détails des écrans : `.claude/kit/supabase.md`.

Ce que fait l'utilisateur : **créer son compte** et **un jeton d'accès**, le coller une fois dans
`.env.local`. Tout le reste (projet, région Paris, clés, réglages) est fait par Claude.

## 1. Le compte (environ 2 minutes)
Guider clic par clic, en attendant « fait » à chaque point :
1. Ouvrir https://supabase.com/dashboard/sign-up → **Continue with GitHub** (pas de nouveau mot de
   passe) → **Authorize supabase**.
2. Si Supabase propose de créer une **organisation** : nom libre (ex. son prénom), type **Personal**,
   offre **Free** → **Create organization**. Si Supabase propose ensuite de créer un projet : **ne pas
   le faire** (fermer ou revenir au tableau de bord) — Claude s'en charge.

## 2. Le jeton d'accès → `.env.local`
Claude copie d'abord `.env.example` en `.env.local` (sans y écrire de valeur), puis guide :
1. Dans Supabase, avatar en haut à droite → **Account preferences** → **Access Tokens** →
   **Generate new token**.
2. Nom : le nom de l'application. Si une durée de validité est proposée, choisir la plus longue (la
   noter : elle ira dans `docs/INFRA.md`). → **Generate token**.
3. **Copier** le jeton (`sbp_…`, il ne sera plus jamais affiché).
4. Dans VS Code, ouvrir le fichier `.env.local` (explorateur à gauche), le coller après
   `SUPABASE_ACCESS_TOKEN=` (sans espace), puis **enregistrer** (Ctrl+S / Cmd+S).
Rappeler : ne jamais coller ce jeton dans la conversation (sinon le supprimer et en créer un autre).

Vérifier sans l'afficher :
```
node outils/verifier-env.mjs --etape=jeton-supabase --en-ligne
```

## 3. Claude crée le projet
```
node outils/supabase.mjs organisations
node outils/supabase.mjs creer-projet --nom="<nom de l'application>"
```
- Région **Paris** (`eu-west-3`) par défaut ; plusieurs organisations : ajouter
  `--organisation=<identifiant>` (demander laquelle).
- L'outil crée le projet, attend qu'il soit prêt (1 à 3 minutes), puis écrit dans `.env.local`
  l'adresse du projet, la clé publique, la clé secrète et un mot de passe de base généré — **sans rien
  afficher**. Expliquer à l'utilisateur ce qui se passe pendant l'attente.
- Refus « limite de projets gratuits » : expliquer (2 projets actifs maximum) et proposer de mettre en
  pause un ancien projet dans le tableau de bord, puis relancer.
- Projet déjà créé à la main par l'utilisateur : ne pas en créer un second ; mettre son adresse
  (`https://<ref>.supabase.co`, visible dans le tableau de bord) avec
  `node outils/supabase.mjs recuperer-cles --ref=<ref>`.

## 4. Fermer les inscriptions publiques
Personne ne doit pouvoir se créer un compte seul :
```
node outils/supabase.mjs reglages-auth --fermer-inscriptions
node outils/supabase.mjs reglages-auth --lire
```

## Vérification
```
node outils/verifier-env.mjs --etape=supabase --en-ligne
node outils/supabase.mjs projet
```
- Clés acceptées par Supabase ; projet `ACTIVE_HEALTHY`, région `eu-west-3`.
- `reglages-auth --lire` : « Inscriptions publiques : FERMÉES ».
Noter `infos.supabase_ref` et `infos.region`. Compléter `docs/INFRA.md` (référence du projet, région,
date d'expiration du jeton — **aucune** clé).
Preuve : « projet <ref> (eu-west-3) actif ; clés valides ; inscriptions fermées ».
