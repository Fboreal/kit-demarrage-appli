#!/usr/bin/env node
// Vérifie .env.local SANS AFFICHER LES VALEURS : présence, format, inversions dangereuses, et
// (option --en-ligne) validité réelle auprès de Supabase.
//
//   node outils/verifier-env.mjs                        vérifie tout
//   node outils/verifier-env.mjs --etape=jeton-supabase seulement le jeton collé par l'utilisateur (E6)
//   node outils/verifier-env.mjs --etape=supabase       adresse, clés et jeton Supabase
//   node outils/verifier-env.mjs --etape=vercel         jeton Vercel (E7)
//   node outils/verifier-env.mjs --en-ligne             teste aussi les clés et jetons en ligne
//   node outils/verifier-env.mjs --fichier=chemin/.env.local
import { ErreurKit, lancer, lireEnv, refProjet, expliquerErreurReseau } from "./_env.mjs";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  }),
);

const VARIABLES = [
  {
    nom: "NEXT_PUBLIC_SUPABASE_URL",
    groupes: ["supabase", "app"],
    controle: (v) => (refProjet(v) ? null : "doit ressembler à https://xxxxxxxxxxxxxxxxxxxx.supabase.co"),
    montrer: (v) => `projet ${refProjet(v)}`, // la référence n'est pas un secret
  },
  {
    nom: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    groupes: ["supabase", "app"],
    controle: (v) =>
      v.startsWith("sb_secret_")
        ? "DANGER : c'est la clé SECRÈTE. Ici, il faut la clé « Publishable » (sb_publishable_…)."
        : v.startsWith("eyJ")
          ? "ancienne clé (« anon »). Prenez la nouvelle clé « Publishable » (sb_publishable_…), onglet API Keys."
          : v.startsWith("sb_publishable_") && v.length > 30
            ? null
            : "doit commencer par sb_publishable_",
  },
  {
    nom: "SUPABASE_SECRET_KEY",
    groupes: ["supabase", "app"],
    controle: (v) =>
      v.startsWith("sb_publishable_")
        ? "c'est la clé publique. Ici, il faut une clé « Secret » (sb_secret_…)."
        : v.startsWith("eyJ")
          ? "ancienne clé (« service_role »). Prenez une clé « Secret » (sb_secret_…), onglet API Keys."
          : v.startsWith("sb_secret_") && v.length > 30
            ? null
            : "doit commencer par sb_secret_",
  },
  {
    nom: "NEXT_PUBLIC_SITE_URL",
    groupes: ["app"],
    controle: (v) => (/^https?:\/\/[^\s/]+/.test(v) ? null : "doit être une adresse (http://localhost:3000 ou https://…)"),
    montrer: (v) => v, // adresse publique
  },
  {
    nom: "SUPABASE_ACCESS_TOKEN",
    groupes: ["supabase", "jeton-supabase"],
    controle: (v) =>
      v.startsWith("sbp_") && v.length >= 40
        ? null
        : "doit commencer par sbp_ (Supabase > avatar > Account preferences > Access Tokens)",
  },
  {
    nom: "VERCEL_TOKEN",
    groupes: ["vercel"],
    controle: (v) =>
      /^[A-Za-z0-9_-]{20,}$/.test(v) ? null : "jeton incomplet ou mal recopié (Vercel > Account Settings > Tokens)",
  },
];

