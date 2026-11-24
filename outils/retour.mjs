#!/usr/bin/env node
// Retour arrière sécurisé d'une évolution (déroulé .claude/kit/deroules/retour-arriere.md).
// Ne réécrit jamais main : l'annulation passe par une nouvelle branche et une PR ; les migrations déjà
// appliquées sont conservées (on les compense par une nouvelle migration).
//
//   node outils/retour.mjs analyser [n]           PR à annuler (défaut : la dernière fusionnée dans main),
//                                                 migrations et leur état, évolutions plus récentes qui en
//                                                 dépendent, données concernées (comptes en lecture seule),
//                                                 niveau de risque → .kit/retours/pr-<n>/analyse.json
//   node outils/retour.mjs preparer <n>           branche fix/retour-pr-<n> depuis origin/main, annulation
//                                                 du commit de fusion, migrations appliquées, leurs tests et
//                                                 docs/HISTORIQUE.md conservés ; refus si conflit ou risque rouge
//   node outils/retour.mjs instantane --sortie=f.json [--colonnes=table.colonne,…]
//                                                 nombre de lignes de chaque table (lecture seule)
//   node outils/retour.mjs comparer f.json [--autorise=table,table.colonne,…]
//                                                 nouvel instantané comparé au précédent : toute perte non
//                                                 autorisée → alerte et code 1
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ErreurKit, lancer } from "./_env.mjs";
import { contexte, ident, options, sql } from "./_supabase.mjs";

const DOSSIER_OUTILS = path.dirname(fileURLToPath(import.meta.url));
const MOTIF_MIGRATION = /^supabase\/migrations\/(\d{4})_[a-z0-9_]+\.sql$/;

// ----------------------------------------------------------------------------- utilitaires

