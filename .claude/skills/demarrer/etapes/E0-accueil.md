# E0 — Accueil, contrôle du dossier, mémoire

## 1. Accueil
Message d'accueil (adapter, sans le réciter mot pour mot) :
> Bonjour ! Je vais vous guider pour créer votre application, étape par étape, jusqu'à sa mise en
> ligne. Comptez 1 h 30 à 2 h ; vous pouvez vous arrêter quand vous voulez : je retiens où nous en
> sommes. Je vous demanderai de temps en temps de cliquer quelque part ou de copier une commande ;
> je vérifierai chaque fois que tout s'est bien passé. On commence ?

Attendre la confirmation.

## 2. Contrôle du dossier
Déterminer le système (Windows / Mac) et le chemin absolu du dossier du projet. Vérifier :

| Contrôle | Si problème |
|---|---|
| Chemin contenant `OneDrive`, `Dropbox`, `Google Drive` ou `Mobile Documents` (iCloud) | Expliquer que la synchronisation verrouille des milliers de petits fichiers et casse l'installation ; demander de déplacer le dossier (ex. `C:\Users\<nom>\Projets\` ou `~/Projets/`), de le rouvrir dans VS Code et de retaper `/demarrer`. Stop. |
| Dossier pas renommé après le téléchargement (`kit-demarrage-appli-main`, `kit-demarrage-appli`…) | Demander le nom de l'application et proposer le nom de dossier correspondant (`gestion-materiel`) : fermer VS Code, renommer, rouvrir, retaper `/demarrer`. Stop. |
| Nom du dossier avec espaces, accents ou majuscules | Proposer un nom simple (`gestion-materiel`) : fermer VS Code, renommer, rouvrir, retaper `/demarrer`. Stop. Ne plus jamais renommer ni déplacer ensuite (la mémoire de Claude est liée au chemin). |
| Dossier `.git` déjà présent **alors que `CLAUDE.md` contient encore `{{`** (kit cloné au lieu de téléchargé) | Montrer `git remote -v`, expliquer et **demander l'accord** avant de supprimer ce `.git` (il contient l'historique du kit, pas celui de l'appli). Si `CLAUDE.md` est déjà rempli, ce `.git` est celui de l'application : ne jamais y toucher. |
| Fichier `.kit/etat.json` déjà présent | Ce n'est pas un premier démarrage : suivre l'algorithme de reprise de `SKILL.md`. |

Créer `.kit/etat.json` (voir `SKILL.md`) avec `infos.os`.

## 3. Mémoire de Claude
Déposer les fiches de `.claude/skills/demarrer/memoire/` dans **ton dossier de mémoire automatique**
(son chemin figure dans tes instructions ; sinon : `~/.claude/projects/<chemin du projet où chaque
caractère non alphanumérique devient « - »>/memory/`, dossier existant qui contient la conversation en
cours). Copier chaque fiche telle quelle, puis `MEMORY.md` (l'index). Ne pas écraser une fiche déjà
présente du même nom : la compléter.

## 4. Autorisations durables et préférences
Avec l'outil de questions à choix :
1. « Pendant les évolutions, puis-je **appliquer moi-même les modifications de la base de données**
   une fois que vous avez validé le plan ? Je les teste toujours avant, sans rien enregistrer. »
   — Oui (recommandé) / Non, demandez-moi à chaque fois.
2. « Préférez-vous que je vous vouvoie ou que je vous tutoie ? »

Noter les réponses dans `.kit/etat.json` (`infos.autorisation_migrations`) et dans la mémoire (fiche
`preferences-utilisateur.md`, avec la date).

## Vérification
- `.kit/etat.json` existe et contient `infos.os`.
- Le dossier de mémoire contient `MEMORY.md` et les fiches (lister les fichiers).
Preuve : « dossier conforme ; mémoire : N fiches ; autorisations notées ».
