---
name: audit-par-lots
description: Gros sujets (audit de sécurité, refonte) — constats revérifiés dans le code et la base, corrections découpées en lots présentés puis validés un par un
metadata:
  type: feedback
---

Pour un audit ou une refonte : établir les constats (revérifiés en lecture seule), les classer par gravité, proposer des lots avec, pour chacun, ce qui change et ce qui ne change pas pour l'utilisateur ; n'en lancer qu'un à la fois, après validation explicite.

**Why:** méthode reprise d'une application en production : l'auteur du kit a refusé qu'on lance tout d'un coup et voulait valider chaque lot ; les corrections ne doivent jamais casser l'usage normal.
**How to apply:** déroulé `.claude/kit/deroules/audit-securite.md` ; chaque lot suit le déroulé `evolution.md`, avec des tests « attaque refusée » ET « usage normal identique ». Voir [[plan-avant-developpement]].
