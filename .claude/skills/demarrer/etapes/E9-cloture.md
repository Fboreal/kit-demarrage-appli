# E9 — Clôture du démarrage

## 1. Bilan
Féliciter brièvement, puis résumer en langage simple :
- l'adresse de l'application en ligne ;
- les trois services et leur rôle (GitHub = le code, Supabase = les données, Vercel = la mise en ligne) ;
- où sont les clés (`.env.local`, à ne jamais partager) ;
- le circuit d'une évolution, tel qu'il vient de le vivre.

## 2. Nettoyage (dans une petite PR `chore/fin-demarrage`, selon le workflow)
- `CLAUDE.md` : **retirer** la section « Démarrage du projet » ; état d'avancement : « ✅ Démarrage —
  application vierge en ligne (<date>) ».
- `README.md` : remplacer le guide du kit par une courte présentation de **l'application** (nom, phrase,
  adresse en ligne, renvoi à `docs/`) — c'est la page d'accueil du dépôt sur GitHub.
- `LICENSE` (licence MIT **du kit**) : le déplacer en `.claude/kit/LICENCE-KIT.txt` (la mention doit
  être conservée avec les fichiers du kit) ; l'application, elle, appartient à l'utilisateur, sans
  licence publique par défaut. Lui dire en une phrase, sans l'inquiéter.
- `docs/HISTORIQUE.md` : vérifier l'entrée `[Démarrage]`.
- `docs/INFRA.md` : complet (dépôt, projet Supabase et région, domaine Vercel et offre, réglages
  d'authentification) — **aucune** clé.
- `.kit/etat.json` : `termine: true` (fichier local, non versionné).
Commit, PR, fusion par l'utilisateur, puis déroulé « après fusion ».

## 3. La suite
Expliquer qu'il n'y a **rien à retenir** : il suffit de demander normalement (« je voudrais… »,
« c'est fusionné », « où en est-on ? », « vérifie la sécurité »…), puis proposer la **première vraie évolution**, adaptée à
`infos.pour_qui` et à `docs/ROADMAP.md`, par exemple :
- **Protéger l'accès** (connexion par e-mail et mot de passe, premier compte créé avec
  `outils/creer-admin.mjs`) — conseillé avant d'enregistrer la moindre donnée réelle ;
- **Créer le premier menu et le premier écran** de la feuille de route (la coque PC / mobile de la
  maquette apparaît alors).
Rappeler : chaque demande d'évolution commence par un plan à valider avant tout code.

## Vérification
- PR de clôture fusionnée ; `CLAUDE.md` sans section « Démarrage » ; `.kit/etat.json` → `termine: true`.
Preuve : « démarrage terminé le <date> ».
