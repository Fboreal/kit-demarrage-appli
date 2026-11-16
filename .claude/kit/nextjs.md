# Next.js — fiche de référence (socle de l'étape E4 et suites)

Les fichiers complets de cette fiche ont été **compilés, vérifiés (typecheck, lint, build) et
capturés** avec les versions de `VERSIONS.md` ; les extraits marqués « … » sont à compléter. Next.js change vite : avant d'écrire du code, lire le guide concerné dans
`node_modules/next/dist/docs/` (consigne d'`AGENTS.md`) — exemple vécu : en 16.4, l'écran d'erreur
reçoit `retry` et non plus `reset`.

## Générer
Commande exacte : `VERSIONS.md`. Elle crée `.kit/tmp-next/` (le dossier `.kit/` existe depuis E0) :
`AGENTS.md`, `README.md`, `.gitignore`, `eslint.config.mjs`, `next.config.ts`, `next-env.d.ts`,
`package.json`, `tsconfig.json`, `public/*.svg`, `src/app/` (`favicon.ico`, `globals.css`,
`layout.tsx`, `page.tsx`). Tailwind est branché par `@tailwindcss/turbopack` dans `next.config.ts`
(pas de `postcss.config.mjs`).

## Fusion
1. Copier dans le projet tout ce qui a été généré, **sauf** `README.md`, `.gitignore` (ceux du kit
   restent) et `CLAUDE.md` s'il existe ; refuser d'écraser un fichier existant :
   ```
   node -e "const fs=require('fs');const exclus=new Set(['CLAUDE.md','README.md','.gitignore']);for(const n of fs.readdirSync('.kit/tmp-next'))if(!exclus.has(n))fs.cpSync('.kit/tmp-next/'+n,n,{recursive:true,force:false,errorOnExist:true})"
   ```
2. Supprimer le dossier temporaire : `node -e "require('fs').rmSync('.kit/tmp-next',{recursive:true,force:true})"`.
3. `CLAUDE.md` du kit : ajouter `@AGENTS.md` sur la dernière ligne (s'il n'y est pas).
4. `package.json` : `"name"` = le slug ; ajouter le script
   `"typecheck": "next typegen && tsc --noEmit"` (sur un projet neuf ou fraîchement cloné, `tsc` seul
   échoue tant que Next n'a pas généré ses types).
5. Supprimer `public/*.svg` et `src/app/favicon.ico` (remplacés par les icônes ci-dessous).
6. Installer : `npm install`, puis
   `npm install @supabase/supabase-js@2.119.0 @supabase/ssr@0.12.7 server-only@0.0.1`.
7. `AGENTS.md` : le committer tel quel (`next dev` réécrit son bloc de consignes).

## Organisation des fichiers
```
src/
├── app/                 pages (une page = un dossier avec page.tsx), loading.tsx, error.tsx
├── components/          composants réutilisés (logo, en-tête, puis boutons, cartes…)
└── lib/
    └── supabase/        accès à la base : server.ts (E8), admin.ts et proxy.ts (plus tard)
```
Noms de fichiers en minuscules avec tirets (`en-tete.tsx`), composants en `PascalCase`, textes en
français. Quand la première rubrique arrivera, les pages de l'application iront dans un groupe
`src/app/(app)/` avec le gabarit de la coque (charte §3).

## Charte dans le code
### `src/app/globals.css`
```css
@import "tailwindcss";

/* Charte de l'application (.claude/kit/interface/charte.md §2) — charte standard.
   Couleurs personnalisées : remplacer primaire / accent-1 / accent-2, et dériver les autres
   teintes avec les formules color-mix() de la charte. Aucune couleur écrite en dur ailleurs
   que dans ce bloc. */
@theme {
  --color-primaire: #3e4c8a;
  --color-primaire-fonce: #333f73;
  --color-primaire-moyen: #5e70b8;
  --color-primaire-doux: #93a6de;
  --color-primaire-wash: #e4e9fb;
  --color-accent-1: #ff9a76;
  --color-accent-2: #ff6f91;
  --color-fond: #eef0fa;
  --color-panneau: #f7f8fc;
  --color-ligne: #eceef7;
  --color-succes: #7fd9c4;
  --color-encre: #1b2036;
  --color-encre-douce: #4b5468;
  --color-sourdine: #8890a6;

  --color-succes-texte: #1f8a6e;
  --color-succes-fond: #e3f8f3;
  --color-danger-texte: #c1443a;
  --color-danger-fond: #fdeae8;
  --color-danger-bord: #f6cac5;
  --color-attention-texte: #8a6a1f;
  --color-attention-fond: #fdf8ec;
  --color-attention-bord: #f0ddb0;
  --color-champ-bord: #e2e5f2;
  --color-bord-secondaire: #d8def5;
}

/* Polices chargées par next/font dans layout.tsx (variables posées sur <html>). */
@theme inline {
  --font-sans: var(--font-jakarta), ui-sans-serif, system-ui, sans-serif;
  --font-marque: var(--font-fredoka), var(--font-jakarta), ui-sans-serif, sans-serif;
}

body {
  background: var(--color-fond);
  color: var(--color-encre);
  font-family: var(--font-sans);
}

/* Écran tactile : champs à 16 px minimum, sinon iOS zoome pendant la saisie. */
@media (pointer: coarse) {
  input,
  select,
  textarea {
    font-size: 16px;
  }
}

/* Squelette de chargement à reflet animé (charte §7). */
.squelette {
  border-radius: 10px;
  background: linear-gradient(90deg, #e4e7f2 25%, #f1f3fa 37%, #e4e7f2 63%);
  background-size: 400% 100%;
  animation: reflet 1.4s ease infinite;
}
@keyframes reflet {
  from {
    background-position: 100% 50%;
  }
  to {
    background-position: 0 50%;
  }
}
@media (prefers-reduced-motion: reduce) {
  .squelette {
    animation: none;
  }
}
```
Classes obtenues : `bg-primaire`, `text-encre`, `border-ligne`, `from-accent-1`, `font-marque`…
Couleurs personnalisées : garder les **noms**, changer les valeurs (`--color-primaire-fonce:
color-mix(in oklab, var(--color-primaire) 82%, black);` etc.). Le mode sombre du modèle de
create-next-app est retiré : la charte n'en a pas. Ne jamais masquer un débordement par
`overflow-x: hidden` sur `body` : corriger l'élément fautif (signalé par `outils/capture.mjs`).

### `src/app/layout.tsx`
```tsx
import type { Metadata, Viewport } from "next";
import { Fredoka, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"], display: "swap" });
const fredoka = Fredoka({ variable: "--font-fredoka", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "Matériothèque", template: "%s · Matériothèque" },
  description: "Gérer le matériel de l'équipe.",
};

export const viewport: Viewport = {
  themeColor: "#3e4c8a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${jakarta.variable} ${fredoka.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
```
(Nom, phrase et couleur principale : ceux de `CLAUDE.md` et `docs/DESIGN.md`.)

### `src/components/logo.tsx` et `src/components/en-tete.tsx`
```tsx
/** Logo texte à deux tons (charte §2) : 1re partie en couleur principale, 2de en dégradé d'accent. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`font-marque text-[22px] leading-none font-semibold tracking-tight ${className}`}>
      <span className="text-primaire">Matério</span>
      <span className="bg-linear-to-r from-accent-1 to-accent-2 bg-clip-text text-transparent">thèque</span>
    </span>
  );
}
```
```tsx
import Link from "next/link";
import { Logo } from "@/components/logo";

/** En-tête de 64 px (charte §3) — application vierge : le logo seul. */
export function EnTete() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b border-ligne bg-white px-4 lg:px-7">
      <Link href="/" aria-label="Accueil">
        <Logo />
      </Link>
    </header>
  );
}
```
Logo fourni par l'utilisateur : `public/logo.svg` (ou `.png`) affiché avec `next/image` dans `Logo`,
hauteur 28 à 32 px, texte alternatif = nom de l'application.

### `src/app/page.tsx` (accueil de l'application vierge)
```tsx
import { EnTete } from "@/components/en-tete";

const prochainesEtapes = [
  "Protéger l'accès par une connexion",
  "Créer le premier menu",
  "Suivre le matériel prêté",
];

export default function Accueil() {
  return (
    <>
      <EnTete />
      <main className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-8 lg:px-8">
        <div>
          <h1 className="text-[22px] font-extrabold text-encre md:text-[26px]">Matériothèque</h1>
          <p className="mt-1 text-[13px] text-sourdine">Gérer le matériel de l&apos;équipe.</p>
        </div>
        <section className="rounded-2xl border border-ligne bg-white p-5">
          <h2 className="text-[15px] font-bold text-encre">Votre application est prête</h2>
          <p className="mt-1 text-[13.5px] text-encre-douce">Prochaines étapes prévues :</p>
          <ol className="mt-3 flex flex-col gap-2">
            {prochainesEtapes.map((etape, i) => (
              <li key={etape} className="flex items-center gap-3 text-[14px] text-encre-douce">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primaire-wash text-[12px] font-bold text-primaire">
                  {i + 1}
                </span>
                {etape}
              </li>
            ))}
          </ol>
        </section>
      </main>
    </>
  );
}
```
(Les étapes viennent de `docs/ROADMAP.md`. Le lien « État de l'application » vers `/etat` est ajouté
à l'étape E8, avec la page.)

## Écrans techniques
### `src/app/loading.tsx`
```tsx
/** Chargement : squelettes à reflet animé (charte §7). */
export default function Chargement() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-8 lg:px-8" aria-busy="true" aria-label="Chargement">
      <div className="squelette h-7 w-56" />
      <div className="squelette h-4 w-80 max-w-full" />
      <div className="squelette h-40 w-full" />
    </div>
  );
}
```
### `src/app/error.tsx`
```tsx
"use client"; // Un écran d'erreur est un composant client (exigence de Next.js).

import { useEffect } from "react";

/** Erreur inattendue : message simple et bouton « Réessayer » (charte §7). */
export default function Erreur({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error); // le détail technique reste dans la console, jamais à l'écran
  }, [error]);

  return (
    <main className="mx-auto max-w-xl px-4 py-12 text-center">
      <h1 className="text-[22px] font-extrabold text-encre">Un problème est survenu</h1>
      <p className="mt-2 text-[14px] text-encre-douce">
        Rien n&apos;a été perdu. Vous pouvez réessayer ; si le problème continue, revenez plus tard.
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className="mt-6 rounded-xl bg-linear-to-r from-accent-1 to-accent-2 px-5 py-2.5 text-[14px] font-bold text-white shadow-[0_4px_14px_color-mix(in_oklab,var(--color-accent-2)_35%,transparent)]"
      >
        Réessayer
      </button>
    </main>
  );
}
```
### `src/app/not-found.tsx`
```tsx
import Link from "next/link";

/** Page introuvable : explication et retour à l'accueil. */
export default function Introuvable() {
  return (
    <main className="mx-auto max-w-xl px-4 py-12 text-center">
      <h1 className="text-[22px] font-extrabold text-encre">Page introuvable</h1>
      <p className="mt-2 text-[14px] text-encre-douce">
        Cette adresse ne correspond à aucune page de l&apos;application.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-xl border-[1.5px] border-bord-secondaire bg-white px-5 py-2.5 text-[14px] font-semibold text-primaire"
      >
        Retour à l&apos;accueil
      </Link>
    </main>
  );
}
```
Apostrophes dans le texte JSX : écrire `&apos;` (sinon le lint refuse).

## Icônes et installation sur téléphone
Générées par Next au build (aucun fichier image à fournir) : initiales du logo en blanc sur la couleur
principale.
### `src/app/icon.tsx` (onglet + écran d'accueil Android, servies sur `/icon/192` et `/icon/512`)
```tsx
import { ImageResponse } from "next/og";

// Icône de l'application : initiales en blanc sur la couleur principale, en deux tailles.
export function generateImageMetadata() {
  return [192, 512].map((taille) => ({
    id: String(taille),
    size: { width: taille, height: taille },
    contentType: "image/png",
  }));
}

export default async function Icon({ id }: { id: Promise<string | number> }) {
  const taille = Number(await id);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#3e4c8a",
          color: "#ffffff",
          fontSize: taille * 0.42,
          fontWeight: 700,
        }}
      >
        Mt
      </div>
    ),
    { width: taille, height: taille },
  );
}
```
### `src/app/apple-icon.tsx` (iPhone / iPad)
```tsx
import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Icône de l'écran d'accueil iPhone / iPad.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#3e4c8a",
          color: "#ffffff",
          fontSize: 76,
          fontWeight: 700,
        }}
      >
        Mt
      </div>
    ),
    size,
  );
}
```
### `src/app/manifest.ts`
```ts
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Matériothèque",
    short_name: "Matériothèque",
    description: "Gérer le matériel de l'équipe.",
    lang: "fr",
    start_url: "/",
    display: "standalone",
    background_color: "#eef0fa",
    theme_color: "#3e4c8a",
    icons: [
      { src: "/icon/192", sizes: "192x192", type: "image/png" },
      { src: "/icon/512", sizes: "512x512", type: "image/png" },
    ],
  };
}
```
(Couleurs = celles de la charte de l'application ; `short_name` : 12 caractères au plus si possible.)

## Sécurité
`next.config.ts` complet — **garder** la règle `turbopack` générée par create-next-app :
```ts
import type { NextConfig } from "next";

const enDev = process.env.NODE_ENV === "development";

// Politique de contenu : en OBSERVATION (Report-Only) — le navigateur signale dans sa
// console ce qu'elle bloquerait, sans rien bloquer. On la rendra bloquante une fois
// vérifiée sur toutes les pages.
const politiqueContenu = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${enDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co",
  "font-src 'self'",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const entetesSecurite = [
  // Personne ne peut afficher l'application dans un cadre d'un autre site.
  { key: "X-Frame-Options", value: "DENY" },
  // Le navigateur ne « devine » jamais le type d'un fichier.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // L'adresse complète des pages ne fuit pas vers les autres sites.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Appareil photo, micro, position : refusés tant qu'une évolution n'en a pas besoin
  // (passer alors à camera=(self), etc.).
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy-Report-Only", value: politiqueContenu },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: entetesSecurite }];
  },
  // Généré par create-next-app (Tailwind CSS) : à conserver.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
```
- Vercel ajoute lui-même l'en-tête HSTS (HTTPS obligatoire) : ne pas le dupliquer.
- Contrôle : `curl -sI http://localhost:3000/` (sous PowerShell : `curl.exe -sI …`) montre les
  en-têtes, et aucun `X-Powered-By`.
- Une photo prise avec `<input type="file" accept="image/*" capture>` ouvre l'appareil photo du
  téléphone **sans** changer `Permissions-Policy` ; seule une caméra filmée dans la page l'exige.

## Supabase dans le code
### `src/lib/supabase/server.ts` (étape E8)
```ts
import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Client Supabase côté serveur (pages, actions serveur, routes) : clé publique
 * + session de l'utilisateur lue dans les cookies. Soumis aux règles d'accès (RLS).
 */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Appel depuis une page : sans effet (une page ne peut pas écrire de cookie).
          }
        },
      },
    },
  );
}
```
Appel type (page `/etat`, dynamique puisqu'elle lit les cookies) — ne **jamais** laisser une panne de
la base faire planter la page :
```tsx
import { createClient } from "@/lib/supabase/server";

type Sante = { ok: boolean; base: string; heure: string };

export default async function PageEtat() {
  let sante: Sante | null = null;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("sante");
    if (error) console.error("sante() en erreur :", error.message);
    else sante = data as Sante;
  } catch (e) {
    console.error("Base injoignable :", e);
  }
  // … carte de la charte : pastille verte « Base de données connectée » (+ heure de la base)
  //   ou rouge « Base de données injoignable »
}
```
Vérifié : sans variables Supabase, la page affiche « injoignable » au lieu de planter.

### `src/lib/supabase/admin.ts` (seulement quand une évolution en a besoin)
```ts
import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Client « administrateur » : clé SECRÈTE, qui contourne toutes les règles d'accès.
 * Uniquement côté serveur, et seulement APRÈS avoir vérifié les droits de l'appelant.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
```

### Connexion des utilisateurs (évolution « Protéger l'accès », pas avant)
- Next 16 : le fichier `src/proxy.ts` (fonction exportée `proxy`) remplace l'ancien `middleware.ts` ;
  il rafraîchit la session Supabase à chaque requête (`src/lib/supabase/proxy.ts`). Suivre le guide
  officiel Supabase « Next.js server-side auth » à jour, et `node_modules/next/dist/docs/`.
- Côté serveur, se fier à `supabase.auth.getClaims()` ou `getUser()`, **jamais** à `getSession()`
  (lue dans un cookie que le navigateur peut modifier).
- Tolérer une panne réseau dans le proxy (try/catch) : la page doit rester accessible.
- Règles de `40-securite.md` : inscriptions fermées, rôle dans `app_metadata`, comptes désactivés
  bloqués partout, messages de connexion génériques.

## Lancer en local
- `npm run dev` (en arrière-plan côté Claude) → http://localhost:3000 ; sur le téléphone (même Wi-Fi) :
  l'adresse « Network » affichée au démarrage. Windows peut demander d'**autoriser Node.js** dans le
  pare-feu : réseaux **privés** seulement.
- Arrêter le serveur : voir `captures.md` § Arrêter le serveur (arrêter la tâche ne suffit pas toujours
  sous Windows).
