# CLAUDE.md — {{NOM_APP}}

> Contexte permanent du projet, lu au début de chaque conversation. Garder à jour et **court**
> (moins de 200 lignes) : le détail va dans `docs/`.

## Démarrage du projet (section retirée à la fin du démarrage)
Ce projet a été créé avec **Kit-Appli**. Tant que le fichier `.kit/etat.json` n'existe pas ou
n'indique pas `"termine": true`, **au début de chaque conversation**, proposer à l'utilisateur de lancer
ou de reprendre le démarrage guidé en tapant `/demarrer` — et ne rien développer d'autre avant.

## En une phrase
{{UNE_PHRASE}}

## Pour qui
{{POUR_QUI}}

## Stack
- **Next.js** (App Router, dossier `src/`) + **TypeScript** + **Tailwind CSS v4**
- **Supabase** : PostgreSQL + Auth + RLS + Storage
- **Vercel** : mise en ligne automatique à chaque fusion sur `main`
- **GitHub** : code, demandes de modification (PR)

## Règles de travail (chargées automatiquement)
`.claude/rules/` : pédagogie, workflow Git, méthode, migrations, sécurité, qualité, interface.
Elles s'appliquent à **chaque** demande. Charte et mise en page : `.claude/kit/interface/`
(`charte.md` + `maquette.html`, modèle de style à consulter avant tout écran).

## Où trouver quoi
- `docs/CONTEXTE.md` — besoin, utilisateurs, règles métier.
- `docs/ROADMAP.md` — prochaines évolutions, dans l'ordre.
- `docs/HISTORIQUE.md` — journal de tout ce qui a été livré (une entrée par évolution).
- `docs/MODELE_DONNEES.md` — tables, règles d'accès, migrations.
- `docs/PERMISSIONS.md` — qui peut faire quoi.
- `docs/DESIGN.md` — charte de l'application et décisions d'interface.
- `docs/INFRA.md` — dépôt, base, hébergement (aucun secret).
- `docs/POSTE-DEV.md` — installer un autre ordinateur.
- `docs/PLAN_DE_TEST.md` — recette : ce qu'on vérifie sur l'application en ligne.
- `supabase/migrations/` — schéma de la base, versionné ; `supabase/tests/` — tests SQL.
- `outils/` — outils du kit (Node, sans dépendance) : `verifier-env`, `supabase` (migrations, réglages
  d'authentification, création du projet), `vercel` (variables, mise en ligne), `tester-sql`,
  `capture` (captures PC / téléphone), `creer-admin`.
- `.claude/kit/` — fiches de référence (GitHub, Supabase, Vercel, Next.js, captures, dépannage,
  versions) et `deroules/` (évolution, après fusion, faire le point, audit, changer d'ordinateur, tests SQL).

## Comment l'utilisateur demande
Aucune commande à retenir (sauf `/demarrer` au tout début) : il demande normalement, et le déroulé
adapté s'applique (`.claude/rules/15-deroules.md`). Toujours **la même conversation**.

## Décisions clés
- Application **vierge** au départ : menus, écrans et rôles sont créés uniquement à la demande de
  l'utilisateur, une évolution à la fois.

## État d'avancement
- ⏳ Démarrage en cours (`/demarrer`).
