# Supabase — fiche de référence

Supabase fournit la **base de données** (PostgreSQL), la **connexion des utilisateurs** (Auth), le
**stockage de fichiers** (Storage) et l'API par laquelle l'application lit et écrit. Les écrans du
tableau de bord changent de temps en temps : si un libellé ne correspond plus, chercher l'équivalent
le plus proche et le décrire à l'utilisateur, sans improviser une autre méthode.

## Compte et organisation (l'utilisateur)
- https://supabase.com/dashboard/sign-up → **Continue with GitHub** (aucun mot de passe de plus).
- Organisation : nom libre, type **Personal**, offre **Free**. **Ne pas** créer de projet à la main :
  Claude le crée avec l'outil.

## Le jeton d'accès (l'utilisateur) — la seule valeur qu'il colle
avatar → **Account preferences** → **Access Tokens** → **Generate new token** → copier le `sbp_…`
(affiché une seule fois) → le coller après `SUPABASE_ACCESS_TOKEN=` dans `.env.local` → enregistrer.
- Il pilote **tous** les projets du compte : outils locaux uniquement, jamais dans Vercel ni la
  conversation. Date d'expiration proposée : la plus longue, notée dans `docs/INFRA.md`.

## Le projet et les clés (Claude, par l'outil)
```
node outils/supabase.mjs creer-projet --nom="<nom de l'application>"
```
- Crée le projet dans l'organisation (une seule : choisie d'office ; plusieurs : `--organisation=`),
  région **Paris** (`eu-west-3` : données en France, proche de Vercel `cdg1`), avec un mot de passe de
  base fort généré par l'outil ; attend qu'il soit prêt ; écrit dans `.env.local` :
  | Variable | Nature |
  |---|---|
  | `NEXT_PUBLIC_SUPABASE_URL` | adresse du projet, `https://<ref>.supabase.co` |
  | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…` : publique, protégée par la RLS |
  | `SUPABASE_SECRET_KEY` | `sb_secret_…` : **contourne la RLS**, serveur uniquement |
  | `SUPABASE_DB_PASSWORD` | mot de passe de la base (inutile aux outils ; à garder) |
- Refuse de créer un doublon (même nom) ou un second projet si `.env.local` en relie déjà un.
- Relire les clés (projet existant, nouvel ordinateur) : `node outils/supabase.mjs recuperer-cles
  [--ref=<ref>]`. Mode `--essai` : n'écrit rien, indique seulement ce qui a été trouvé.
- Les anciennes clés `anon` / `service_role` (`eyJ…`, « Legacy ») ne sont **pas** utilisées.
- Clé divulguée : la **régénérer** dans Project Settings → API Keys (ou supprimer le jeton et en créer
  un autre), puis `recuperer-cles` et `node outils/vercel.mjs variables` + `deployer`.
- Vérification sans affichage : `node outils/verifier-env.mjs --etape=supabase --en-ligne`.

## Les autres commandes de l'outil (API de gestion, `https://api.supabase.com/v1`)
- `node outils/supabase.mjs projet` : nom, région, état du projet (`ACTIVE_HEALTHY`, en pause…).
- `node outils/supabase.mjs migrations` : migrations du dossier `supabase/migrations/`, appliquées ou en
  attente (table de suivi `supabase_migrations.schema_migrations`, la même que celle de la CLI).
- `node outils/supabase.mjs migrer [--essai]` : applique les migrations en attente, une par une, chacune
  en « tout ou rien » ; `--essai` exécute puis **annule**.
- `node outils/supabase.mjs reglages-auth --lire | --fermer-inscriptions | --site-url=… --redirections=…`.
- `node outils/tester-sql.mjs <test.sql> [--migration=…]` : test dans un bloc **annulé**.
Aucun de ces outils n'affiche une clé.

## Authentification
- **Inscriptions fermées** (`disable_signup`) dès le démarrage : les comptes sont créés par un
  administrateur (`outils/creer-admin.mjs` pour le premier, puis un écran d'administration).
- **Site URL** et **Redirect URLs** : l'adresse en ligne et `http://localhost:3000/**` (réglées à l'étape
  E7) — utilisées par les liens envoyés par e-mail (mot de passe oublié, invitation).
- **E-mails** : le service d'envoi intégré de Supabase est très limité (quelques e-mails par heure) et
  réservé aux essais. Dès que l'application enverra des e-mails à de vrais utilisateurs, prévoir une
  évolution « envoi d'e-mails » avec un fournisseur SMTP.
- Le **rôle** d'un compte se range dans `app_metadata` (modifiable uniquement côté serveur).

## Droits et règles d'accès (rappels utiles au dépannage)
- Une nouvelle table n'est **pas** accessible par l'API tant que la migration ne lui donne pas de
  droits (`grant …`) : erreur `42501 permission denied for table …`.
- La RLS filtre **en silence** : une lecture interdite renvoie une liste vide, une mise à jour interdite
  modifie 0 ligne **sans erreur**.
- Toute modification de structure passe par une migration (`.claude/rules/30-migrations.md`) ; le
  **SQL Editor** du tableau de bord sert seulement à **lire**.

## Offre gratuite (Free) — à rappeler à l'utilisateur
- **2 projets actifs** au maximum par compte.
- **Mise en pause après une semaine sans activité** (e-mail d'avertissement avant) : l'application
  en ligne ne répond plus. Relance : tableau de bord → projet → **Restore project** (quelques minutes),
  puis `node outils/supabase.mjs projet`.
- Pas de sauvegarde automatique récupérable (vérifié par l'API : liste vide ; planification réservée
  aux offres payantes) : pour des données importantes, passer à l'offre **Pro**.
- La limite des projets gratuits se constate à la création (« 2 project limit ») : mettre en pause un
  projet inutilisé (tableau de bord, ou décision de l'utilisateur), puis recommencer.

## Sauvegardes du kit (`outils/sauvegarde.mjs`)
Avant toute suppression de données (retour arrière, ménage) :
```
node outils/sauvegarde.mjs creer --tables=t1,t2 --colonnes=table.colonne --motif="…"
node outils/sauvegarde.mjs verifier .kit/sauvegardes/<date>
node outils/sauvegarde.mjs restaurer .kit/sauvegardes/<date> --element=table   (avec accord)
node outils/sauvegarde.mjs liste
```
- **Ciblée** : seulement les tables / colonnes concernées (plafond 50 000 lignes ou 20 Mo par élément).
- **Vérifiée** : empreinte des fichiers, puis essai de restauration dans un bloc annulé, dont
  l'empreinte doit être identique à la base actuelle (toute donnée modifiée depuis = à refaire).
- **Restaurable** : identifiants d'origine conservés, compteurs remis à jour ; refus si la table
  contient déjà des lignes (jamais d'écrasement).
- **Données réelles** : dossier `.kit/sauvegardes/` sur l'ordinateur uniquement (ignoré par Git).
- Les sauvegardes de l'offre Pro restaurent **toute** la base à une date donnée (tout ce qui a suivi
  est perdu) : utiles en cas de catastrophe, pas pour annuler une seule évolution.
- Quotas (taille de base, stockage, utilisateurs) : page **Usage** de l'organisation ; limites à jour
  sur https://supabase.com/pricing.

## Interdits
- Réinitialiser la base, supprimer le projet, modifier une table « à la main » dans le tableau de bord.
- Mettre la clé secrète ou le jeton d'accès ailleurs que dans `.env.local` (et la clé secrète dans
  Vercel, type **Secret**).
