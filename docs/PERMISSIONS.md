# Permissions — qui peut faire quoi

> Mis à jour dans la PR de chaque évolution qui touche aux droits (`.claude/rules/40-securite.md`).

## État actuel
L'application n'a **pas encore de connexion** et n'affiche aucune donnée.

## Principes (appliqués dès la première évolution concernée)
- **Aucune inscription libre** (réglage posé au démarrage) : un administrateur crée les comptes.
- Visiteur non connecté : aucun accès aux données.
- Le rôle d'un compte est rangé dans `app_metadata` (modifiable seulement côté serveur).
- Un compte désactivé est bloqué partout.
- Chaque droit est vérifié par la base (RLS), pas seulement par l'écran, et testé avec au moins deux
  comptes (et deux périmètres s'il y en a).

## Rôles
Aucun pour l'instant. (Quand une évolution en crée : nom, pour qui, ce qu'il voit, ce qu'il modifie.)

## Matrice des droits
| Action | (rôle) | (rôle) |
|---|---|---|
| — | — | — |

## Exceptions publiques (accessibles sans connexion)
| Objet | Pourquoi | Depuis |
|---|---|---|
| — | — | — |
