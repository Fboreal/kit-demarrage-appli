#!/usr/bin/env node
// Pilote le projet Supabase par son API officielle, avec le jeton de .env.local (jamais affiché).
// Aucune autre installation nécessaire (pas de CLI Supabase).
//
// Seul SUPABASE_ACCESS_TOKEN est collé par l'utilisateur ; le reste est écrit par cet outil :
//   node outils/supabase.mjs organisations          organisations du compte (nom et identifiant)
//   node outils/supabase.mjs creer-projet --nom="Mon appli" [--region=eu-west-3] [--organisation=…] [--essai]
//        crée le projet (région Paris par défaut), attend qu'il soit prêt, écrit dans .env.local
//        l'adresse, les deux clés et le mot de passe de la base — sans rien afficher
//   node outils/supabase.mjs recuperer-cles [--ref=…] [--essai]
//        réécrit l'adresse et les deux clés du projet dans .env.local (--ref : nouvel ordinateur)
//
//   node outils/supabase.mjs projet                 nom, région et état du projet (en pause ?)
//   node outils/supabase.mjs migrations [--json]    migrations du dossier : appliquées ou en attente
//   node outils/supabase.mjs migrer --essai         exécute les migrations en attente PUIS ANNULE TOUT
//   node outils/supabase.mjs migrer                 applique les migrations en attente, dans l'ordre
//   node outils/supabase.mjs reglages-auth --lire
//   node outils/supabase.mjs reglages-auth --fermer-inscriptions --site-url=https://… \
//        --redirections="http://localhost:3000/**,https://mon-appli.vercel.app/**" [--essai]
//
// Les migrations appliquées sont inscrites dans la table de suivi officielle de Supabase
// (supabase_migrations.schema_migrations) : chacune est appliquée UNE fois, dans une transaction
// (tout ou rien), et l'application s'arrête à la première erreur.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { ecrireEnv, ErreurKit, lancer } from "./_env.mjs";
import { api, contexte, options, sql } from "./_supabase.mjs";

const DOSSIER_MIGRATIONS = path.join("supabase", "migrations");
const MOTIF = /^(\d{4})_([a-z0-9_]+)\.sql$/;
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

lancer(async () => {
  const [commande, ...reste] = process.argv.slice(2);
  const o = options(reste);
  const ctx = contexte();
  const env = ctx.env;
  // Nouvel ordinateur : .env.local encore vide, la référence vient de docs/INFRA.md.
  if (commande === "recuperer-cles" && typeof o.ref === "string") {
    if (!/^[a-z0-9]{20}$/.test(o.ref)) throw new ErreurKit("--ref : la référence du projet fait 20 lettres et chiffres.");
    ctx.ref = o.ref;
  }
  const exigerProjet = ctx.exigerProjet;

  switch (commande) {
    case "organisations": return listerOrganisations(ctx);
    case "creer-projet": return creerProjet(ctx, env, o);
    case "recuperer-cles": exigerProjet(); return recupererCles(ctx, Boolean(o.essai));
    case "projet": exigerProjet(); return afficherProjet(ctx);
    case "migrations": exigerProjet(); return listerMigrations(ctx, Boolean(o.json));
    case "migrer": exigerProjet(); return migrer(ctx, Boolean(o.essai));
    case "reglages-auth": exigerProjet(); return reglagesAuth(ctx, o);
    default:
      throw new ErreurKit(
        "Commande inconnue. Possibles : organisations, creer-projet, recuperer-cles, projet, migrations, " +
          "migrer [--essai], reglages-auth.",
      );
  }
});

// ----------------------------------------------------------------------------- création du projet

async function listerOrganisations(ctx) {
  const orgs = await api(ctx, "GET", "/organizations");
  if (!orgs.length) {
    console.log("Aucune organisation : créez-en une dans le tableau de bord Supabase (type Personal, offre Free).");
    return;
  }
  for (const org of orgs) console.log(`  • ${org.name}  (identifiant : ${org.slug})`);
}

