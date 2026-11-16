# GitHub — fiche de référence

GitHub garde le code et son historique, et sert de lieu de validation : chaque évolution y arrive sous
forme de **PR** (demande de modification) que l'utilisateur relit et fusionne. Vercel met en ligne ce
qui est fusionné dans `main`.

## Compte
- Inscription : https://github.com/signup — e-mail, mot de passe solide, nom d'utilisateur (il
  apparaît dans l'adresse des dépôts : choisir sobre), vérification, code reçu par e-mail.
- Offre **Free** : dépôts privés illimités ; suffisant pour le kit.
- **Double authentification** : avatar → **Settings** → **Password and authentication** → **Enable
  two-factor authentication**. Application d'authentification conseillée ; **télécharger les codes de
  secours** et les ranger avec les mots de passe. GitHub peut l'imposer quelques semaines après
  l'inscription.

## Relier l'ordinateur (`gh`)
Lancée **par Claude, en arrière-plan** :
```
gh auth login --web --git-protocol https --hostname github.com
```
Sans terminal interactif, la commande ne pose aucune question (vérifié avec gh 2.93) : elle affiche un
code `XXXX-XXXX` et l'adresse https://github.com/login/device, puis attend l'autorisation. Claude donne
le code et le lien ; l'utilisateur ouvre le lien → saisit le code → **Continue** → **Authorize
github** ; la commande se termine seule. Code expiré : relancer la commande. Puis, côté Claude :
```
gh auth status          # « Logged in to github.com account <login> »
gh auth setup-git       # Git utilisera la connexion de gh pour envoyer le code
gh api user --jq ".login + \" \" + (.id|tostring)"
```
Si `gh` est « introuvable » juste après son installation : VS Code n'a pas été redémarré.

## Identité Git (e-mail des commits)
- Chaque commit porte un nom et un e-mail. Cet e-mail **doit appartenir au compte GitHub**, sinon :
  commits non rattachés au compte, et **Vercel refuse de déployer** (offre Hobby, dépôt privé).
- Adresse recommandée : la **noreply** de GitHub, `<id>+<login>@users.noreply.github.com` (visible aussi
  dans **Settings → Emails**, option « Keep my email addresses private ») : elle masque l'e-mail réel.
- Réglage global (pour tous les projets de l'ordinateur) :
  ```
  git config --global user.name "Prénom Nom"
  git config --global user.email "<id>+<login>@users.noreply.github.com"
  ```
- Contrôle après le premier envoi :
  `gh api repos/<login>/<slug>/commits/main --jq ".author.login"` doit renvoyer le login.

## Dépôt
- Création et premier envoi, en une commande (depuis le dossier du projet, après le premier commit) :
  ```
  gh repo create <slug> --private --source . --remote origin --push
  ```
- Le dépôt reste **privé**. Ne jamais le rendre public sans la demande explicite de l'utilisateur
  (l'historique complet deviendrait lisible par tous).
- Contrôle : `gh repo view --json name,visibility,url` → `"visibility": "PRIVATE"`.

## Hook
GitHub Free ne protège pas les branches d'un dépôt **privé** : rien n'empêche techniquement un commit
direct sur `main`. Ce filet de sécurité **local** le refuse. Contenu exact du fichier
`.git/hooks/pre-commit` (fins de ligne **LF**, texte en ASCII pour s'afficher dans tous les terminaux) :
```sh
#!/bin/sh
# Kit-Appli : refuse tout commit directement sur main (main = la version en ligne).
# Installe par /demarrer (etape E5) ; a reinstaller sur chaque nouvel ordinateur.
branche="$(git symbolic-ref --quiet --short HEAD 2>/dev/null)"
if [ "$branche" = "main" ]; then
  echo ""
  echo "STOP : pas de commit direct sur main (la version en ligne)."
  echo "Pour travailler : git fetch origin, puis git switch -c feat/<sujet> origin/main"
  echo "Une branche et une PR par changement : voir .claude/rules/10-workflow-git.md"
  echo ""
  exit 1
fi
exit 0
```
- Windows : Git pour Windows l'exécute tel quel. Mac : `chmod +x .git/hooks/pre-commit`.
- Test : sur `main`, `git commit --allow-empty -m test` doit afficher « STOP » et **ne créer aucun
  commit** (`git log --oneline -1` inchangé).
- Le dossier `.git/hooks/` n'est pas versionné : le hook est à **réinstaller** après chaque clonage.
- Ne jamais le contourner (`--no-verify` est interdit par les réglages).

## Branches et PR
- Nouvelle branche, toujours depuis la version en ligne fraîche :
  `git fetch origin` puis `git switch -c feat/<sujet> origin/main`.
- Envoi : `git push -u origin feat/<sujet>`.
- PR : `gh pr create --base main --head feat/<sujet> --title "…" --body-file <fichier>` (corps : voir
  `.claude/rules/10-workflow-git.md`).
- Ce que l'utilisateur voit sur la PR : l'onglet **Conversation** (description, commentaire de Vercel
  avec le lien d'**aperçu** après 1 à 2 minutes), l'onglet **Files changed** (les modifications).
- Fusion (par l'utilisateur) : **Merge pull request** → **Confirm merge**. Le bouton **Delete branch**
  qui apparaît ensuite peut être utilisé sans risque.
- Contrôle : `gh pr view <n> --json state,mergedAt,mergeCommit` → `"state": "MERGED"`.
- Statut de mise en ligne d'un commit :
  `gh api repos/<depot>/commits/<sha>/status --jq ".statuses[] | {context, state}"` (contexte
  `Vercel` : `pending`, `success` ou `failure`).

## Problèmes fréquents
| Symptôme | Cause | Solution |
|---|---|---|
| `author.login` vide ou `null` | e-mail Git non rattaché au compte | corriger l'identité (ci-dessus) ; commit déjà envoyé : voir E5 §3 |
| `gh: command not found` | VS Code non redémarré après l'installation | fermer **toutes** les fenêtres de VS Code et le rouvrir |
| `gh auth status` : « not logged in » / jeton expiré | connexion perdue | relancer `gh auth login --web …` (Claude, en arrière-plan) et redonner le code |
| `remote origin already exists` | dépôt déjà relié | `git remote -v` : vérifier l'adresse avant toute autre action |
| `SSL certificate problem` à l'envoi | antivirus qui intercepte (Windows) | `git config --global http.sslBackend schannel` |
| PR « This branch has conflicts » | `main` a avancé sur les mêmes lignes | nouvelle branche depuis `origin/main` ; pour `docs/HISTORIQUE.md`, garder les deux entrées |
