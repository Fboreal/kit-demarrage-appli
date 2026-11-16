# Reprendre sur un autre ordinateur

**Déclencheur** : le projet vient d'être cloné sur un nouvel ordinateur, ou l'utilisateur dit qu'il
change d'ordinateur ou reprend après une longue pause.

**Ne rien modifier** sur GitHub, Supabase ni Vercel pendant cette procédure : on se met à jour, c'est tout.
Référence : `docs/POSTE-DEV.md`.

## 1. Les outils
Vérifier `git`, `node`, `gh` (versions de `.claude/kit/VERSIONS.md`) ; installer ce qui manque comme à
l'étape E2 du démarrage (`.claude/skills/demarrer/etapes/E2-poste.md`), puis faire redémarrer VS Code.

## 2. Le code
- Si le dossier vient de GitHub (clone) ou existe déjà : `git status`, `git fetch origin`, puis
  `git switch main` et `git pull --ff-only origin main` (s'il n'y a pas de travail local non enregistré —
  sinon le montrer et demander).
- Connexion GitHub : `gh auth status` ; sinon refaire la connexion comme à l'étape E3 §2 et vérifier
  l'identité Git (E3 §3).
- **Réinstaller le hook** qui protège `main` (`.git/hooks/` ne voyage pas avec le code) : contenu et
  test dans `.claude/kit/github.md` § Hook.
- `npm ci`, puis `npm run typecheck` (génère aussi les types de Next sur ce poste).

## 3. Les réglages secrets
`.env.local` ne voyage jamais avec le code : copier `.env.example` en `.env.local`, puis faire créer
et coller par l'utilisateur **deux jetons neufs** — Supabase (comme en E6 §2) et Vercel (comme en E7
§3) — et rien d'autre. Claude récupère ensuite l'adresse et les clés du projet (référence dans
`docs/INFRA.md`) :
```
node outils/supabase.mjs recuperer-cles --ref=<référence du projet>
node outils/verifier-env.mjs --en-ligne
```
Le mot de passe de la base n'est pas récupérable (il est resté dans le `.env.local` du premier
ordinateur) ; les outils n'en ont pas besoin, et il peut être réinitialisé dans Supabase si un jour il
faut.

## 4. Alignement avec la base et la mise en ligne
```
node outils/supabase.mjs projet
node outils/supabase.mjs migrations
gh pr list --state open
```
- Projet en pause : le faire relancer (« Restore » dans Supabase).
- Migrations « en attente » alors que le code est à jour : signaler (une PR non fusionnée ? une
  migration à appliquer après déploiement ?) et demander avant d'agir.
- Migration appliquée mais absente du dossier : le code local n'est pas à jour.

## 5. La mémoire de Claude
Redéposer les fiches de `.claude/skills/demarrer/memoire/` dans le dossier de mémoire de ce poste (comme
à l'étape E0), puis reposer les deux questions de préférences (forme d'adresse, migrations).

## Bilan
« Code à jour (commit …), réglages vérifiés, base alignée (N migrations), aucune PR en attente » —
puis proposer la prochaine évolution de `docs/ROADMAP.md`.