async function creerProjet(ctx, env, o) {
  if (ctx.ref) {
    throw new ErreurKit(
      `Un projet est déjà relié (${ctx.ref}). Pour seulement relire ses clés : node outils/supabase.mjs recuperer-cles`,
    );
  }
  const nom = typeof o.nom === "string" ? o.nom.trim() : "";
  if (!nom || nom.length > 60) throw new ErreurKit("Indiquez le nom du projet : --nom=\"Mon appli\" (60 caractères au plus).");
  const region = typeof o.region === "string" ? o.region : "eu-west-3";

  const orgs = await api(ctx, "GET", "/organizations");
  let org;
  if (typeof o.organisation === "string") {
    org = orgs.find((x) => x.slug === o.organisation);
    if (!org) throw new ErreurKit(`Organisation « ${o.organisation} » introuvable (node outils/supabase.mjs organisations).`);
  } else if (orgs.length === 1) {
    org = orgs[0];
  } else if (!orgs.length) {
    throw new ErreurKit("Aucune organisation : créez-en une dans le tableau de bord Supabase (type Personal, offre Free).");
  } else {
    throw new ErreurKit(
      "Plusieurs organisations : précisez --organisation=<identifiant> (liste : node outils/supabase.mjs organisations).",
    );
  }

  const existants = await api(ctx, "GET", "/projects");
  const homonyme = existants.find((p) => p.name === nom && (p.organization_slug ?? p.organization_id) === org.slug);
  if (homonyme) {
    throw new ErreurKit(
      `Un projet « ${nom} » existe déjà (${homonyme.ref ?? homonyme.id}, état ${homonyme.status}). ` +
        "Pour le relier : mettre son adresse https://<ref>.supabase.co dans NEXT_PUBLIC_SUPABASE_URL, puis recuperer-cles.",
    );
  }

  if (o.essai) {
    console.log(`Essai (rien n'est créé) : projet « ${nom} », organisation « ${org.name} », région ${region}.`);
    return;
  }

  // Mot de passe de la base : fort, généré ici, rangé dans .env.local (les outils n'en ont pas besoin).
  const motDePasse = crypto.randomBytes(24).toString("base64url");
  console.log(`Création du projet « ${nom} » (organisation « ${org.name} », région ${region})…`);
  let projet;
  try {
    projet = await api(ctx, "POST", "/projects", {
      name: nom,
      organization_slug: org.slug,
      db_pass: motDePasse,
      region_selection: { type: "specific", code: region },
    });
  } catch (e) {
    if (/limit|maximum|free.*project/i.test(e.message)) {
      throw new ErreurKit(
        `${e.message}\nL'offre gratuite autorise 2 projets actifs : mettez en pause (ou supprimez) un ancien projet, puis recommencez.`,
      );
    }
    throw e;
  }
  const ref = projet.ref ?? projet.id;
  ecrireEnv({ NEXT_PUBLIC_SUPABASE_URL: `https://${ref}.supabase.co`, SUPABASE_DB_PASSWORD: motDePasse });
  ctx.ref = ref;
  console.log(`✓ Projet créé (${ref}) ; adresse et mot de passe de la base écrits dans .env.local.`);

  console.log("Préparation du projet (1 à 3 minutes)…");
  const debut = Date.now();
  for (;;) {
    const p = await api(ctx, "GET", `/projects/${ref}`);
    if (p.status === "ACTIVE_HEALTHY") break;
    if (Date.now() - debut > 10 * 60_000) {
      throw new ErreurKit(`Le projet n'est toujours pas prêt après 10 minutes (état ${p.status}). Relancez : node outils/supabase.mjs recuperer-cles`);
    }
    await pause(10_000);
  }
  console.log("✓ Projet prêt.");
  await recupererCles(ctx, false);
}

