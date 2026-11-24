# Workflow Git — une branche et une PR par évolution

Le code vit sur GitHub. La branche `main` est la version **en ligne** : tout ce qui y arrive part en
production automatiquement (Vercel). On ne travaille donc **jamais** directement dessus.

## Règles
1. **Chaque évolution** (fonctionnalité, écran, menu, correction, documentation) a sa **branche
   dédiée** : `feat/<sujet-court>` ou `fix/<sujet-court>` (minuscules, tirets, sans accent).
2. **Seule exception** : le tout premier commit d'un dépôt neuf (démarrage, étape E5).
3. **Toujours partir de la dernière version en ligne** : considérer que la PR précédente a été fusionnée.
   ```
   git fetch origin
   git switch -c feat/<sujet> origin/main
   ```
   Jamais depuis un `origin/main` récupéré plus tôt dans la conversation.
4. Juste **avant de pousser**, refaire `git fetch origin` : si `main` a avancé, rebaser
   (`git rebase origin/main`) puis pousser avec `git push --force-with-lease`.
5. **Une PR n'est ouverte que lorsqu'elle est complète** : code, migration testée, documentation,
   historique, fichiers (images…) — tout est commité et contrôlé (`node outils/pr.mjs controler`).
6. **Une PR ouverte est figée** : aucune modification ajoutée après coup. Toute correction, même
   minime, part dans une **nouvelle branche et une nouvelle PR**. Seule exception : si `main` a avancé
   sans conflit, rebaser la branche **sans en changer le contenu**, relancer les contrôles, renvoyer
   (`--force-with-lease`), puis revérifier et redemander l'accord.
7. **Claude fusionne seulement avec l'accord explicite de l'utilisateur, et seulement par
   `node outils/pr.mjs fusionner <n>`** (jamais `gh pr merge`, interdit en direct, ni l'API GitHub).
   L'outil refuse en cas de conflit, de branche en retard, de contrôles absents ou en échec, d'aperçu
   Vercel absent / en échec / en cours, de migration non appliquée, ou si la PR a changé depuis le
   résumé présenté. Claude ne pousse jamais sur `main`.
8. **Conflit sur `docs/HISTORIQUE.md`** (fréquent : chaque PR y ajoute une entrée en tête) : garder
   **les deux entrées**, la plus récente en premier — jamais `--ours` ni `--theirs`.

## Commits
- Messages en français, courts, à l'infinitif ou au nom (« Ajouter la page d'accueil »).
- Avant chaque commit : `git status` ; **aucun** fichier `.env*` (hors `.env.example`) dans l'index,
  aucune clé (`sb_secret_`, `sbp_`, mot de passe) dans le diff.
- Un hook Git local (installé au démarrage) refuse tout commit sur `main` : ne jamais le contourner
  (`--no-verify` interdit).

## Pull Request
Créée avec `gh pr create --base main --head <branche> --title "…" --body-file <fichier>`.
Corps de la PR, en français, pour l'utilisateur :
```
## Objet
(le besoin, en une ou deux phrases)

## Changements
(liste simple de ce qui change pour l'utilisateur)

## Base de données
(migration NNNN : ce qu'elle fait ; appliquée AVANT fusion, ou À APPLIQUER APRÈS DÉPLOIEMENT)

## Vérifié
(tests SQL, tsc, lint, build, captures PC et mobile…)

## À vérifier après la mise en ligne
1. … (recette pas à pas, en langage simple)
```
## Fusion : résumé, accord explicite, puis fusion par Claude
1. `node outils/pr.mjs verifier <n>` (attend l'aperçu Vercel si besoin) : la PR peut-elle être
   fusionnée ? Si non : expliquer simplement pourquoi et corriger selon le cas (jamais de fusion).
2. **Résumé** pour l'utilisateur, en langage simple : ce qui change pour lui, contrôles réussis, base
   de données (migration appliquée, ou à appliquer après la mise en ligne), lien de la PR et lien
   d'**aperçu** Vercel (pour essayer avant la mise en ligne).
3. **Question**, avec l'outil de questions à choix : « Je fusionne et je mets en ligne ? » —
   **Fusionner et mettre en ligne** · **Pas maintenant** · **Je regarde d'abord l'aperçu**.
4. Seule la réponse **Fusionner** (ou une réponse écrite sans ambiguïté, du type « oui, fusionne
   la PR #n ») vaut accord. Alors : `node outils/pr.mjs fusionner <n>`, puis la suite du déroulé
   `.claude/kit/deroules/apres-fusion.md` (mise en ligne, migration différée, recette).

**L'accord** vaut pour **cette PR et ce commit**, une seule fois. Il ne se déduit jamais d'un « ok »,
d'un « continue », d'une validation de plan, d'une autorisation générale ni de l'autorisation durable
des migrations ; il ne se donne pas à l'avance ni pour plusieurs PR. Tout nouveau commit, une réponse
« Pas maintenant », une hésitation ou un silence : **pas de fusion** (la PR attend, `faire-le-point.md`
la signale). Si l'utilisateur fusionne lui-même sur GitHub, il le dit (« c'est fusionné ») et le
déroulé « après fusion » s'applique.

## Vérifier qu'une PR est fusionnée
`gh pr view <n> --json state,mergedAt,mergeCommit` → `state` = `MERGED`.
