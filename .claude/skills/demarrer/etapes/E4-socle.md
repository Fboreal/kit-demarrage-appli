# E4 — L'application vierge, à vos couleurs

Objectif : une application Next.js **vierge** — en-tête (logo), page d'accueil, écrans techniques —
qui respecte la charte (`.claude/kit/interface/charte.md`, §3 bis « Application vierge »).
**Aucun menu, aucun rôle, aucune gestion de sites.** Code de référence, déjà vérifié :
`.claude/kit/nextjs.md` — l'adapter (nom, phrase, couleurs, logo, prochaines étapes), ne pas
l'improviser.

Dire à l'utilisateur, en une phrase : « Je prépare maintenant votre application sur votre ordinateur ;
cela prend une dizaine de minutes, je vous la montre ensuite. »

## 1. Générer le socle Next.js
create-next-app refuse un dossier qui contient déjà des fichiers : générer dans `.kit/tmp-next`
(le dossier `.kit/` existe depuis E0), avec la commande **exacte** de `.claude/kit/VERSIONS.md` (version
épinglée, toutes les options fournies pour qu'aucune question ne bloque la commande).

## 2. Fusionner dans le projet
Suivre `nextjs.md` § Fusion : copie sans écraser (sauf `CLAUDE.md`, `README.md`, `.gitignore` du kit),
suppression du dossier temporaire, `@AGENTS.md` en fin de `CLAUDE.md`, `package.json` (nom = slug,
script `typecheck`), suppression des fichiers d'exemple, `npm install` puis dépendances Supabase aux
versions de `VERSIONS.md`.

## 3. Appliquer la charte
D'après `nextjs.md` (§ Charte dans le code, § Écrans techniques, § Icônes, § Sécurité) et les choix de
`docs/DESIGN.md` :
- `src/app/globals.css` : jetons de la charte (valeurs exactes de la charte standard, ou formules
  `color-mix()` si couleurs personnalisées), anti-zoom iOS, squelette à reflet.
- `src/app/layout.tsx` : polices, langue `fr`, titre et description de l'appli, couleur de thème.
- `src/components/logo.tsx` (découpage du nom choisi en E1, ou logo fourni) et `en-tete.tsx`.
- `src/app/page.tsx` : accueil vierge (titre, phrase, carte « Votre application est prête » avec les
  prochaines étapes de `docs/ROADMAP.md`). **Aucun menu.**
- `src/app/loading.tsx`, `error.tsx`, `not-found.tsx`.
- `src/app/icon.tsx`, `apple-icon.tsx` (initiales du logo), `manifest.ts`.
- `next.config.ts` : en-têtes de sécurité, `poweredByHeader: false`, règle `turbopack` conservée.
- `vercel.json` : `{ "$schema": "https://openapi.vercel.sh/vercel.json", "regions": ["cdg1"] }`.

## 4. Contrôles
```
npm run typecheck
npm run lint
npm run build
```
Puis lancer l'application en arrière-plan (`npm run start`, après le build) et capturer :
```
node outils/capture.mjs http://localhost:3000/
node outils/capture.mjs http://localhost:3000/nexiste-pas --nom=introuvable --largeurs=390
```
(la seconde doit signaler « statut HTTP 404 » : c'est attendu, on vérifie l'écran « Page introuvable »).
Ouvrir les images et les comparer à la charte (`captures.md` § Grille). Contrôler les en-têtes :
`curl -sI http://localhost:3000/` (sous PowerShell : `curl.exe -sI …`) — présents, et aucun
`X-Powered-By`.
Montrer ensuite le résultat à l'utilisateur : **aperçu sur son propre ordinateur, pas encore sur
Internet** (Vercel n'intervient qu'à l'étape E7). Lui expliquer en une phrase : « l'application tourne
pour l'instant uniquement sur votre ordinateur ; ouvrez http://localhost:3000 dans votre navigateur ».
Sur son téléphone, s'il le souhaite : même Wi-Fi, relancer avec `npm run dev`, puis ouvrir l'adresse de
la ligne « Network » affichée au démarrage.
**Arrêter le serveur** à la fin (`captures.md` § Arrêter le serveur) et vérifier que le port est libre.

## Vérification
- `typecheck` 0 erreur, lint 0 problème, build OK.
- `capture.mjs` sur l'accueil : code 0 aux deux largeurs (statut 200, aucun débordement, aucune erreur
  JavaScript) ; images conformes (en-tête 64 px, logo, couleurs, polices).
- `.kit/tmp-next/` supprimé ; serveur arrêté (port 3000 libre).
Preuve : « typecheck 0, lint 0, build OK ; captures 1280/390 sans anomalie ».
Enchaîner sur E5.