async function recupererCles(ctx, essai) {
  let cles = [];
  for (let essaiN = 0; essaiN < 6; essaiN++) {
    cles = await api(ctx, "GET", `/projects/${ctx.ref}/api-keys?reveal=true`);
    if (cles.some((c) => c.type === "publishable") && cles.some((c) => c.type === "secret" && c.api_key)) break;
    await pause(5_000); // les clés d'un projet tout neuf peuvent apparaître avec un léger retard
  }
  const choisir = (type) => {
    const candidates = cles.filter((c) => c.type === type && c.api_key);
    return candidates.find((c) => c.name === "default") ?? candidates[0];
  };
  const publique = choisir("publishable");
  const secrete = choisir("secret");
  if (!publique || !secrete) {
    throw new ErreurKit(
      "Clés introuvables (publishable / secret). Dans Supabase : Project Settings > API Keys, créez-les si besoin, puis relancez.",
    );
  }
  if (!publique.api_key.startsWith("sb_publishable_") || !secrete.api_key.startsWith("sb_secret_")) {
    throw new ErreurKit("Format de clé inattendu : vérifiez la page API Keys du projet.");
  }
  if (essai) {
    console.log(`Essai (rien n'est écrit) : clé publique (${publique.api_key.length} caractères) et clé secrète (${secrete.api_key.length} caractères) trouvées.`);
    return;
  }
  ecrireEnv({
    NEXT_PUBLIC_SUPABASE_URL: `https://${ctx.ref}.supabase.co`,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publique.api_key,
    SUPABASE_SECRET_KEY: secrete.api_key,
  });
  console.log("✓ Adresse, clé publique et clé secrète écrites dans .env.local (non affichées).");
}

async function afficherProjet(ctx) {
  const p = await api(ctx, "GET", `/projects/${ctx.ref}`);
  console.log(`Projet « ${p.name} » (${ctx.ref}) — région ${p.region} — état ${p.status}`);
  if (p.status !== "ACTIVE_HEALTHY") {
    console.log("⚠ Le projet n'est pas actif : s'il est en pause, relancez-le depuis le tableau de bord Supabase (« Restore »).");
  }
}

// ----------------------------------------------------------------------------- migrations

function migrationsLocales() {
  if (!fs.existsSync(DOSSIER_MIGRATIONS)) return [];
  const fichiers = fs.readdirSync(DOSSIER_MIGRATIONS).filter((f) => f.endsWith(".sql")).sort();
  return fichiers.map((f) => {
    const m = MOTIF.exec(f);
    if (!m) {
      throw new ErreurKit(`Nom de migration invalide : ${f}. Format attendu : NNNN_description.sql (4 chiffres, minuscules, _).`);
    }
    return { version: m[1], nom: m[2], fichier: path.join(DOSSIER_MIGRATIONS, f) };
  });
}

async function migrationsAppliquees(ctx) {
  try {
    const lignes = await sql(ctx, "select version, name from supabase_migrations.schema_migrations order by version");
    return new Map(lignes.map((l) => [l.version, l.name]));
  } catch (e) {
    if (/does not exist/i.test(e.message)) return new Map(); // aucune migration encore appliquée
    throw e;
  }
}

async function listerMigrations(ctx, json = false) {
  const locales = migrationsLocales();
  const appliquees = await migrationsAppliquees(ctx);
  if (json) {
    // Sortie lisible par les autres outils (outils/pr.mjs).
    console.log(JSON.stringify({
      migrations: locales.map((m) => ({ version: m.version, nom: m.nom, fichier: m.fichier.replace(/\\/g, "/"), appliquee: appliquees.has(m.version) })),
      inconnues: [...appliquees.keys()].filter((v) => !locales.some((m) => m.version === v)),
    }));
    return;
  }
  if (!locales.length) console.log("Aucune migration dans supabase/migrations.");
  for (const m of locales) {
    console.log(`  ${appliquees.has(m.version) ? "✓ appliquée " : "… en attente"}  ${m.version}_${m.nom}`);
  }
  const inconnues = [...appliquees.keys()].filter((v) => !locales.some((m) => m.version === v));
  for (const v of inconnues) {
    console.log(`  ⚠ ${v}_${appliquees.get(v) ?? "?"} est appliquée sur la base mais absente du dossier (récupérez la dernière version du code).`);
  }
  const attente = locales.filter((m) => !appliquees.has(m.version)).length;
  console.log(attente ? `\n${attente} migration(s) en attente.` : "\n✓ La base est à jour.");
}

/** Délimiteur $tag$ absent du texte, pour l'insérer sans échappement. */
function delimiteur(texte) {
  let n = 0;
  while (texte.includes(`$kit${n}$`)) n++;
  return `$kit${n}$`;
}

