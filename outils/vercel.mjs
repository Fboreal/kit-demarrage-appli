#!/usr/bin/env node
// Pilote le projet Vercel par son API officielle, avec VERCEL_TOKEN de .env.local (jamais affiché).
// Le projet est retrouvé grâce au dépôt GitHub du dossier (git remote « origin »).
//
//   node outils/vercel.mjs projet               nom, adresse en ligne, dernier déploiement
//   node outils/vercel.mjs variables [--essai]  recopie dans Vercel les variables de .env.local :
//        NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (normales),
//        SUPABASE_SECRET_KEY (type « sensible » : illisible une fois enregistrée),
//        NEXT_PUBLIC_SITE_URL (= l'adresse en ligne du projet) — pour Production et Preview.
//        SUPABASE_ACCESS_TOKEN et VERCEL_TOKEN ne sont JAMAIS envoyés.
//   node outils/vercel.mjs deployer             remet en ligne la dernière version de main et attend
//        la fin (une variable ne compte qu'au déploiement suivant)
import { execFileSync } from "node:child_process";
import { ErreurKit, lancer, lireEnv } from "./_env.mjs";

const API = "https://api.vercel.com";
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

lancer(async () => {
  const [commande, ...reste] = process.argv.slice(2);
  const essai = reste.includes("--essai");
  const env = lireEnv(".env.local");
  if (!env.VERCEL_TOKEN) {
    throw new ErreurKit(
      "VERCEL_TOKEN manquant dans .env.local (Vercel > avatar > Account Settings > Tokens > Create), " +
        "ou fichier non enregistré.",
    );
  }
  const ctx = { jeton: env.VERCEL_TOKEN, depot: depotGithub() };
  if (!["projet", "variables", "deployer"].includes(commande)) {
    throw new ErreurKit("Commande inconnue. Possibles : projet, variables [--essai], deployer.");
  }
  ctx.projet = await trouverProjet(ctx);

  if (commande === "projet") return afficherProjet(ctx);
  if (commande === "variables") return envoyerVariables(ctx, env, essai);
  return deployer(ctx);
});

