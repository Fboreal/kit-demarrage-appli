# Plan de test — recette de l'application

> Ce qu'on vérifie sur l'application **en ligne** pour s'assurer que rien n'est cassé. Chaque évolution
> ajoute ses cas, repris de la section « À vérifier après la mise en ligne » de sa PR.

## Comment tester
- Sur ordinateur **et** sur téléphone, sur l'adresse en ligne (`docs/INFRA.md`).
- Quand la connexion existera : avec au moins deux comptes (et deux rôles ou périmètres s'il y en a),
  en vérifiant aussi ce qui doit être **refusé**.
- Noter la date et le résultat. Un échec = une correction `fix/…` demandée à Claude comme une évolution.

## Cas permanents
| # | Scénario | Résultat attendu | Dernière vérification |
|---|---|---|---|
| T1 | Ouvrir l'adresse de l'application sur ordinateur | page d'accueil aux couleurs de l'application | |
| T2 | Même chose sur téléphone | lisible, sans défilement horizontal | |
| T3 | Ouvrir une adresse inexistante (ex. `/nexiste-pas`) | « Page introuvable » et bouton de retour à l'accueil | |
| T4 | Ouvrir `/etat` (à partir de l'étape E8) | « Base de données connectée » | |

## Cas ajoutés par les évolutions
| # | Évolution | Scénario | Résultat attendu | Dernière vérification |
|---|---|---|---|---|
