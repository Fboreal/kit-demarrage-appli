---
name: demarrer
description: Lance ou reprend le démarrage guidé du projet — questions sur l'application, installation des outils, création des comptes GitHub, Supabase et Vercel, application vierge mise en ligne, premier cycle de développement.
disable-model-invocation: true
---

# /demarrer — démarrage guidé du projet

Tu accompagnes un **débutant complet** de zéro jusqu'à son application **en ligne**. Applique à la
lettre `.claude/rules/00-pedagogie.md` : une action à la fois, dire où cliquer, vérifier après chaque
action, jamais de secret dans la conversation.

## Fichier d'état : `.kit/etat.json` (reprise)
Le démarrage dure 1 h 30 à 2 h, **dans une seule et même conversation** (si VS Code est fermé,
l'utilisateur rouvre cette conversation et écrit « on continue »). Le fichier `.kit/etat.json`
(ignoré par Git, **aucun secret**) dit où on en est. Format :
```json
{
  "format": 1,
  "kit_version": "1.0.0",
  "termine": false,
  "etape_courante": "E0",
  "etapes": {
    "E0": { "statut": "fait", "le": "2026-11-16T09:12:00Z", "preuve": "mémoire déposée (9 fiches)" }
  },
  "infos": {
    "os": "windows",
    "nom_app": "Gestion Matériel",
    "slug": "gestion-materiel",
    "pour_qui": "mon équipe",
    "couleurs": { "principale": "#3e4c8a", "accent1": "#ff9a76", "accent2": "#ff6f91", "standard": true },
    "usage_commercial": false,
    "autorisation_migrations": true,
    "github_login": "",
    "depot": "",
    "supabase_ref": "",
    "region": "",
    "vercel_domaine": ""
  }
}
```
Statuts possibles d'une étape : `a_faire`, `en_cours`, `attente_utilisateur`, `attente_redemarrage`,
`fait`, `bloque` (avec un champ `motif`).

## Algorithme (à chaque `/demarrer`)
1. Lire `.kit/etat.json`. S'il n'existe pas (ou est illisible) :
   - projet **neuf** (`CLAUDE.md` contient encore `{{`) : le créer avec `E0` à faire ;
   - projet **déjà avancé** (fichier supprimé, ou démarrage poursuivi sur un autre ordinateur :
     `.kit/` ne voyage pas avec Git) : le **reconstruire** — exécuter dans l'ordre la section
     « Vérification » de chaque étape, cocher `fait` celles qui passent (preuve « reconstruit : … »),
     reprendre à la première qui échoue. Pour E0, redéposer la mémoire et reposer les deux questions
     de préférences ; pour E1, des documents sans `{{` suffisent (le résumé avait été validé) ;
     retrouver les `infos` dans `docs/INFRA.md` et `docs/DESIGN.md`.
2. Si `termine` vaut `true` : le dire, rappeler qu'il suffit de demander normalement ce qu'on veut
   (`.claude/rules/15-deroules.md`), s'arrêter.
3. **Revérifier la dernière étape faite** (sa section « Vérification ») : si elle ne passe plus
   (compte déconnecté, outil désinstallé, projet en pause…), la reprendre avant d'aller plus loin.
4. Annoncer brièvement où on en est (« Nous en sommes à l'étape 4 sur 9 : … »).
5. Lire le fichier de l'étape courante dans `etapes/` (ce dossier) et l'exécuter, sous-étape par
   sous-étape. Mettre `statut` à jour au fil de l'eau (`attente_utilisateur` quand on attend l'utilisateur).
6. Une étape n'est `fait` **qu'après** la réussite de sa vérification ; noter la **preuve** (résumé
   de la sortie de la vérification, sans secret) et l'heure, puis passer `etape_courante` à la suivante
   et **enchaîner** dans la même conversation (jamais de proposition d'en ouvrir une nouvelle).

## Les étapes
| Étape | Fichier | Contenu |
|---|---|---|
| E0 | `etapes/E0-accueil.md` | accueil, contrôle du dossier, mémoire, autorisations |
| E1 | `etapes/E1-application.md` | questions sur l'application, remplissage des documents |
| E2 | `etapes/E2-poste.md` | installation de Git, Node.js, GitHub CLI |
| E3 | `etapes/E3-github.md` | compte GitHub, connexion, identité Git |
| E4 | `etapes/E4-socle.md` | application vierge Next.js aux couleurs de l'appli |
| E5 | `etapes/E5-depot.md` | premier commit, dépôt GitHub privé, protection de `main` |
| E6 | `etapes/E6-supabase.md` | compte Supabase, jeton ; Claude crée le projet et récupère les clés |
| E7 | `etapes/E7-vercel.md` | compte Vercel relié à GitHub, import, jeton ; Claude saisit les variables |
| E8 | `etapes/E8-premier-cycle.md` | 1re évolution complète : branche, migration, PR, fusion, déploiement |
| E9 | `etapes/E9-cloture.md` | bilan, nettoyage, première vraie évolution |

## Rappels
- Fichiers de référence : `.claude/kit/` (github.md, supabase.md, vercel.md, nextjs.md, captures.md,
  depannage.md, VERSIONS.md, interface/, deroules/).
- Ne **jamais** sauter une vérification, même si l'utilisateur dit que « c'est bon ».
- En cas de blocage non prévu : consulter `.claude/kit/depannage.md`, expliquer simplement, proposer de
  reprendre plus tard ; marquer l'étape `bloque` avec le motif.
