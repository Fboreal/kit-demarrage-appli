# Dépannage

Méthode : lire le message d'erreur **en entier**, trouver le cas ci-dessous, expliquer la cause en une
phrase à l'utilisateur, appliquer la solution, puis **refaire la vérification** qui avait échoué. Cas
absent : chercher la cause sans rien casser, ne jamais « forcer » (désactiver une sécurité, supprimer
un dossier, réinitialiser la base), et noter le cas ici une fois résolu (PR de documentation).

## Antivirus
**Symptômes** : `npm ping`, `npm install` ou un outil du kit échoue avec
`UNABLE_TO_VERIFY_LEAF_SIGNATURE` (« unable to verify the first certificate »),
`SELF_SIGNED_CERT_IN_CHAIN` ou `unable to get local issuer certificate` — alors qu'Internet fonctionne
dans le navigateur.

**Cause** : l'antivirus (Avast, AVG, Kaspersky, ESET, Bitdefender…) inspecte les connexions sécurisées
en les signant avec son propre certificat. Il l'a déclaré à Windows (ou macOS), donc le navigateur
l'accepte ; mais Node.js utilise par défaut sa propre liste d'autorités et le refuse.

**Solution** (mesurée le 2026-11-16 avec Avast) : demander à Node.js de faire **aussi** confiance au
magasin de certificats du système, avec l'option `--use-system-ca` (Node.js 22.15 ou plus récent).
Modification durable du poste : l'expliquer et obtenir l'accord de l'utilisateur avant.
- **Windows** : vérifier d'abord qu'aucune valeur n'existe déjà
  (`[Environment]::GetEnvironmentVariable("NODE_OPTIONS","User")` dans PowerShell). Si c'est vide :
  ```
  setx NODE_OPTIONS "--use-system-ca"
  ```
  (S'il y avait déjà une valeur, la conserver et ajouter ` --use-system-ca` à la suite.)
- **Mac** : l'utilisateur tape `echo 'export NODE_OPTIONS="--use-system-ca"' >> ~/.zshrc`.
- Puis **fermer toutes les fenêtres de VS Code**, le rouvrir, et relancer `npm ping` → `PONG`.

**Si l'erreur persiste** : `npm config get cafile` (et `npm config get ca`). Une valeur autre que
`null` / `undefined` est un ancien contournement : ce fichier **remplace** toutes les autorités, et il se
périme dès que l'antivirus régénère son certificat (cas constaté : `npm` en échec alors que Node seul
fonctionnait). Avec l'accord de l'utilisateur : `npm config delete cafile`.

**Ne jamais** : `npm config set strict-ssl false`, `NODE_TLS_REJECT_UNAUTHORIZED=0`, ni exporter un
fichier de certificats « pour dépanner » : ces solutions désactivent la sécurité ou se périment.
Dernier recours, décidé par l'utilisateur : exclure Node.js de l'analyse HTTPS dans les réglages de
l'antivirus (cela réduit sa protection).

**Git** (Windows) : `SSL certificate problem` à l'envoi → `git config --global http.sslBackend schannel`
(Git utilise alors les certificats de Windows). `gh` utilise déjà ceux du système.