/** « proprietaire/depot » d'après le remote origin. */
function depotGithub() {
  let url;
  try {
    url = execFileSync("git", ["remote", "get-url", "origin"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    throw new ErreurKit("Ce dossier n'est pas relié à un dépôt GitHub (git remote « origin » absent).");
  }
  const m = /github\.com[:/]([^/]+)\/(.+?)(\.git)?$/.exec(url);
  if (!m) throw new ErreurKit(`Dépôt GitHub non reconnu : ${url}`);
  return `${m[1]}/${m[2]}`;
}

async function api(ctx, methode, chemin, corps) {
  const url = new URL(API + chemin);
  if (ctx.equipe) url.searchParams.set("teamId", ctx.equipe);
  const r = await fetch(url, {
    method: methode,
    headers: { Authorization: `Bearer ${ctx.jeton}`, "Content-Type": "application/json" },
    body: corps ? JSON.stringify(corps) : undefined,
  });
  const texte = await r.text();
  let donnees = {};
  try { donnees = texte ? JSON.parse(texte) : {}; } catch { /* réponse non JSON */ }
  if (!r.ok) {
    if (r.status === 401 || r.status === 403) {
      throw new ErreurKit(
        `Vercel refuse le jeton (${r.status}) : jeton expiré, mal recopié, ou créé pour une autre équipe. ` +
          "Créez-en un nouveau (Account Settings > Tokens) et recollez-le dans .env.local.",
      );
    }
    throw new ErreurKit(`Vercel a refusé la demande (${r.status}) : ${String(donnees?.error?.message ?? texte).slice(0, 400)}`);
  }
  return donnees;
}

/** Projet Vercel relié au dépôt : cherché dans l'espace par défaut du compte, puis sans équipe. */
async function trouverProjet(ctx) {
  const { user } = await api(ctx, "GET", "/v2/user");
  const equipes = [...new Set([user?.defaultTeamId, null])];
  for (const equipe of equipes) {
    ctx.equipe = equipe;
    const { projects = [] } = await api(ctx, "GET", `/v10/projects?repoUrl=${encodeURIComponent(`https://github.com/${ctx.depot}`)}`);
    const projet = projects.find((p) => p.link?.type === "github" && `${p.link.org}/${p.link.repo}`.toLowerCase() === ctx.depot.toLowerCase())
      ?? projects[0];
    if (projet) return projet;
  }
  throw new ErreurKit(
    `Aucun projet Vercel relié au dépôt ${ctx.depot}. Importez d'abord le dépôt dans Vercel ` +
      "(Add New… > Project > Import), puis relancez.",
  );
}

async function adresseEnLigne(ctx) {
  const { domains = [] } = await api(ctx, "GET", `/v9/projects/${ctx.projet.id}/domains?production=true`);
  const directs = domains.filter((d) => !d.redirect);
  const domaine = directs.find((d) => !d.name.endsWith(".vercel.app")) ?? directs.find((d) => d.name.endsWith(".vercel.app")) ?? directs[0];
  if (!domaine) throw new ErreurKit("Le projet n'a pas encore d'adresse en ligne : terminez d'abord le premier déploiement.");
  return `https://${domaine.name}`;
}

async function dernierDeploiement(ctx) {
  const { deployments = [] } = await api(ctx, "GET", `/v7/deployments?projectId=${ctx.projet.id}&target=production&limit=1`);
  return deployments[0];
}

async function afficherProjet(ctx) {
  const adresse = await adresseEnLigne(ctx).catch(() => "(pas encore d'adresse)");
  const d = await dernierDeploiement(ctx);
  console.log(`Projet « ${ctx.projet.name} » relié à ${ctx.depot}`);
  console.log(`Adresse en ligne : ${adresse}`);
  console.log(`Dernier déploiement de production : ${d ? `${d.readyState ?? d.state} (${new Date(d.createdAt ?? d.created).toLocaleString("fr-FR")})` : "aucun"}`);
}

async function envoyerVariables(ctx, env, essai) {
  for (const cle of ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_SECRET_KEY"]) {
    if (!env[cle]) throw new ErreurKit(`${cle} manquante dans .env.local (node outils/supabase.mjs recuperer-cles).`);
  }
  const site = await adresseEnLigne(ctx);
  const cibles = ["production", "preview"];
  const variables = [
    { key: "NEXT_PUBLIC_SUPABASE_URL", value: env.NEXT_PUBLIC_SUPABASE_URL, type: "encrypted", target: cibles },
    { key: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", value: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, type: "encrypted", target: cibles },
    { key: "SUPABASE_SECRET_KEY", value: env.SUPABASE_SECRET_KEY, type: "sensitive", target: cibles },
    { key: "NEXT_PUBLIC_SITE_URL", value: site, type: "encrypted", target: cibles },
  ];
  if (essai) {
    console.log(`Essai (rien n'est envoyé) — projet « ${ctx.projet.name} », adresse ${site} :`);
    for (const v of variables) console.log(`  • ${v.key} (${v.type === "sensitive" ? "sensible" : "normale"}, ${v.value.length} caractères)`);
    return;
  }
  await api(ctx, "POST", `/v10/projects/${ctx.projet.id}/env?upsert=true`, variables);
  console.log(`✓ Variables enregistrées dans Vercel (projet « ${ctx.projet.name} ») : ` +
    variables.map((v) => v.key + (v.type === "sensitive" ? " [sensible]" : "")).join(", "));
  console.log(`  NEXT_PUBLIC_SITE_URL = ${site}`);
  console.log("  Elles comptent au prochain déploiement : node outils/vercel.mjs deployer");
}

async function deployer(ctx) {
  const lien = ctx.projet.link;
  if (lien?.type !== "github" || !lien.repoId) throw new ErreurKit("Le projet Vercel n'est pas relié à GitHub.");
  const d = await api(ctx, "POST", "/v13/deployments", {
    name: ctx.projet.name,
    project: ctx.projet.id,
    target: "production",
    gitSource: { type: "github", ref: lien.productionBranch ?? "main", repoId: lien.repoId },
  });
  console.log(`Mise en ligne lancée (${d.id})… 1 à 3 minutes.`);
  const debut = Date.now();
  for (;;) {
    const etat = await api(ctx, "GET", `/v13/deployments/${d.id}`);
    if (etat.readyState === "READY") {
      console.log(`✓ En ligne : ${await adresseEnLigne(ctx)}`);
      return;
    }
    if (["ERROR", "CANCELED"].includes(etat.readyState)) {
      throw new ErreurKit(
        `La mise en ligne a échoué (${etat.readyState}). Journal : Vercel > projet > Deployments > ce déploiement > Build Logs.`,
      );
    }
    if (Date.now() - debut > 10 * 60_000) throw new ErreurKit(`Toujours en cours après 10 minutes (${etat.readyState}).`);
    await pause(5_000);
  }
}
