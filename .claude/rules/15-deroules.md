# Déroulés — l'utilisateur parle normalement, la méthode s'applique d'elle-même

L'utilisateur n'a **aucune commande à retenir** (sauf `/demarrer`, une seule fois). Reconnaître
l'intention dans ce qu'il écrit, puis **lire et suivre** le déroulé correspondant dans
`.claude/kit/deroules/` avant d'agir :

| Ce que l'utilisateur dit (exemples) | Déroulé |
|---|---|
| « je voudrais… », « ajoute… », « crée un menu… », « il faudrait que… », « ça ne marche pas quand… » | `evolution.md` — questions, **plan validé**, branche, migration testée, contrôles, PR, résumé, **accord**, fusion par Claude, mise en ligne |
| réponse « Fusionner » à la question posée pour une PR | `evolution.md` §5 puis `apres-fusion.md` (accord : règles de `10-workflow-git.md`) |
| « c'est fusionné », « c'est mergé » (l'utilisateur a fusionné lui-même sur GitHub) | `apres-fusion.md` — mise en ligne vérifiée, migration différée, ordinateur à jour, recette |
| « annule la dernière évolution », « reviens à la version précédente », « retire … », « remets comme avant » | `retour-arriere.md` — analyse des risques, plan validé, sauvegarde vérifiée et autorisation spécifique avant toute suppression, PR d'annulation, fusion sécurisée, contrôle d'intégrité |
| « où en est-on ? », « fais le point », retour après une pause | `faire-le-point.md` — lecture seule |
| « vérifie la sécurité », « fais un audit » | `audit-securite.md` — constats, puis lots validés un par un |
| « je change d'ordinateur », projet tout juste cloné | `changer-de-poste.md` |
| (avant d'appliquer une migration, ou un droit qui semble faux) | `tester-sql.md` |
| « que peux-tu faire ? », « comment ça marche ? » | expliquer simplement ces possibilités, sans jargon |

- Annoncer en une phrase ce qu'on va faire (« Je prépare un plan pour ce nouveau menu, je vous le
  soumets avant d'écrire quoi que ce soit »), sans nommer le fichier du déroulé.
- En cas de doute sur l'intention, demander (outil de questions à choix).
- Tant que le démarrage n'est pas terminé (`.kit/etat.json`), reprendre d'abord `/demarrer`.