## Le poste
| Symptôme | Cause | Solution |
|---|---|---|
| `git`, `node`, `npm` ou `gh` « introuvable » juste après l'installation | VS Code garde l'ancien chemin de recherche des programmes | fermer **toutes** les fenêtres de VS Code et le rouvrir ; sous Windows, en dernier recours, fermer la session Windows |
| `winget` introuvable | Windows ancien ou Microsoft Store désactivé | installer **App Installer** depuis le Microsoft Store, ou les installateurs officiels (`E2-poste.md`) |
| PowerShell : « l'exécution de scripts est désactivée » (`npm.ps1`) | politique d'exécution de Windows | taper `npm.cmd` au lieu de `npm`, ou (accord de l'utilisateur) `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |
| Installation très lente, fichiers verrouillés, erreurs `EPERM` / `EBUSY` | dossier synchronisé (OneDrive, iCloud, Dropbox…) ou antivirus qui analyse `node_modules` | déplacer le projet hors du dossier synchronisé (`E0-accueil.md`) ; relancer la commande |
| `EADDRINUSE` / l'application démarre sur le port 3001 | un ancien serveur occupe le port | `captures.md` § Arrêter le serveur |
| Fenêtre « Autoriser Node.js » au premier `npm run dev` | pare-feu de Windows | **Autoriser**, réseaux **privés** seulement |
| `Cannot find name 'LayoutProps'` (ou autre type de Next) | types de Next non générés (projet neuf ou cloné) | `npm run typecheck` (lance `next typegen` puis `tsc`) |
| `npm ci` : « lock file out of sync » | `package.json` modifié sans `npm install` | `npm install`, puis committer `package-lock.json` avec la modification |

## Supabase
| Symptôme | Cause | Solution |
|---|---|---|
| Outils : projet `INACTIVE` / `PAUSED`, application en ligne muette | pause automatique après une semaine sans activité (offre gratuite) | tableau de bord → projet → **Restore project**, attendre, puis `node outils/supabase.mjs projet` |
| Création de projet refusée | limite de 2 projets gratuits actifs | mettre en pause ou supprimer un ancien projet (décision de l'utilisateur) |
| Outils : `401` / jeton refusé | jeton d'accès expiré, révoqué ou mal recopié | en générer un nouveau (`supabase.md` § Les clés), le coller dans `.env.local`, `node outils/verifier-env.mjs --en-ligne` |
| `verifier-env` : clés inversées ou ancienne clé `eyJ…` | mauvais champ copié | recopier depuis **API Keys** (`supabase.md`) |
| `42501 permission denied for table …` | la migration n'a pas donné les droits (`grant`) | nouvelle migration avec les droits nécessaires (`30-migrations.md`) |
| Liste vide ou mise à jour sans effet, **sans** erreur | la règle d'accès (RLS) filtre | reproduire avec un test SQL annulé (`deroules/tester-sql.md`) en se mettant à la place de l'utilisateur concerné |
| `function … does not exist` à l'appel d'une fonction | migration pas encore appliquée, ou nom / paramètres différents | `node outils/supabase.mjs migrations` ; vérifier la signature |
| `permission denied for function …` | depuis la migration 0001, une nouvelle fonction n'est exécutable par personne sans `grant execute` explicite (voulu) | nouvelle migration avec `grant execute on function … to authenticated` ; extension ajoutée plus tard (ex. `vector`) : même chose pour ses fonctions si l'erreur les concerne |
| `migrer` refuse une migration « plus ancienne que la dernière appliquée » | numéro réutilisé ou branche partie d'un `main` ancien | renuméroter **la migration non appliquée** au numéro suivant (jamais une appliquée) |
| Aucun e-mail reçu (mot de passe oublié…) | service d'e-mails intégré très limité ; adresses de redirection non déclarées | `supabase.md` § Authentification ; `reglages-auth --lire` |

## GitHub et Vercel
Voir les tableaux « Problèmes fréquents » de `github.md` et `vercel.md` (identité Git non rattachée,
déploiement bloqué, variables manquantes, conflits).

## Claude Code
| Situation | Explication | Que faire |
|---|---|---|
| Claude demande souvent une autorisation | chaque commande hors de la liste autorisée (`.claude/settings.json`) est soumise à l'utilisateur ; les écritures dans `.claude/` aussi | lire la commande avant d'accepter ; refuser tout ce qui est incompris |
| Commande refusée d'office (pousser sur `main`, fusionner, lire `.env.local`…) | interdite par les réglages de sécurité du projet | c'est voulu : suivre le circuit normal (branche, PR, fusion par l'utilisateur) |
| Limite d'utilisation de Claude atteinte | quota de l'abonnement | reprendre plus tard : `/demarrer` repart de la dernière étape vérifiée |
| Conversation très longue | Claude Code la résume automatiquement | continuer dans la **même** conversation : le fichier d'état, la mémoire et `docs/` gardent les décisions ; en cas de doute, demander à Claude de faire le point |
| Claude ne connaît plus les préférences | nouvel ordinateur ou dossier déplacé (la mémoire est liée au chemin) | dire « je change d'ordinateur » (Claude redépose sa mémoire) |
| `.kit/etat.json` illisible ou absent en cours de démarrage | fichier modifié à la main, ou démarrage poursuivi sur un autre ordinateur | retaper `/demarrer` : l'état est reconstruit en revérifiant chaque étape dans l'ordre (aucune question déjà répondue n'est reposée, sauf les préférences) |