lancer(async () => {
  const env = lireEnv(args.fichier || ".env.local");
  const etape = args.etape || "tout";
  const cibles = VARIABLES.filter((v) => etape === "tout" || v.groupes.includes(etape));
  if (!cibles.length) throw new ErreurKit(`Étape inconnue : ${etape} (jeton-supabase, supabase, vercel, app ou tout).`);

  let erreurs = 0;
  console.log(`Vérification de ${args.fichier || ".env.local"} (aucune valeur secrète n'est affichée)\n`);
  for (const v of cibles) {
    const valeur = (env[v.nom] ?? "").trim();
    if (!valeur) {
      console.log(`  ✗ ${v.nom} : absente ou vide`);
      erreurs++;
      continue;
    }
    const probleme = v.controle(valeur);
    if (probleme) {
      console.log(`  ✗ ${v.nom} : ${probleme}`);
      erreurs++;
    } else {
      const detail = v.montrer ? v.montrer(valeur) : `${valeur.length} caractères`;
      console.log(`  ✓ ${v.nom} (${detail})`);
    }
  }

  if (args["en-ligne"] && erreurs === 0) {
    console.log("\nTest en ligne…");
    const noms = new Set(cibles.map((v) => v.nom));
    erreurs += await testerEnLigne(Object.fromEntries(Object.entries(env).filter(([k]) => noms.has(k))));
  }

  console.log(erreurs === 0 ? "\n✓ Tout est correct." : `\n✗ ${erreurs} point(s) à corriger dans .env.local.`);
  process.exit(erreurs === 0 ? 0 : 1);
});

async function testerEnLigne(env) {
  let erreurs = 0;
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const ref = refProjet(env.NEXT_PUBLIC_SUPABASE_URL);
  const essai = async (libelle, faire) => {
    try {
      const r = await faire();
      if (r.ok) console.log(`  ✓ ${libelle} : valide (testé en ligne)`);
      else {
        console.log(`  ✗ ${libelle} : refusée (${r.statut}) — ${r.conseil ?? "relancez : node outils/supabase.mjs recuperer-cles"}`);
        erreurs++;
      }
    } catch (e) {
      console.log(`  ✗ ${libelle} : ${expliquerErreurReseau(e)}`);
      erreurs++;
    }
  };

  if (env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    await essai("clé publique", async () => {
      const r = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY } });
      return { ok: r.ok, statut: r.status };
    });
  }
  if (env.SUPABASE_SECRET_KEY) {
    await essai("clé secrète", async () => {
      const r = await fetch(`${url}/auth/v1/admin/users?per_page=1`, {
        headers: { apikey: env.SUPABASE_SECRET_KEY, Authorization: `Bearer ${env.SUPABASE_SECRET_KEY}` },
      });
      return { ok: r.ok, statut: r.status };
    });
  }
  if (env.SUPABASE_ACCESS_TOKEN && !ref) {
    await essai("jeton Supabase", async () => {
      const r = await fetch("https://api.supabase.com/v1/organizations", {
        headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}` },
      });
      return { ok: r.ok, statut: r.status, conseil: "créez un nouveau jeton et recollez-le dans .env.local" };
    });
  }
  if (env.VERCEL_TOKEN) {
    await essai("jeton Vercel", async () => {
      const r = await fetch("https://api.vercel.com/v2/user", { headers: { Authorization: `Bearer ${env.VERCEL_TOKEN}` } });
      return { ok: r.ok, statut: r.status, conseil: "créez un nouveau jeton et recollez-le dans .env.local" };
    });
  }
  if (env.SUPABASE_ACCESS_TOKEN && ref) {
    try {
      const r = await fetch(`https://api.supabase.com/v1/projects/${ref}`, {
        headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}` },
      });
      if (!r.ok) {
        console.log(`  ✗ jeton d'accès refusé pour ce projet (${r.status})`);
        erreurs++;
      } else {
        const p = await r.json();
        console.log(`  ✓ jeton d'accès accepté — projet « ${p.name} », région ${p.region}, état ${p.status}`);
        if (p.status && p.status !== "ACTIVE_HEALTHY") {
          console.log("    ⚠ Le projet n'est pas actif (en pause ?) : relancez-le depuis le tableau de bord Supabase.");
        }
      }
    } catch (e) {
      console.log(`  ✗ jeton d'accès : ${expliquerErreurReseau(e)}`);
      erreurs++;
    }
  }
  return erreurs;
}
