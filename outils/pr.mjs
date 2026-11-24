#!/usr/bin/env node
// Contrôle, vérifie et fusionne une PR — seule voie de fusion permise à Claude (`gh pr merge` en
// direct est interdit par .claude/settings.json). La fusion n'a lieu qu'après l'ACCORD EXPLICITE de
// l'utilisateur, donné dans la conversation en réponse au résumé de CETTE PR (.claude/rules/10).
//
// Option --attente=<secondes> : délai d'attente des statuts Vercel (défaut 300 pour verifier, 600
// pour la mise en ligne après fusion).
//
//   node outils/pr.mjs controler        contrôles obligatoires sur le commit en cours (dossier propre) :
//                                       typecheck, lint, build, tests SQL de la branche → preuve
//                                       .kit/controles/<commit>.json
//   node outils/pr.mjs verifier <n>     la PR peut-elle être fusionnée ? Affiche le résumé technique et
//                                       mémorise le commit présenté (.kit/fusion/<n>.json)
//   node outils/pr.mjs fusionner <n>    refait toutes les vérifications, exige un `verifier` du MÊME
//                                       commit depuis moins de 30 min, fusionne (merge commit), attend
//                                       la mise en ligne, met l'ordinateur à jour, supprime la branche
//
// Refus (aucune fusion) : PR fermée, brouillon ou hors `main` ; conflit ; branche en retard sur
// `main` ; commits locaux non envoyés ; contrôles absents ou en échec pour ce commit ; aperçu Vercel
// absent, en échec ou en cours ; migration de la branche non appliquée (sauf mention « À APPLIQUER
// APRÈS DÉPLOIEMENT ») ; résumé non présenté, périmé ou présenté pour un autre commit.
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ErreurKit, lancer } from "./_env.mjs";

const DOSSIER_OUTILS = path.dirname(fileURLToPath(import.meta.url));
const DOSSIER_PREUVES = path.join(".kit", "controles");
const DOSSIER_FUSION = path.join(".kit", "fusion");
const VALIDITE_RESUME_MS = 30 * 60_000;
const MENTION_APRES = "À APPLIQUER APRÈS DÉPLOIEMENT";
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

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
const gh = (...args) => exe("gh", args);
const ghJson = (...args) => JSON.parse(gh(...args) || "null");

