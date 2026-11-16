# Vercel — fiche de référence

Vercel récupère le code sur GitHub et le met en ligne : **production** à chaque fusion dans `main`,
**aperçu** (adresse provisoire) pour chaque PR. Pas de CLI Vercel : l'utilisateur relie Vercel à GitHub
en quelques clics, Claude fait le reste avec `outils/vercel.mjs` (API officielle, jeton de `.env.local`).

## Compte et offre (l'utilisateur)
- https://vercel.com/signup → **Continue with GitHub** → **Authorize Vercel** : c'est ce qui relie
  le compte Vercel au compte GitHub.
- **Hobby** (gratuit) : usage **personnel et non commercial** uniquement.
- **Pro** (payant, par membre) : obligatoire dès que l'application sert une entreprise, une
  association qui facture ou des clients. Si l'utilisateur démarre en Hobby pour tester un usage
  commercial, le noter dans `docs/INFRA.md` et le lui rappeler avant l'ouverture aux vrais utilisateurs.
- Offre Hobby + dépôt privé : seul le propriétaire du compte peut déclencher des déploiements ; les
  commits doivent porter un e-mail rattaché à son compte GitHub (`github.md` § Identité Git).

## Importer le dépôt (l'utilisateur)
1. « Import Git Repository » (sinon **Add New… → Project**).
2. Dépôt absent de la liste → **Install** / « Adjust GitHub App Permissions » → **Only select
   repositories** → ce dépôt seulement → **Install** / **Save**.
3. **Import**. Framework détecté : **Next.js** ; ne rien modifier, **ne saisir aucune variable** →
   **Deploy**. L'application vierge n'a besoin d'aucune variable pour ce premier déploiement.

## Le jeton (l'utilisateur)
avatar → **Account Settings** → **Tokens** → nom de l'appli, scope = l'espace personnel proposé,
expiration la plus longue (notée dans `docs/INFRA.md`) → **Create** → copier → coller après
`VERCEL_TOKEN=` dans `.env.local` → enregistrer. Vérification : `node outils/verifier-env.mjs
--etape=vercel --en-ligne`.

## Variables d'environnement (Claude, par l'outil)
```
node outils/vercel.mjs projet              # projet relié au dépôt, adresse, dernier déploiement
node outils/vercel.mjs variables --essai   # ce qui serait envoyé (noms, types, longueurs)
node outils/vercel.mjs variables           # envoi (Production + Preview)
node outils/vercel.mjs deployer            # remise en ligne de main, attend READY
```
| Nom | Type | Remarque |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | normal | |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | normal | |
| `SUPABASE_SECRET_KEY` | **sensible** (« Secret » dans l'interface) | illisible une fois enregistrée ; jamais de préfixe `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_SITE_URL` | normal | l'adresse en ligne du projet, calculée par l'outil |
- `SUPABASE_ACCESS_TOKEN` et `VERCEL_TOKEN` **ne vont jamais** dans Vercel (l'outil ne les envoie pas).
- Les valeurs `NEXT_PUBLIC_…` sont **figées au moment du build** : après tout ajout ou changement de
  variable, `node outils/vercel.mjs deployer`.
- L'outil retrouve le projet grâce au dépôt GitHub du dossier ; à défaut, il demande d'importer
  d'abord le dépôt. Jeton refusé : en créer un nouveau.

## Région des fonctions
`vercel.json` à la racine (créé en E4) place le code serveur à Paris, près de la base Supabase
(`eu-west-3`) :
```json
{ "$schema": "https://openapi.vercel.sh/vercel.json", "regions": ["cdg1"] }
```

## Déploiements
- **Production** : chaque commit sur `main` (donc chaque PR fusionnée). Adresse :
  `https://<projet>.vercel.app` (un domaine personnalisé pourra être ajouté par une évolution).
- **Aperçu** : chaque branche poussée / PR ouverte ; Vercel commente la PR avec le lien. Les aperçus
  sont protégés par défaut : il faut être connecté à Vercel pour les ouvrir.
- Statut côté GitHub (sans ouvrir Vercel) :
  `gh api repos/<depot>/commits/<sha>/status --jq ".statuses[] | {context, state}"`.
- Contrôle de l'adresse : une requête HTTP doit renvoyer 200, puis capture à 390 px (`captures.md`).

## Journaux
- **Build Logs** (Deployments → le déploiement → Building) : erreurs de compilation.
- **Logs** (onglet du projet) : erreurs à l'exécution (page « Application error », action serveur en
  échec). Ne jamais recopier dans une conversation une ligne de journal contenant une clé.

## Problèmes fréquents
| Symptôme | Cause probable | Solution |
|---|---|---|
| Déploiement bloqué : auteur du commit sans accès | e-mail Git non rattaché au compte GitHub | `github.md` § Identité Git |
| Build en échec : erreur TypeScript ou ESLint | contrôle oublié avant la PR | corriger dans une nouvelle branche, relancer `npm run typecheck`, `npm run lint`, `npm run build` |
| Page en ligne vide ou erreur, mais OK en local | variable manquante dans Vercel | `node outils/vercel.mjs variables` puis `deployer` |
| Variable modifiée sans effet | pas de redéploiement | `node outils/vercel.mjs deployer` |
| Le dépôt n'apparaît pas à l'import | GitHub App sans accès au dépôt | « Adjust GitHub App Permissions » |
| Application lente au premier affichage | projet Supabase en pause ou démarrage à froid | `node outils/supabase.mjs projet` |
