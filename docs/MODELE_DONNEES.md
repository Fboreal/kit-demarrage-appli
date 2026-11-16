# Modèle de données — {{NOM_APP}}

> Tables, fonctions, règles d'accès et migrations. Mis à jour dans la PR de chaque migration
> (`.claude/rules/30-migrations.md`).

## Principes
- Base PostgreSQL (Supabase), schéma `public` ; noms en français, en `snake_case`.
- Toute modification passe par une migration `supabase/migrations/NNNN_description.sql`, testée
  (test SQL annulé) puis appliquée (`node outils/supabase.mjs migrer`). Jamais de modification « à la
  main » dans le tableau de bord.
- RLS activée sur toutes les tables ; droits accordés explicitement ; rien pour les visiteurs non
  connectés.
- Valeurs calculées (numéros, statuts, auteurs, dates) imposées par la base.

## Pistes (informations évoquées au démarrage — pas encore de tables)
{{PISTES_DONNEES}}

## Tables
Aucune pour l'instant. (Pour chaque table : rôle, colonnes principales, qui lit, qui écrit, migration
d'origine.)

## Fonctions
Aucune pour l'instant.

## Migrations
| N° | Fichier | Objet | Appliquée le |
|---|---|---|---|
| — | — | — | — |