function exe(programme, args) {
  try {
    return execFileSync(programme, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch (e) {
    const detail = String(e.stderr || e.stdout || e.message).trim().split("\n").slice(-3).join(" ");
    throw new ErreurKit(`${programme} ${args.slice(0, 3).join(" ")} : ${detail}`);
  }
}
const git = (...args) => exe("git", args);
const ghJson = (...args) => JSON.parse(exe("gh", args) || "null");

function etatMigrations() {
  const r = spawnSync(process.execPath, [path.join(DOSSIER_OUTILS, "supabase.mjs"), "migrations", "--json"], { encoding: "utf8" });
  if (r.status !== 0) return { erreur: `${r.stdout}${r.stderr}`.trim().split("\n").pop() };
  return JSON.parse(r.stdout.split("\n").find((l) => l.startsWith("{")) ?? "{}");
}

function dossierRetour(n) {
  return path.join(".kit", "retours", `pr-${n}`);
}

// ----------------------------------------------------------------------------- lecture d'une migration

/** Ce que fait une migration : objets créés, données insérées, opérations destructrices. */
export function analyserSql(texte) {
  const propre = texte
    .replace(/\$([a-z_0-9]*)\$[\s\S]*?\$\1\$/gi, "''") // corps de fonctions : ignorés
    .replace(/--[^\n]*/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");
  const noms = (re, i = 1) => [...propre.matchAll(re)].map((m) => m[i].toLowerCase());
  const N = String.raw`(?:public\.)?"?([a-z_][a-z0-9_]*)"?`;
  const r = {
    tables: noms(new RegExp(String.raw`create\s+table\s+(?:if\s+not\s+exists\s+)?${N}`, "gi")),
    colonnes: [...propre.matchAll(new RegExp(String.raw`alter\s+table\s+(?:if\s+exists\s+)?(?:only\s+)?${N}\s+add\s+(?:column\s+)?(?:if\s+not\s+exists\s+)?"?([a-z_][a-z0-9_]*)"?`, "gi"))]
      .filter((m) => !["constraint", "primary", "foreign", "unique", "check"].includes(m[2].toLowerCase()))
      .map((m) => `${m[1].toLowerCase()}.${m[2].toLowerCase()}`),
    fonctions: noms(new RegExp(String.raw`create\s+(?:or\s+replace\s+)?function\s+${N}\s*\(`, "gi")),
    politiques: [...propre.matchAll(new RegExp(String.raw`create\s+policy\s+"?([^"\n]+?)"?\s+on\s+${N}`, "gi"))].map((m) => `${m[1]} (${m[2]})`),
    index: noms(/create\s+(?:unique\s+)?index\s+(?:concurrently\s+)?(?:if\s+not\s+exists\s+)?"?([a-z_][a-z0-9_]*)"?/gi),
    declencheurs: noms(/create\s+(?:or\s+replace\s+)?(?:constraint\s+)?trigger\s+"?([a-z_][a-z0-9_]*)"?/gi),
    types: noms(new RegExp(String.raw`create\s+type\s+${N}`, "gi")),
    vues: noms(new RegExp(String.raw`create\s+(?:or\s+replace\s+)?(?:materialized\s+)?view\s+${N}`, "gi")),
    droits: (propre.match(/\bgrant\s+/gi) ?? []).length,
    insertions: noms(new RegExp(String.raw`insert\s+into\s+${N}`, "gi")),
    destructions: [],
  };
  for (const instruction of propre.split(";").map((s) => s.trim().replace(/\s+/g, " ")).filter(Boolean)) {
    if (/^(update|delete|truncate)\b/i.test(instruction)
      || /^drop\s+(table|type|schema|view|materialized)\b/i.test(instruction)
      || /^alter\s+table\b.*\b(drop\s+column|drop\s+(?!constraint|not\s+null|default)[a-z_"]+\s*$|rename\b|alter\s+column\s+\S+\s+(set\s+data\s+)?type\b)/i.test(instruction)) {
      r.destructions.push(instruction.slice(0, 140));
    }
  }
  return r;
}

// ----------------------------------------------------------------------------- analyser

async function prParDefaut() {
  const liste = ghJson("pr", "list", "--state", "merged", "--base", "main", "--limit", "20", "--json", "number,title,mergedAt");
  if (!liste?.length) throw new ErreurKit("Aucune PR fusionnée dans main : rien à annuler.");
  return liste.sort((a, b) => b.mergedAt.localeCompare(a.mergedAt));
}

async function analyser(numero) {
  const fusionnees = await prParDefaut();
  const n = numero ?? String(fusionnees[0].number);
  const pr = ghJson("pr", "view", n, "--json", "number,title,url,state,mergedAt,mergeCommit,files,body");
  git("fetch", "-q", "origin");

  console.log(`Évolution à annuler : PR #${pr.number} — ${pr.title}`);
  console.log(`  ${pr.url}`);
  if (!numero && fusionnees.length > 1) {
    console.log("  (dernière PR fusionnée ; les précédentes : " +
      fusionnees.slice(1, 3).map((p) => `#${p.number} ${p.title}`).join(" ; ") + ")");
  }

  const analyse = { pr: pr.number, titre: pr.title, url: pr.url, etat: pr.state, risque: "vert", raisons: [], avertissements: [] };
  if (pr.state !== "MERGED") {
    analyse.raisons.push(pr.state === "OPEN"
      ? "la PR n'est pas fusionnée : rien n'est en ligne. Il suffit de la fermer ; si une migration a été appliquée avant fusion, la compenser par une nouvelle PR"
      : "la PR est fermée sans fusion : rien à annuler en ligne");
    analyse.risque = "rouge";
  }

  const sha = pr.mergeCommit?.oid;
  const fichiers = (pr.files ?? []).map((f) => f.path);
  analyse.commit_fusion = sha;
  analyse.fichiers = fichiers;
  if (sha) {
    if (spawnSync("git", ["merge-base", "--is-ancestor", sha, "origin/main"], { stdio: "ignore" }).status !== 0) {
      analyse.raisons.push("le commit de fusion n'est pas dans main (historique inattendu)");
      analyse.risque = "rouge";
    }
    analyse.parents = git("rev-list", "--parents", "-n", "1", sha).split(" ").length - 1;
  }

  // Évolutions plus récentes qui touchent les mêmes fichiers.
  const recentes = fusionnees.filter((p) => pr.mergedAt && p.mergedAt > pr.mergedAt);
  analyse.dependances = [];
  for (const p of recentes) {
    const f = (ghJson("pr", "view", String(p.number), "--json", "files").files ?? []).map((x) => x.path);
    const communs = f.filter((x) => fichiers.includes(x) && x !== "docs/HISTORIQUE.md");
    if (communs.length) analyse.dependances.push({ pr: p.number, titre: p.title, fichiers: communs });
  }

  // Migrations de la PR.
  const migrations = fichiers.filter((f) => MOTIF_MIGRATION.test(f)).sort();
  analyse.migrations = [];
  const etat = migrations.length ? etatMigrations() : { migrations: [] };
  if (etat.erreur) throw new ErreurKit(`État des migrations illisible : ${etat.erreur}`);
  const creees = { tables: [], colonnes: [], fonctions: [], politiques: [], index: [], declencheurs: [], types: [], vues: [], insertions: [] };
  for (const m of migrations) {
    const contenu = sha ? git("show", `${sha}:${m}`) : fs.readFileSync(m, "utf8");
    const s = analyserSql(contenu);
    const appliquee = (etat.migrations ?? []).some((x) => x.fichier === m && x.appliquee);
    analyse.migrations.push({ fichier: m, appliquee, ...s });
    for (const k of Object.keys(creees)) creees[k].push(...s[k]);
    if (s.destructions.length && appliquee) {
      analyse.raisons.push(`${path.basename(m)} a modifié ou détruit des données (${s.destructions[0]}…) : l'annulation ne peut pas les rendre`);
      analyse.risque = "rouge";
    }
  }
  analyse.objets = creees;

  // Migrations plus récentes de main qui utilisent les objets créés par cette PR.
  const versionsPr = migrations.map((m) => MOTIF_MIGRATION.exec(m)[1]);
  const maxPr = versionsPr.sort().pop();
  if (maxPr) {
    const objets = [...creees.tables, ...creees.fonctions, ...creees.types, ...creees.vues, ...creees.colonnes.map((c) => c.split(".")[1])];
    const recentesMig = git("ls-tree", "--name-only", "origin/main", "supabase/migrations/").split("\n")
      .filter((f) => MOTIF_MIGRATION.test(f) && MOTIF_MIGRATION.exec(f)[1] > maxPr);
    for (const f of recentesMig) {
      const t = git("show", `origin/main:${f}`).toLowerCase();
      const utilises = objets.filter((o) => new RegExp(`\\b${o}\\b`).test(t));
      if (utilises.length) analyse.dependances.push({ migration: f, objets: utilises });
    }
  }
  if (analyse.dependances.length) {
    analyse.raisons.push("des évolutions plus récentes dépendent de celle-ci : les annuler d'abord, une à une, de la plus récente à la plus ancienne");
    analyse.risque = "rouge";
  }

  // Données concernées (lecture seule).
  analyse.donnees = [];
  const appliquees = analyse.migrations.some((m) => m.appliquee);
  if (appliquees && (creees.tables.length || creees.colonnes.length)) {
    const ctx = contexte();
    ctx.exigerProjet();
    for (const t of [...new Set(creees.tables)]) {
      const [{ existe }] = await sql(ctx, `select count(*)::int as existe from information_schema.tables where table_schema = 'public' and table_name = '${t}'`);
      if (!existe) continue;
      const [{ n }] = await sql(ctx, `select count(*)::int as n from public.${ident(t)}`);
      analyse.donnees.push({ element: t, type: "table", lignes: n });
    }
    for (const c of [...new Set(creees.colonnes)]) {
      const [t, col] = c.split(".");
      if (creees.tables.includes(t)) continue; // comptée avec la table
      const [{ existe }] = await sql(ctx, `select count(*)::int as existe from information_schema.columns where table_schema = 'public' and table_name = '${t}' and column_name = '${col}'`);
      if (!existe) continue;
      const [{ n }] = await sql(ctx, `select count(${ident(col)})::int as n from public.${ident(t)}`);
      analyse.donnees.push({ element: c, type: "colonne", lignes: n });
    }
  }
  const remplies = analyse.donnees.filter((d) => d.lignes > 0);
  if (analyse.risque !== "rouge" && (remplies.length || creees.insertions.length)) analyse.risque = "orange";
  if (creees.insertions.length) analyse.avertissements.push(`la migration a inséré des données dans : ${[...new Set(creees.insertions)].join(", ")}`);
  analyse.avertissements.push("vérifier aussi dans le code si l'évolution écrit dans des tables existantes (ces données ne sont pas détectées automatiquement)");

  // Affichage.
  console.log(`\nFusionnée le ${pr.mergedAt ? new Date(pr.mergedAt).toLocaleString("fr-FR") : "—"} · ${fichiers.length} fichier(s) · commit ${sha?.slice(0, 7) ?? "—"}`);
  for (const m of analyse.migrations) {
    const parts = ["tables", "colonnes", "fonctions", "politiques", "index", "declencheurs", "types", "vues"]
      .filter((k) => m[k].length).map((k) => `${k} : ${m[k].join(", ")}`);
    console.log(`  • ${path.basename(m.fichier)} — ${m.appliquee ? "appliquée" : "NON appliquée"}${parts.length ? ` — ${parts.join(" ; ")}` : ""}${m.droits ? ` ; ${m.droits} droit(s)` : ""}`);
  }
  for (const d of analyse.donnees) console.log(`  • données : ${d.type} ${d.element} — ${d.lignes} ligne(s)${d.type === "colonne" ? " renseignée(s)" : ""}`);
  for (const d of analyse.dependances) console.log(`  ⚠ dépendance : ${d.pr ? `PR #${d.pr} (${d.titre}) modifie aussi ${d.fichiers.join(", ")}` : `${d.migration} utilise ${d.objets.join(", ")}`}`);
  for (const a of analyse.avertissements) console.log(`  ⚠ ${a}`);
  const libelle = { vert: "🟢 VERT — aucune donnée en jeu", orange: "🟠 ORANGE — des données seraient supprimées : sauvegarde vérifiée et autorisation spécifique obligatoires", rouge: "🔴 ROUGE — retour arrière BLOQUÉ" }[analyse.risque];
  console.log(`\nRisque : ${libelle}`);
  for (const r of analyse.raisons) console.log(`  - ${r}`);

  const dossier = dossierRetour(pr.number);
  fs.mkdirSync(dossier, { recursive: true });
  analyse.date = new Date().toISOString();
  fs.writeFileSync(path.join(dossier, "analyse.json"), JSON.stringify(analyse, null, 2));
  if (analyse.risque === "rouge") process.exitCode = 1;
}

// ----------------------------------------------------------------------------- preparer

async function preparer(n) {
  if (!/^\d+$/.test(n ?? "")) throw new ErreurKit("Indiquez le numéro de la PR à annuler : node outils/retour.mjs preparer 12");
  const fichierAnalyse = path.join(dossierRetour(n), "analyse.json");
  if (!fs.existsSync(fichierAnalyse)) throw new ErreurKit(`Analyse absente : lancer d'abord node outils/retour.mjs analyser ${n}`);
  const analyse = JSON.parse(fs.readFileSync(fichierAnalyse, "utf8"));
  if (analyse.risque === "rouge") throw new ErreurKit("Retour arrière bloqué par l'analyse (risque rouge) : voir les raisons affichées par analyser.");
  if (Date.now() - Date.parse(analyse.date) > 60 * 60_000) throw new ErreurKit("Analyse de plus d'une heure : la relancer.");
  if (git("status", "--porcelain")) throw new ErreurKit("Des modifications ne sont pas commitées : rien n'est préparé.");

  git("fetch", "-q", "origin");
  const branche = `fix/retour-pr-${n}`;
  if (spawnSync("git", ["rev-parse", "--verify", "--quiet", `refs/heads/${branche}`], { stdio: "ignore" }).status === 0) {
    throw new ErreurKit(`La branche ${branche} existe déjà.`);
  }
  const depart = git("rev-parse", "--abbrev-ref", "HEAD");
  git("switch", "-q", "-c", branche, "origin/main");

  const args = ["revert", "--no-commit"];
  if (analyse.parents === 2) args.push("-m", "1");
  else if (analyse.parents !== 1) throw new ErreurKit("Commit de fusion inattendu.");
  args.push(analyse.commit_fusion);
  const r = spawnSync("git", args, { encoding: "utf8" });
  if (r.status !== 0) {
    const conflits = spawnSync("git", ["diff", "--name-only", "--diff-filter=U"], { encoding: "utf8" }).stdout.trim();
    spawnSync("git", ["revert", "--abort"], { stdio: "ignore" });
    spawnSync("git", ["switch", "-q", depart === "HEAD" ? "main" : depart], { stdio: "ignore" });
    spawnSync("git", ["branch", "-D", branche], { stdio: "ignore" });
    throw new ErreurKit(
      `Annulation impossible sans conflit${conflits ? ` (${conflits.split("\n").join(", ")})` : ""} : des évolutions plus récentes ` +
        "ont modifié les mêmes lignes. Rien n'a été changé. Annuler d'abord les plus récentes, ou corriger « vers l'avant ».",
    );
  }

  // Conserver ce qui ne doit pas disparaître : migrations appliquées, leurs tests, l'historique.
  const aGarder = ["docs/HISTORIQUE.md"];
  for (const m of analyse.migrations.filter((x) => x.appliquee)) {
    aGarder.push(m.fichier, m.fichier.replace("supabase/migrations/", "supabase/tests/").replace(/\.sql$/, ".test.sql"));
  }
  const presents = aGarder.filter((f) => spawnSync("git", ["cat-file", "-e", `origin/main:${f}`], { stdio: "ignore" }).status === 0);
  if (presents.length) git("checkout", "origin/main", "--", ...presents);
  const rienDansLeCode = spawnSync("git", ["diff", "--cached", "--quiet"]).status === 0;
  if (rienDansLeCode) {
    // La PR ne contenait que des migrations appliquées / l'historique : rien à annuler dans le code.
    git("revert", "--quit");
  } else {
    git("commit", "-q", "-m", `Annuler la PR #${n} : ${analyse.titre}`);
  }

  const numeros = fs.existsSync("supabase/migrations")
    ? fs.readdirSync("supabase/migrations").map((f) => /^(\d{4})_/.exec(f)?.[1]).filter(Boolean).map(Number)
    : [];
  const suivant = String((numeros.length ? Math.max(...numeros) : 0) + 1).padStart(4, "0");
  console.log(rienDansLeCode
    ? `✓ Branche ${branche} prête. La PR #${n} ne modifiait que la base de données : rien à annuler dans le code, la migration compensatoire fera le retour arrière.`
    : `✓ Branche ${branche} prête : PR #${n} annulée dans le code (commit ${git("rev-parse", "--short", "HEAD")}).`);
  if (presents.length > 1) console.log(`  Conservés (jamais supprimés) : ${presents.join(", ")}`);
  if (analyse.migrations.some((m) => m.appliquee)) {
    console.log(`  Migration compensatoire à écrire : supabase/migrations/${suivant}_retour_pr_${n}.sql`);
    console.log(`  et son test : supabase/tests/${suivant}_retour_pr_${n}.test.sql (déroulé retour-arriere.md §6).`);
  }
  console.log("  Puis : docs/HISTORIQUE.md (entrée [Correctif]), MODELE_DONNEES, PERMISSIONS, ROADMAP, commit, node outils/pr.mjs controler.");
}

// ----------------------------------------------------------------------------- instantane / comparer

async function prendreInstantane(colonnes) {
  const ctx = contexte();
  ctx.exigerProjet();
  const tables = (await sql(ctx, "select table_name as t from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE' order by 1")).map((r) => r.t);
  const resultat = { date: new Date().toISOString(), projet: ctx.ref, tables: {}, colonnes: {} };
  const valides = tables.filter((t) => /^[a-z_][a-z0-9_]{0,62}$/.test(t));
  if (valides.length) {
    const lignes = await sql(ctx, valides.map((t) => `select '${t}' as t, count(*)::bigint as n from public.${ident(t)}`).join(" union all "));
    for (const l of lignes) resultat.tables[l.t] = Number(l.n);
  }
  for (const c of colonnes) {
    const [t, col] = c.split(".");
    ident(t); ident(col);
    const [{ existe }] = await sql(ctx, `select count(*)::int as existe from information_schema.columns where table_schema = 'public' and table_name = '${t}' and column_name = '${col}'`);
    resultat.colonnes[c] = existe ? Number((await sql(ctx, `select count(${ident(col)})::bigint as n from public.${ident(t)}`))[0].n) : null;
  }
  return resultat;
}

async function instantane(o) {
  if (typeof o.sortie !== "string") throw new ErreurKit("Indiquez le fichier : --sortie=.kit/retours/pr-<n>/avant.json");
  const colonnes = typeof o.colonnes === "string" ? o.colonnes.split(",").filter(Boolean) : [];
  const r = await prendreInstantane(colonnes);
  fs.mkdirSync(path.dirname(o.sortie), { recursive: true });
  fs.writeFileSync(o.sortie, JSON.stringify(r, null, 2));
  console.log(`✓ Instantané : ${Object.keys(r.tables).length} table(s)${colonnes.length ? `, ${colonnes.length} colonne(s)` : ""} → ${o.sortie}`);
}

async function comparer(fichier, o) {
  if (!fichier || !fs.existsSync(fichier)) throw new ErreurKit("Indiquez l'instantané d'avant : node outils/retour.mjs comparer .kit/retours/pr-<n>/avant.json");
  const avant = JSON.parse(fs.readFileSync(fichier, "utf8"));
  const autorise = new Set(typeof o.autorise === "string" ? o.autorise.split(",").filter(Boolean) : []);
  const apres = await prendreInstantane(Object.keys(avant.colonnes ?? {}));
  if (apres.projet !== avant.projet) throw new ErreurKit("Les deux instantanés ne viennent pas du même projet.");
  let alertes = 0;
  const ligne = (ok, texte) => { console.log(`  ${ok ? "✓" : "✗"} ${texte}`); if (!ok) alertes++; };
  for (const [t, n] of Object.entries(avant.tables)) {
    const m = apres.tables[t];
    if (m === undefined) ligne(autorise.has(t), `table ${t} supprimée (${n} ligne(s))${autorise.has(t) ? " — autorisé" : " — NON AUTORISÉ"}`);
    else if (m < n) ligne(autorise.has(t), `table ${t} : ${n} → ${m} ligne(s)${autorise.has(t) ? " — autorisé" : " — PERTE NON AUTORISÉE"}`);
    else if (m > n) console.log(`  · table ${t} : ${n} → ${m} ligne(s) (activité normale)`);
  }
  for (const [c, n] of Object.entries(avant.colonnes ?? {})) {
    const m = apres.colonnes[c];
    if (n === null) continue;
    if (m === null) ligne(autorise.has(c), `colonne ${c} supprimée (${n} valeur(s))${autorise.has(c) ? " — autorisé" : " — NON AUTORISÉ"}`);
    else if (m < n) ligne(autorise.has(c), `colonne ${c} : ${n} → ${m} valeur(s)${autorise.has(c) ? " — autorisé" : " — PERTE NON AUTORISÉE"}`);
  }
  for (const t of Object.keys(apres.tables).filter((t) => !(t in avant.tables))) console.log(`  · nouvelle table ${t}`);
  if (alertes) {
    console.log(`\n✗ ALERTE : ${alertes} perte(s) de données non autorisée(s). Arrêter, prévenir l'utilisateur, restaurer depuis la sauvegarde (node outils/sauvegarde.mjs restaurer).`);
    process.exitCode = 1;
  } else {
    console.log("\n✓ Intégrité des données : seules les suppressions autorisées ont eu lieu.");
  }
}

// ----------------------------------------------------------------------------- point d'entrée

// Lancé en ligne de commande seulement (le module peut être importé pour tester analyserSql).
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) lancer(async () => {
  const [commande, ...reste] = process.argv.slice(2);
  const positionnels = reste.filter((a) => !a.startsWith("--"));
  const o = options(reste.filter((a) => a.startsWith("--")));
  if (commande === "analyser") return analyser(positionnels[0]);
  if (commande === "preparer") return preparer(positionnels[0]);
  if (commande === "instantane") return instantane(o);
  if (commande === "comparer") return comparer(positionnels[0], o);
  throw new ErreurKit("Commande inconnue. Possibles : analyser [n], preparer <n>, instantane --sortie=…, comparer <fichier>.");
});
