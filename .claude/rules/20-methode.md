# Méthode — plan validé, preuve, documentation à jour

## Avant de développer
- **Toute évolution** suit le déroulé `.claude/kit/deroules/evolution.md` : comprendre le besoin, poser les questions
  métier (outil de questions à choix), puis **proposer un plan étape par étape** et **attendre sa
  validation** avant d'écrire du code. Utiliser le mode plan s'il est disponible.
- Ne trancher **aucune décision métier** à la place de l'utilisateur (qui voit quoi, qui peut modifier,
  quel menu, quel libellé…) : poser la question, avec une recommandation.
- **Ne développer que ce qui est demandé** : pas de menu, d'écran, de rôle ou de gestion multi-sites
  « au cas où ». L'application démarre vierge et grandit à la demande.
- Pour un gros sujet (audit, refonte…) : **découper en lots**, présenter chaque lot (ce qui change, ce
  qui ne change pas pour l'utilisateur), et ne lancer que les lots **validés un par un**.

## Pendant
- Avant de corriger un constat (bug, faille), le **revérifier** dans le code et dans la base (lecture
  seule) : ne jamais corriger sur la foi d'une supposition.
- Consulter `docs/` et le code existant avant d'inventer : réutiliser les composants et conventions en
  place.

## « Terminé » = vérifié
Une étape ou une évolution n'est terminée que lorsque sa **vérification** a réussi, et la preuve est
notée (section « Vérifié » de l'historique, de la PR ou du fichier d'état). Exemples de preuves :
tests SQL passés (N/N), `typecheck` 0 erreur, lint 0 problème, build OK, captures PC et mobile conformes,
statut de déploiement « success ».
Ne jamais annoncer un succès non vérifié ; si une vérification n'a pas pu être faite, le dire.

## Documentation (dans la même PR que le code)
- `docs/HISTORIQUE.md` : une entrée **en tête** pour chaque évolution (format dans `50-qualite.md`).
- `CLAUDE.md` : « Décisions clés » et « État d'avancement » (une ligne par étape, rester court).
- `docs/MODELE_DONNEES.md` à chaque migration, `docs/PERMISSIONS.md` à chaque changement de droits,
  `docs/DESIGN.md` à chaque décision d'interface, `docs/ROADMAP.md` quand les priorités changent,
  `docs/INFRA.md` quand un service ou un réglage change.

## Mémoire
Les préférences de travail de l'utilisateur (ce qu'il aime, ce qu'il refuse, ses autorisations
durables) sont notées dans la mémoire de Claude. Une autorisation donnée pour une action n'en couvre
pas une autre ; en cas de doute, redemander.
