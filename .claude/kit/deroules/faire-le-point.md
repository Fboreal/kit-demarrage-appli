# Faire le point

**Déclencheur** : « où en est-on ? », « fais le point », reprise après une pause.

Lecture seule. Lancer, puis résumer en langage simple (une ligne par point, ✓ / ⚠) :

```
git status -sb
git fetch origin
git log --oneline -5 origin/main
gh pr list --state open
gh api repos/<depot>/commits/main/status --jq ".statuses[] | {context, state}"
node outils/supabase.mjs projet
node outils/supabase.mjs migrations
```
(`<depot>` : `docs/INFRA.md`.)

À présenter :
1. **Code** : branche actuelle, travail non enregistré, retard sur la version en ligne.
2. **Demandes de modification** ouvertes (à fusionner ? en conflit ?).
3. **Mise en ligne** : statut du dernier déploiement de `main` ; l'adresse répond-elle ?
4. **Base de données** : projet actif ou en pause ; migrations appliquées / en attente.
5. **Démarrage** : si `.kit/etat.json` n'est pas terminé, l'étape en cours.
6. **Prochaine étape conseillée** (d'après `docs/ROADMAP.md`).
