# E3 — GitHub : compte, connexion, identité

Pourquoi (à dire en une phrase) : GitHub garde le code en sécurité, avec tout son historique, et
permet de relire chaque modification avant sa mise en ligne.

## 1. Le compte (s'il n'en a pas)
Guider pas à pas (détails dans `.claude/kit/github.md`) :
1. Ouvrir https://github.com/signup.
2. Saisir l'e-mail, un mot de passe solide (gestionnaire de mots de passe conseillé), un nom
   d'utilisateur (il apparaîtra dans l'adresse du dépôt) ; résoudre la vérification ; saisir le code
   reçu par e-mail.
3. Choisir l'offre **gratuite** (Free) ; passer les questions facultatives.
4. **Double authentification** (fortement recommandé, parfois imposé par GitHub) : avatar en haut à
   droite → **Settings** → **Password and authentication** → **Enable two-factor authentication** ;
   utiliser une application (Google Authenticator, Microsoft Authenticator…) et **conserver les codes
   de secours** en lieu sûr.
Demander l'e-mail principal du compte GitHub n'est pas nécessaire.

## 2. Relier l'ordinateur à GitHub
C'est **Claude** qui lance la connexion, **en arrière-plan** (la commande attend que l'utilisateur
autorise l'accès dans son navigateur) :
```
gh auth login --web --git-protocol https --hostname github.com
```
Sans terminal interactif, elle ne pose aucune question (vérifié) : elle affiche un code de 8
caractères (`XXXX-XXXX`) et l'adresse https://github.com/login/device, puis attend.
1. Lire le code dans la sortie de la commande et le donner à l'utilisateur, avec le lien.
2. Lui expliquer : ouvrir le lien (connecté à son compte GitHub) → saisir le code → **Continue** →
   **Authorize github**. Le code ne sert qu'une fois et expire au bout de quelques minutes : si c'est
   dépassé, relancer la commande pour en obtenir un nouveau.
3. Attendre que la commande se termine d'elle-même (« Logged in as … »).

Puis Claude :
```
gh auth status
gh auth setup-git
gh api user --jq ".login + \" \" + (.id|tostring)"
```

## 3. Identité Git
Chaque modification est signée d'un nom et d'un e-mail. Utiliser l'adresse **noreply** de GitHub (elle
appartient au compte et masque l'e-mail réel ; Vercel exige que l'e-mail des modifications soit
rattaché au compte GitHub) :
```
git config --global user.name "<Prénom Nom>"
git config --global user.email "<id>+<login>@users.noreply.github.com"
```
(Demander le prénom et le nom à afficher ; `<id>` et `<login>` viennent de `gh api user`.)
Si une identité globale existe déjà, la montrer et demander s'il faut la garder (elle doit être une
adresse vérifiée du compte GitHub).

## Vérification
- `gh auth status` indique « Logged in to github.com ».
- `git config --global user.email` renvoie une adresse rattachée au compte (noreply ou vérifiée).
Noter `infos.github_login` dans `.kit/etat.json`.
Preuve : « connecté en tant que <login> ; identité Git <nom> <e-mail> ».
Enchaîner sur E4.