async function migrer(ctx, essai) {
  const locales = migrationsLocales();
  const appliquees = await migrationsAppliquees(ctx);
  const enAttente = locales.filter((m) => !appliquees.has(m.version));
  if (!enAttente.length) {
    console.log("✓ Aucune migration en attente : la base est à jour.");
    return;
  }
  // L'ordre doit être strict : une migration en attente plus ancienne qu'une migration appliquée
  // signale un dossier incohérent (fichier renommé, branche en retard…).
  const derniere = [...appliquees.keys()].sort().pop();
  const enRetard = enAttente.filter((m) => derniere && m.version < derniere);
  if (enRetard.length) {
    throw new ErreurKit(
      `Migration(s) plus ancienne(s) que la dernière appliquée (${derniere}) : ${enRetard.map((m) => m.version).join(", ")}. ` +
        "Ne jamais insérer une migration avant une migration déjà appliquée : renumérotez-la après " + derniere + ".",
    );
  }

  console.log(essai
    ? `Essai : ${enAttente.length} migration(s) exécutée(s) sur la vraie base PUIS ANNULÉE(S) — rien n'est enregistré.\n`
    : `Application de ${enAttente.length} migration(s), dans l'ordre :\n`);

  const suivi =
    "create schema if not exists supabase_migrations;\n" +
    "create table if not exists supabase_migrations.schema_migrations (version text primary key, statements text[], name text);\n";

  for (const m of enAttente) {
    const contenu = fs.readFileSync(m.fichier, "utf8");
    if (/^\s*(begin|start\s+transaction|commit|rollback)\s*;/im.test(contenu)) {
      throw new ErreurKit(`${m.version}_${m.nom} contient BEGIN / COMMIT / ROLLBACK : retirez-les, l'outil gère la transaction.`);
    }
    const d = delimiteur(contenu);
    const requete =
      "begin;\n" + suivi + contenu + "\n;\n" +
      `insert into supabase_migrations.schema_migrations (version, name, statements) values ('${m.version}', '${m.nom}', array[${d}${contenu}${d}]);\n` +
      (essai ? "rollback;" : "commit;");
    try {
      await sql(ctx, requete);
      console.log(`  ✓ ${m.version}_${m.nom}${essai ? " (exécutée puis annulée)" : " appliquée"}`);
    } catch (e) {
      console.log(`  ✗ ${m.version}_${m.nom} : ${e.message}`);
      console.log(essai ? "\nL'essai a échoué : corrigez la migration." : "\nArrêt : rien n'a été appliqué pour cette migration (tout ou rien).");
      process.exit(1);
    }
  }
  console.log(essai ? "\n✓ Essai réussi : les migrations s'exécutent sans erreur." : "\n✓ Base à jour.");
}

// ----------------------------------------------------------------------------- authentification

async function reglagesAuth(ctx, o) {
  if (o.lire) {
    const c = await api(ctx, "GET", `/projects/${ctx.ref}/config/auth`);
    console.log(`Inscriptions publiques : ${c.disable_signup ? "FERMÉES ✓" : "OUVERTES ✗"}`);
    console.log(`Adresse du site       : ${c.site_url || "(vide)"}`);
    console.log(`Redirections permises : ${c.uri_allow_list || "(aucune)"}`);
    return;
  }
  const corps = {};
  if (o["fermer-inscriptions"]) corps.disable_signup = true;
  if (typeof o["site-url"] === "string") corps.site_url = o["site-url"];
  if (typeof o.redirections === "string") corps.uri_allow_list = o.redirections;
  if (!Object.keys(corps).length) {
    throw new ErreurKit("Rien à changer : --fermer-inscriptions, --site-url=… ou --redirections=… (ou --lire).");
  }
  if (o.essai) {
    console.log("Essai (rien n'est envoyé) — réglages qui seraient appliqués :", JSON.stringify(corps));
    return;
  }
  await api(ctx, "PATCH", `/projects/${ctx.ref}/config/auth`, corps);
  console.log("✓ Réglages d'authentification appliqués :", JSON.stringify(corps));
}
