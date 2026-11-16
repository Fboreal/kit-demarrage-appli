# Versions testées

Dernier contrôle complet : **2026-11-16** (Windows 11 ; génération + installation + `typecheck` + lint +
build). Une version n'est changée ici qu'après le même contrôle (voir « Changer de version »).

## Outils du poste
| Outil | Minimum | Testé | Remarque |
|---|---|---|---|
| Node.js | **22.15** | 22.16 | E2 installe la **LTS** du moment (26.x en novembre 2026). Minimum imposé par `--use-system-ca` (parade antivirus, `depannage.md`). |
| npm | fourni avec Node | 10.9 | |
| Git | 2.40 | 2.54 | Windows : moteur TLS `schannel` (réglage par défaut de Git pour Windows). |
| GitHub CLI (`gh`) | 2.40 | 2.93 | |
| VS Code | 1.94 | — | avec l'extension **Claude Code**. |
| Navigateur pour les captures | Edge ou Chrome | Edge (Windows) | voir `captures.md`. |

**Non utilisés** (volontairement) : la CLI Supabase (`outils/supabase.mjs` passe par l'API de gestion de
Supabase) et la CLI Vercel (déploiements par l'intégration GitHub de Vercel, variables par
`outils/vercel.mjs` et l'API REST de Vercel).

## Socle de l'application (étape E4)
| Paquet | Version | Remarque |
|---|---|---|
| `create-next-app` / `next` | **16.4.6** (épinglée) | génère aussi `react` 19.3, Tailwind CSS 4.3 (`@tailwindcss/turbopack`), ESLint 9 |
| `@supabase/supabase-js` | 2.119.0 | |
| `@supabase/ssr` | 0.12.7 | |
| `server-only` | 0.0.1 | |

Commande exacte (le dossier `.kit/` doit exister — il est créé à l'étape E0) :
```
npx --yes create-next-app@16.4.6 .kit/tmp-next --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --skip-install --disable-git --agents-md --no-agent-feedback --no-react-compiler --no-cache-components
```
- Chaque option est fournie : la commande ne pose **aucune** question (sinon elle attendrait une réponse
  au clavier et resterait bloquée).
- `--no-cache-components` : sans cette option, create-next-app 16.4.6 active le mode « Cache
  Components » (constaté : « Using defaults for unprovided options »), qui change les règles
  d'affichage des pages ; on garde le fonctionnement classique, plus prévisible. L'activer serait une
  évolution à part entière.
- `--agents-md` : crée `AGENTS.md` (consignes officielles de Next.js pour les assistants), importé par
  `CLAUDE.md`.

## Constats du dernier contrôle
- `tsc --noEmit` échoue sur un projet neuf (`Cannot find name 'LayoutProps'`) tant que Next n'a pas
  généré ses types : d'où le script **`npm run typecheck`** = `next typegen && tsc --noEmit` (E4).
- `npm run build` ne lance pas le lint : `npm run lint` reste nécessaire.
- create-next-app refuse un dossier non vide (d'où `.kit/tmp-next`) et un dossier parent inexistant
  (« The application path is not writable »).
- `next dev` réécrit le bloc de consignes d'`AGENTS.md` : le committer tel quel.
- ESLint 9 est signalé « plus maintenu » à l'installation : avertissement sans effet, la version est
  imposée par `eslint-config-next`.

## Changer de version
1. Dans un dossier d'essai (jamais dans un vrai projet) : générer avec la nouvelle version, `npm install`,
   ajouter les dépendances Supabase, `npx next typegen`, `npx tsc --noEmit`, `npm run lint`,
   `npm run build`.
2. Relire les messages (« Using defaults for unprovided options » signale une **nouvelle question** :
   lui ajouter une option explicite).
3. Mettre à jour ce fichier (versions, commande, constats) et la date du dernier contrôle.
