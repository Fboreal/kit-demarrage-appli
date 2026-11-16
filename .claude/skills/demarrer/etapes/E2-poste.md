# E2 — Installer les outils sur l'ordinateur

Objectif : Git (historique du code), Node.js (fait tourner l'application), GitHub CLI (`gh`, pour créer
le dépôt et les demandes de modification). Versions minimales et testées : `.claude/kit/VERSIONS.md`.

## 1. Ce qui est déjà là
```
git --version
node --version
npm --version
gh --version
```
Noter ce qui manque ou est trop ancien (Node.js en dessous de 22.15 : à mettre à jour avec la même
commande d'installation). Vérifier aussi qu'un navigateur pour les captures est présent : Edge sous
Windows (toujours là) ; sur Mac, Google Chrome ou Edge dans `/Applications` — sinon faire installer
Chrome depuis https://www.google.com/chrome. Si tout est conforme, passer au point 4.

## 2. Installer ce qui manque
### Windows
Claude peut lancer ces commandes (une fenêtre Windows peut demander l'autorisation : dire à
l'utilisateur de cliquer **Oui**) :
```
winget install --id Git.Git -e --accept-package-agreements --accept-source-agreements
winget install --id OpenJS.NodeJS.LTS -e --accept-package-agreements --accept-source-agreements
winget install --id GitHub.cli -e --accept-package-agreements --accept-source-agreements
```
Si `winget` est introuvable : faire installer **App Installer** depuis le Microsoft Store, ou installer
à la main depuis git-scm.com, nodejs.org (bouton « LTS ») et cli.github.com.

### Mac
L'utilisateur tape dans le terminal (menu Terminal → Nouveau terminal), une commande à la fois :
1. `xcode-select --install` (outils de base d'Apple, dont Git) → cliquer « Installer ».
2. Homebrew : copier la commande d'installation affichée sur https://brew.sh (demande le mot de passe
   du Mac, qui ne s'affiche pas quand on le tape — c'est normal), puis suivre les 2 lignes « Next
   steps » qu'elle affiche.
3. `brew install gh`
4. Node.js : télécharger l'installateur **LTS** sur https://nodejs.org et l'ouvrir.

## 3. Redémarrer VS Code
Les nouveaux outils ne sont visibles qu'après redémarrage. Marquer l'étape `attente_redemarrage`, puis
demander à l'utilisateur de **fermer complètement VS Code** (toutes les fenêtres), de le rouvrir sur
le même dossier et de retaper `/demarrer`.

## 4. Connexion Internet sécurisée (antivirus)
```
npm ping
```
- Réponse `PONG` : parfait.
- Erreur contenant `CERT`, `UNABLE_TO_VERIFY` ou `SELF_SIGNED` : un antivirus (Avast, Kaspersky, ESET…)
  intercepte les connexions sécurisées. Appliquer `.claude/kit/depannage.md` § « Antivirus »
  (option `--use-system-ca` de Node.js : réglage durable du poste, à expliquer et faire accepter),
  refaire redémarrer VS Code, puis relancer `npm ping`.

## Vérification
- `git --version`, `node --version`, `gh --version` : versions au moins égales aux minimales de
  `VERSIONS.md`.
- `npm ping` répond.
Preuve : « git x.y, node x.y, gh x.y ; npm ping OK ».
