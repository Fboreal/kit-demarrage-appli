# E5 — Le dépôt GitHub (premier envoi du code)

Pourquoi : le code part en lieu sûr sur GitHub ; c'est aussi de là que Vercel le mettra en ligne.

## 1. Premier commit (le seul fait directement sur `main`)
```
git init -b main
git add -A
git status
```
**Contrôle anti-secret avant de valider** : aucun fichier `.env.local` ni `.env` dans la liste ; aucune
clé (`sb_secret_`, `sbp_`) dans les fichiers ajoutés (rechercher dans l'index). Puis :
```
git commit -m "Démarrage : application vierge et méthode de travail"
```

## 2. Créer le dépôt privé et envoyer le code
Expliquer que le dépôt est **privé** (visible de l'utilisateur seul), puis :
```
gh repo create <slug> --private --source . --remote origin --push
```

## 3. Vérifier l'auteur du commit
```
gh api repos/<login>/<slug>/commits/main --jq ".author.login"
```
Doit renvoyer le login de l'utilisateur. Sinon, l'e-mail Git n'est pas rattaché au compte (Vercel
refuserait de déployer) : corriger l'identité (E3 §3), puis — **seule exception** à la règle, avant
toute mise en ligne et avant le point 4 —
```
git commit --amend --reset-author --no-edit
git push --force-with-lease origin main
```
(La seconde commande est **bloquée pour Claude** par les réglages de sécurité : la faire taper par
l'utilisateur dans le terminal.) Puis revérifier.

## 4. Protéger `main` (filet de sécurité local)
GitHub gratuit ne protège pas les branches d'un dépôt privé : installer le hook local qui refuse tout
commit sur `main` (contenu exact : `.claude/kit/github.md` § Hook) dans `.git/hooks/pre-commit` ; sur
Mac, le rendre exécutable (`chmod +x .git/hooks/pre-commit`). Tester : `git commit --allow-empty -m test`
sur `main` doit être **refusé** (aucun commit créé).

## Vérification
```
gh repo view --json name,visibility,url
git status -sb
```
- `visibility` = `PRIVATE` ; la branche locale est à jour avec `origin/main`.
- Auteur du commit = le login de l'utilisateur ; hook actif (test refusé).
Noter `infos.depot` (`<login>/<slug>`).
Preuve : « dépôt <login>/<slug> PRIVATE ; commit rattaché à <login> ; hook main actif ».
