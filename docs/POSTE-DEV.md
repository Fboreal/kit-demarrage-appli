# Travailler depuis un autre ordinateur

> Le code voyage par GitHub ; les réglages secrets (`.env.local`) ne voyagent **jamais** : on les
> recrée. Adresse du dépôt : `docs/INFRA.md`.

## Sur le nouvel ordinateur
1. Installer **VS Code** (https://code.visualstudio.com) et l'extension **Claude Code** (icône
   Extensions → « Claude Code », éditeur Anthropic), puis se connecter avec son compte Claude (Pro au
   minimum).
2. Installer **Git** : Windows → https://git-scm.com/download/win (options par défaut) ; Mac → taper
   `xcode-select --install` dans le Terminal.
3. Dans un terminal, depuis le dossier des projets (**hors** OneDrive / iCloud) :
   ```
   git clone https://github.com/<login>/<depot>.git
   ```
   Git ouvre le navigateur pour se connecter à GitHub : accepter. Garder le **même nom de dossier**.
4. Ouvrir ce dossier dans VS Code, accepter les dialogues de confiance, puis écrire à
   Claude **« je change d'ordinateur »** : il installe le reste (Node.js, GitHub CLI), vous fait
   créer deux jetons neufs à coller dans `.env.local` (il récupère lui-même les clés), réinstalle la protection de `main`,
   redépose sa mémoire et vérifie que le code, la base et la mise en ligne sont alignés.

## Règles
- Ne jamais transférer `.env.local` (e-mail, clé USB, nuage, messagerie) : le recréer.
- Travailler sur **un seul ordinateur à la fois**. Avant de changer, demander à Claude de faire le point pour vérifier que
  tout est envoyé (aucun travail non enregistré, aucune branche non poussée).
- Démarrage pas encore terminé : `/demarrer` sur le nouvel ordinateur reconstruit l'état en revérifiant
  chaque étape.