/** Lance une commande npm (via le shell : npm est un .cmd sous Windows) et rend sa sortie. */
function npm(script) {
  const r = spawnSync(`npm run ${script}`, { shell: true, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  return { ok: r.status === 0, sortie: `${r.stdout ?? ""}\n${r.stderr ?? ""}` };
}

/** Lance un outil du kit (node outils/…) et rend code et sortie. */
function outil(nom, args) {
  const r = spawnSync(process.execPath, [path.join(DOSSIER_OUTILS, nom), ...args], {
    encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
  });
  return { ok: r.status === 0, sortie: `${r.stdout ?? ""}\n${r.stderr ?? ""}`.trim() };
}

function dernieresLignes(texte, n = 25) {
  return texte.trim().split(/\r?\n/).slice(-n).map((l) => "      " + l).join("\n");
}

function numeroPr(valeur) {
  if (!/^\d+$/.test(valeur ?? "")) throw new ErreurKit("Indiquez le numéro de la PR, par exemple : node outils/pr.mjs verifier 12");
  return valeur;
}

/** Migrations du dossier, appliquées ou non (null si la base n'est pas joignable). */
function etatMigrations() {
  const r = outil("supabase.mjs", ["migrations", "--json"]);
  if (!r.ok) return { erreur: r.sortie.split("\n").pop() };
  return JSON.parse(r.sortie.split("\n").find((l) => l.startsWith("{")) ?? "{}");
}

// ----------------------------------------------------------------------------- controler

async function controler() {
  if (git("status", "--porcelain")) {
    throw new ErreurKit("Des modifications ne sont pas commitées : les contrôles portent sur un commit, commitez d'abord.");
  }
  const branche = git("rev-parse", "--abbrev-ref", "HEAD");
  if (branche === "main" || branche === "HEAD") throw new ErreurKit("Placez-vous sur la branche de l'évolution (jamais sur main).");
  const sha = git("rev-parse", "HEAD");
  git("fetch", "-q", "origin");
  const preuve = path.join(DOSSIER_PREUVES, `${sha}.json`);
  fs.rmSync(preuve, { force: true });
  console.log(`Contrôles du commit ${sha.slice(0, 7)} (branche ${branche}) :\n`);

  const etapes = [];
  let echec = false;
  for (const script of ["typecheck", "lint", "build"]) {
    const r = npm(script);
    etapes.push({ nom: script, ok: r.ok });
    console.log(`  ${r.ok ? "✓" : "✗"} ${script}`);
    if (!r.ok) {
      console.log(dernieresLignes(r.sortie));
      echec = true;
      break; // inutile d'enchaîner sur un socle qui ne compile pas
    }
  }

  // Base de données : chaque migration modifiée par la branche a son test, et tous les tests passent.
  if (!echec) {
    const modifies = git("diff", "--name-only", "--diff-filter=AMR", "origin/main...HEAD").split("\n").filter(Boolean);
    const migrations = modifies.filter((f) => /^supabase\/migrations\/\d{4}_[a-z0-9_]+\.sql$/.test(f));
    const tests = new Set(modifies.filter((f) => /^supabase\/tests\/.+\.test\.sql$/.test(f)));
    for (const m of migrations) {
      const test = `supabase/tests/${path.basename(m, ".sql")}.test.sql`;
      if (!fs.existsSync(test)) {
        console.log(`  ✗ ${path.basename(m)} n'a pas de test (${test}) : toute migration est testée.`);
        etapes.push({ nom: `test de ${path.basename(m)}`, ok: false });
        echec = true;
      }
      tests.add(test);
    }
    if (!echec && tests.size) {
      const etat = etatMigrations();
      if (etat.erreur) throw new ErreurKit(`Base de données injoignable pour les tests SQL : ${etat.erreur}`);
      const appliquees = new Set((etat.migrations ?? []).filter((m) => m.appliquee).map((m) => m.fichier));
      for (const t of [...tests].sort()) {
        if (!fs.existsSync(t)) continue; // test supprimé par la branche
        const migration = `supabase/migrations/${path.basename(t, ".test.sql")}.sql`;
        const args = [t];
        if (fs.existsSync(migration) && !appliquees.has(migration)) args.push(`--migration=${migration}`);
        const r = outil("tester-sql.mjs", args);
        etapes.push({ nom: `test SQL ${path.basename(t)}`, ok: r.ok });
        console.log(`  ${r.ok ? "✓" : "✗"} test SQL ${path.basename(t)}`);
        if (!r.ok) { console.log(dernieresLignes(r.sortie, 15)); echec = true; }
      }
      if (!echec && (etat.migrations ?? []).some((m) => !m.appliquee)) {
        const r = outil("supabase.mjs", ["migrer", "--essai"]);
        etapes.push({ nom: "migrations en attente (essai annulé)", ok: r.ok });
        console.log(`  ${r.ok ? "✓" : "✗"} migrations en attente : essai annulé`);
        if (!r.ok) { console.log(dernieresLignes(r.sortie, 15)); echec = true; }
      }
    }
  }

  if (echec) {
    console.log("\n✗ Contrôles en échec : aucune preuve enregistrée, la PR ne pourra pas être fusionnée.");
    process.exitCode = 1;
    return;
  }
  fs.mkdirSync(DOSSIER_PREUVES, { recursive: true });
  fs.writeFileSync(preuve, JSON.stringify({ sha, branche, date: new Date().toISOString(), etapes }, null, 2));
  console.log(`\n✓ Contrôles réussis — preuve enregistrée pour le commit ${sha.slice(0, 7)}.`);
}

// ----------------------------------------------------------------------------- évaluation d'une PR

async function lirePr(n) {
  const champs = "number,title,url,state,isDraft,baseRefName,headRefName,headRefOid,mergeable,mergeStateStatus,body,files,additions,deletions";
  let pr = ghJson("pr", "view", n, "--json", champs);
  for (let i = 0; pr.mergeable === "UNKNOWN" && i < 10; i++) {
    await pause(3000); // GitHub calcule encore la fusionnabilité
    pr = ghJson("pr", "view", n, "--json", champs);
  }
  return pr;
}

/** Statuts de vérification du commit (Vercel et autres), avec attente si en cours. */
async function statuts(depot, sha, attenteMax) {
  const debut = Date.now();
  for (;;) {
    const combine = ghJson("api", `repos/${depot}/commits/${sha}/status`);
    const liste = (combine?.statuses ?? []).map((s) => ({ nom: s.context, etat: s.state, lien: s.target_url }));
    const runs = ghJson("api", `repos/${depot}/commits/${sha}/check-runs`)?.check_runs ?? [];
    for (const c of runs) {
      liste.push({
        nom: c.name,
        etat: c.status !== "completed" ? "pending" : ["success", "neutral", "skipped"].includes(c.conclusion) ? "success" : "failure",
        lien: c.html_url,
      });
    }
    const vercel = liste.filter((s) => /vercel/i.test(s.nom));
    const enCours = liste.some((s) => s.etat === "pending") || !vercel.length;
    if (!enCours || Date.now() - debut >= attenteMax) return { liste, vercel };
    process.stdout.write(".");
    await pause(10_000);
  }
}

async function evaluer(n, { attenteStatuts }) {
  const depot = ghJson("repo", "view", "--json", "nameWithOwner").nameWithOwner;
  const pr = await lirePr(n);
  const raisons = [];
  const notes = [];

  if (pr.state !== "OPEN") raisons.push(`la PR est ${pr.state === "MERGED" ? "déjà fusionnée" : "fermée"}`);
  if (pr.isDraft) raisons.push("la PR est un brouillon");
  if (pr.baseRefName !== "main") raisons.push(`la PR vise « ${pr.baseRefName} » et non main`);
  if (pr.mergeable === "CONFLICTING" || pr.mergeStateStatus === "DIRTY") {
    raisons.push("conflit avec main : le résoudre dans une nouvelle branche (la PR ouverte reste figée)");
  } else if (pr.mergeable !== "MERGEABLE") {
    raisons.push(`GitHub ne confirme pas que la fusion est possible (${pr.mergeable})`);
  }
  if (pr.mergeStateStatus === "BLOCKED") raisons.push("GitHub bloque la fusion (règle de protection du dépôt)");

  const sha = pr.headRefOid;
  git("fetch", "-q", "origin");
  const aJour = spawnSync("git", ["merge-base", "--is-ancestor", "origin/main", sha], { stdio: "ignore" }).status === 0;
  if (!aJour) raisons.push("main a avancé depuis la création de la branche : rebaser (sans changer le contenu), relancer les contrôles, renvoyer, puis revérifier");

  const locale = spawnSync("git", ["rev-parse", "--verify", "--quiet", `refs/heads/${pr.headRefName}`], { encoding: "utf8" }).stdout.trim();
  if (locale && locale !== sha) raisons.push("la branche locale diffère de la PR (commits non envoyés, ou PR modifiée ailleurs)");

  const preuveFichier = path.join(DOSSIER_PREUVES, `${sha}.json`);
  const preuve = fs.existsSync(preuveFichier) ? JSON.parse(fs.readFileSync(preuveFichier, "utf8")) : null;
  if (!preuve) raisons.push(`aucun contrôle réussi pour le commit ${sha.slice(0, 7)} : lancer node outils/pr.mjs controler`);

  const { liste, vercel } = await statuts(depot, sha, attenteStatuts);
  process.stdout.write("\n");
  const echecs = liste.filter((s) => ["failure", "error"].includes(s.etat));
  if (echecs.length) raisons.push(`vérification en échec sur GitHub : ${echecs.map((s) => s.nom).join(", ")}`);
  if (!vercel.length) raisons.push("aucun aperçu Vercel pour ce commit (projet Vercel relié au dépôt ?)");
  else if (vercel.some((s) => s.etat === "pending")) raisons.push("l'aperçu Vercel est encore en préparation : revérifier dans une minute");
  const apercu = vercel.find((s) => s.etat === "success")?.lien;

  const fichiers = (pr.files ?? []).map((f) => f.path);
  const migrationsPr = fichiers.filter((f) => /^supabase\/migrations\/\d{4}_[a-z0-9_]+\.sql$/.test(f));
  const apresDeploiement = (pr.body ?? "").includes(MENTION_APRES);
  if (migrationsPr.length) {
    const etat = etatMigrations();
    if (etat.erreur) raisons.push(`état des migrations illisible : ${etat.erreur}`);
    else {
      const enAttente = migrationsPr.filter((f) => !(etat.migrations ?? []).some((m) => m.fichier === f && m.appliquee));
      if (enAttente.length && !apresDeploiement) {
        raisons.push(`migration non appliquée : ${enAttente.map((f) => path.basename(f)).join(", ")} (l'appliquer avant la fusion, ou indiquer « ${MENTION_APRES} » dans la PR)`);
      } else if (enAttente.length) {
        notes.push(`migration à appliquer APRÈS la mise en ligne : ${enAttente.map((f) => path.basename(f)).join(", ")}`);
      } else {
        notes.push(`migration déjà appliquée : ${migrationsPr.map((f) => path.basename(f)).join(", ")}`);
      }
    }
  }
  return { depot, pr, sha, raisons, notes, preuve, apercu, fichiers, enAttenteApres: apresDeploiement && migrationsPr.length };
}

function afficher(ev) {
  const { pr, sha, preuve, apercu, fichiers } = ev;
  console.log(`PR #${pr.number} — ${pr.title}`);
  console.log(`  ${pr.url}`);
  console.log(`  Branche ${pr.headRefName} → main · commit ${sha.slice(0, 7)} · ${fichiers.length} fichier(s), +${pr.additions} / -${pr.deletions}`);
  if (preuve) console.log(`  Contrôles réussis le ${new Date(preuve.date).toLocaleString("fr-FR")} : ${preuve.etapes.map((e) => e.nom).join(", ")}`);
  if (apercu) console.log(`  Aperçu Vercel : ${apercu}`);
  for (const n of ev.notes) console.log(`  • ${n}`);
}

// ----------------------------------------------------------------------------- verifier / fusionner

async function verifier(n, attente) {
  console.log(`Vérification de la PR (statuts GitHub et Vercel : jusqu'à ${Math.round(attente / 60_000)} min d'attente si en cours)`);
  const ev = await evaluer(n, { attenteStatuts: attente });
  afficher(ev);
  const memo = path.join(DOSSIER_FUSION, `${n}.json`);
  if (ev.raisons.length) {
    fs.rmSync(memo, { force: true });
    console.log("\n✗ Fusion impossible :");
    for (const r of ev.raisons) console.log(`  - ${r}`);
    process.exitCode = 1;
    return;
  }
  fs.mkdirSync(DOSSIER_FUSION, { recursive: true });
  fs.writeFileSync(memo, JSON.stringify({ pr: Number(n), sha: ev.sha, date: new Date().toISOString() }, null, 2));
  console.log("\n✓ La PR peut être fusionnée. Présenter le résumé à l'utilisateur et lui demander son accord explicite.");
}

async function fusionner(n, attenteMiseEnLigne) {
  if (git("status", "--porcelain")) throw new ErreurKit("Des modifications ne sont pas commitées sur cet ordinateur : rien n'est fusionné.");
  const ev = await evaluer(n, { attenteStatuts: 0 });
  if (ev.raisons.length) {
    console.log(`✗ Fusion refusée pour la PR #${n} :`);
    for (const r of ev.raisons) console.log(`  - ${r}`);
    process.exitCode = 1;
    return;
  }
  const memoFichier = path.join(DOSSIER_FUSION, `${n}.json`);
  const memo = fs.existsSync(memoFichier) ? JSON.parse(fs.readFileSync(memoFichier, "utf8")) : null;
  if (!memo) throw new ErreurKit("Fusion refusée : la PR n'a pas été vérifiée ni présentée (node outils/pr.mjs verifier, puis accord de l'utilisateur).");
  if (memo.sha !== ev.sha) throw new ErreurKit("Fusion refusée : la PR a changé depuis le résumé présenté. Revérifier, représenter le résumé et redemander l'accord.");
  if (Date.now() - Date.parse(memo.date) > VALIDITE_RESUME_MS) {
    throw new ErreurKit("Fusion refusée : le résumé date de plus de 30 minutes. Revérifier, puis redemander l'accord.");
  }

  // Fusion (commit de fusion) ; --match-head-commit : GitHub refuse si la PR a bougé entre-temps.
  gh("pr", "merge", n, "--merge", "--match-head-commit", ev.sha);
  const apres = ghJson("pr", "view", n, "--json", "state,mergeCommit");
  if (apres.state !== "MERGED") throw new ErreurKit(`La fusion n'a pas abouti (état ${apres.state}).`);
  const commitFusion = apres.mergeCommit.oid;
  fs.rmSync(memoFichier, { force: true });
  console.log(`✓ PR #${n} fusionnée dans main (commit ${commitFusion.slice(0, 7)}).`);

  // Branche distante supprimée (les commits restent dans l'historique de main).
  try {
    gh("api", "-X", "DELETE", `repos/${ev.depot}/git/refs/heads/${ev.pr.headRefName}`);
  } catch { console.log(`  (branche distante ${ev.pr.headRefName} déjà supprimée)`); }

  // Ordinateur à jour.
  git("fetch", "-q", "--prune", "origin");
  git("switch", "-q", "main");
  git("pull", "-q", "--ff-only", "origin", "main");
  const supprimee = spawnSync("git", ["branch", "-d", ev.pr.headRefName], { stdio: "ignore" }).status === 0;
  console.log(`✓ Ordinateur à jour : main au commit ${git("rev-parse", "--short", "HEAD")}${supprimee ? `, branche locale ${ev.pr.headRefName} supprimée` : ""}.`);

  // Mise en ligne (production) du commit de fusion.
  process.stdout.write(`Mise en ligne en cours (jusqu'à ${Math.round(attenteMiseEnLigne / 60_000)} min)`);
  const { vercel } = await statuts(ev.depot, commitFusion, attenteMiseEnLigne);
  process.stdout.write("\n");
  const prod = vercel.find((s) => s.etat === "success");
  if (vercel.some((s) => ["failure", "error"].includes(s.etat))) {
    console.log("✗ La mise en ligne a échoué : la version précédente reste en ligne. Journal : Vercel > Deployments > Build Logs ; corriger dans une nouvelle branche fix/….");
    process.exitCode = 1;
  } else if (!prod) {
    console.log("⚠ Mise en ligne toujours en cours ou statut absent : revérifier dans quelques minutes (déroulé « après fusion »).");
  } else {
    console.log(`✓ En ligne (statut Vercel success)${prod.lien ? ` : ${prod.lien}` : ""}.`);
  }
  if (ev.enAttenteApres) {
    console.log(`\n⚠ ${ev.notes.find((x) => x.startsWith("migration à appliquer")) ?? "migration différée"} : node outils/supabase.mjs migrer --essai, puis migrer.`);
  }
}

// ----------------------------------------------------------------------------- point d'entrée

lancer(async () => {
  const args = process.argv.slice(2);
  const [commande, numero] = args.filter((a) => !a.startsWith("--"));
  const opt = args.find((a) => a.startsWith("--attente="));
  const attente = opt ? Number(opt.slice(10)) * 1000 : null;
  if (opt && !(attente >= 0 && attente <= 3_600_000)) throw new ErreurKit("--attente : nombre de secondes, entre 0 et 3600.");
  if (commande === "controler") return controler();
  if (commande === "verifier") return verifier(numeroPr(numero), attente ?? 5 * 60_000);
  if (commande === "fusionner") return fusionner(numeroPr(numero), attente ?? 10 * 60_000);
  throw new ErreurKit("Commande inconnue. Possibles : controler, verifier <n>, fusionner <n>.");
});
