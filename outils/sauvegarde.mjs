#!/usr/bin/env node
// Sauvegarde ciblée des données AVANT toute opération qui pourrait en détruire (retour arrière…).
// L'offre gratuite de Supabase n'a aucune sauvegarde récupérable : celle-ci est faite par le kit,
// sur cet ordinateur, et VÉRIFIÉE par un essai de restauration annulé.
//
//   node outils/sauvegarde.mjs creer --tables=t1,t2 [--colonnes=table.colonne,…] [--motif="…"]
//   node outils/sauvegarde.mjs verifier <dossier>    empreintes du fichier, nombre de lignes, ESSAI DE
//                                                    RESTAURATION (bloc annulé) et empreinte identique
//                                                    à la base actuelle → « sauvegarde exploitable »
//   node outils/sauvegarde.mjs restaurer <dossier> [--element=table|table.colonne]   (avec accord)
//   node outils/sauvegarde.mjs liste
//
// Fichiers : .kit/sauvegardes/<date>/ (ignoré par Git). ILS CONTIENNENT DES DONNÉES RÉELLES : ne jamais
// les committer, les envoyer ni les coller dans une conversation. Plafond : 50 000 lignes ou 20 Mo par
// élément (au-delà, passer par une sauvegarde de l'offre Pro de Supabase).
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { ErreurKit, lancer } from "./_env.mjs";
import { contexte, ident, options, sql } from "./_supabase.mjs";

const RACINE = path.join(".kit", "sauvegardes");
const MAX_LIGNES = 50_000;
const MAX_OCTETS = 20 * 1024 * 1024;
const sha256 = (texte) => crypto.createHash("sha256").update(texte).digest("hex");

/** Délimiteur $tag$ absent du texte. */
function delimiteur(texte) {
  let n = 0;
  while (texte.includes(`$kit${n}$`)) n++;
  return `$kit${n}$`;
}

async function tableExiste(ctx, table) {
  const [r] = await sql(ctx, `select count(*)::int as n from information_schema.tables where table_schema = 'public' and table_name = '${table}'`);
  return r.n === 1;
}

async function colonnesDe(ctx, table) {
  return sql(ctx,
    `select column_name as nom, data_type as type, udt_name as type_interne, is_nullable = 'YES' as nullable, column_default as defaut,
            is_identity = 'YES' as identite
       from information_schema.columns where table_schema = 'public' and table_name = '${table}' order by ordinal_position`);
}

async function clePrimaire(ctx, table) {
  const lignes = await sql(ctx,
    `select a.attname as nom from pg_index i join pg_attribute a on a.attrelid = i.indrelid and a.attnum = any(i.indkey)
      where i.indrelid = 'public.${ident(table)}'::regclass and i.indisprimary order by a.attnum`);
  return lignes.map((l) => l.nom);
}

/** Requête qui produit les lignes sauvegardées d'un élément (table entière, ou clé + colonne). */
function selection(el) {
  const t = `public.${ident(el.table)}`;
  if (el.type === "table") return `select * from ${t}`;
  return `select ${[...el.cle_primaire, el.colonne].map(ident).join(", ")} from ${t}`;
}

// ----------------------------------------------------------------------------- creer

async function creer(ctx, o) {
  const tables = typeof o.tables === "string" ? o.tables.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const colonnes = typeof o.colonnes === "string" ? o.colonnes.split(",").map((s) => s.trim()).filter(Boolean) : [];
  if (!tables.length && !colonnes.length) throw new ErreurKit("Indiquez --tables=… et/ou --colonnes=table.colonne,…");

  const elements = [];
  for (const table of tables) {
    ident(table);
    if (!(await tableExiste(ctx, table))) throw new ErreurKit(`Table public.${table} introuvable.`);
    elements.push({ type: "table", table, cle_primaire: await clePrimaire(ctx, table), colonnes: await colonnesDe(ctx, table) });
  }
  for (const c of colonnes) {
    const [table, colonne] = c.split(".");
    ident(table); ident(colonne);
    if (!(await tableExiste(ctx, table))) throw new ErreurKit(`Table public.${table} introuvable.`);
    const defs = await colonnesDe(ctx, table);
    if (!defs.some((d) => d.nom === colonne)) throw new ErreurKit(`Colonne ${table}.${colonne} introuvable.`);
    const cle = await clePrimaire(ctx, table);
    if (!cle.length) throw new ErreurKit(`${table} n'a pas de clé primaire : impossible de sauvegarder une seule colonne de façon restaurable ; sauvegarder la table entière (--tables=${table}).`);
    elements.push({ type: "colonne", table, colonne, cle_primaire: cle, colonnes: defs.filter((d) => cle.includes(d.nom) || d.nom === colonne) });
  }

  const date = new Date();
  const nomDossier = date.toISOString().replace(/[-:]/g, "").replace("T", "-").slice(0, 15);
  const dossier = path.join(RACINE, nomDossier);
  fs.mkdirSync(dossier, { recursive: true });
  for (const el of elements) {
    const [{ n }] = await sql(ctx, `select count(*)::int as n from public.${ident(el.table)}`);
    if (n > MAX_LIGNES) throw new ErreurKit(`${el.table} : ${n} lignes, au-delà du plafond de ${MAX_LIGNES}. Utiliser une sauvegarde de l'offre Pro de Supabase.`);
    const [{ lignes }] = await sql(ctx, `select coalesce(json_agg(x), '[]'::json) as lignes from (${selection(el)}) x`);
    const texte = JSON.stringify(lignes);
    if (Buffer.byteLength(texte) > MAX_OCTETS) throw new ErreurKit(`${el.table} : sauvegarde de plus de 20 Mo. Utiliser une sauvegarde de l'offre Pro de Supabase.`);
    el.fichier = `${el.type === "table" ? el.table : `${el.table}.${el.colonne}`}.json`;
    el.lignes = lignes.length;
    el.sha256 = sha256(texte);
    fs.writeFileSync(path.join(dossier, el.fichier), texte);
    console.log(`  ✓ ${el.type === "table" ? `table ${el.table}` : `colonne ${el.table}.${el.colonne}`} : ${el.lignes} ligne(s)`);
  }
  const manifeste = { format: 1, projet: ctx.ref, date: date.toISOString(), motif: typeof o.motif === "string" ? o.motif : "", elements };
  fs.writeFileSync(path.join(dossier, "manifeste.json"), JSON.stringify(manifeste, null, 2));
  console.log(`\n✓ Sauvegarde créée : ${dossier.replace(/\\/g, "/")}`);
  console.log("  Données réelles : fichier local, à ne jamais committer, envoyer ni coller dans une conversation.");
  console.log(`  Étape suivante obligatoire : node outils/sauvegarde.mjs verifier ${dossier.replace(/\\/g, "/")}`);
}

// ----------------------------------------------------------------------------- verifier

function lireSauvegarde(dossier) {
  const fichier = path.join(dossier ?? "", "manifeste.json");
  if (!dossier || !fs.existsSync(fichier)) throw new ErreurKit("Dossier de sauvegarde introuvable (voir : node outils/sauvegarde.mjs liste).");
  const manifeste = JSON.parse(fs.readFileSync(fichier, "utf8"));
  for (const el of manifeste.elements) {
    const texte = fs.readFileSync(path.join(dossier, el.fichier), "utf8");
    el.texte = texte;
    el.integre = sha256(texte) === el.sha256 && JSON.parse(texte).length === el.lignes;
  }
  return manifeste;
}

/** Essai de restauration dans un bloc annulé : rend { lignes, empreinteRestauree, empreinteBase }. */
async function essaiRestauration(ctx, el) {
  const d = delimiteur(el.texte);
  const tmp = "kit_essai_restauration";
  const creation = el.type === "table"
    ? `create temp table ${tmp} (like public.${ident(el.table)}) on commit drop;`
    : `create temp table ${tmp} on commit drop as ${selection(el)} limit 0;`;
  const empreinte = (source) => `(select coalesce(md5(string_agg(x::text, '|' order by x::text)), '') from (${source}) x)`;
  const bloc = `do $kitbloc$
declare n bigint; e1 text; e2 text;
begin
  ${creation}
  insert into ${tmp} select * from json_populate_recordset(null::${tmp}, ${d}${el.texte}${d}::json);
  select count(*) into n from ${tmp};
  e1 := ${empreinte(`select * from ${tmp}`)};
  e2 := ${empreinte(selection(el))};
  raise exception 'KIT_ESSAI %|%|%', n, e1, e2;
end $kitbloc$;`;
  if (el.texte.includes("$kitbloc$")) throw new ErreurKit("Contenu inattendu dans la sauvegarde ($kitbloc$).");
  try {
    await sql(ctx, bloc);
  } catch (e) {
    const m = /KIT_ESSAI (\d+)\|([0-9a-f]*)\|([0-9a-f]*)/.exec(e.message);
    if (!m) throw new ErreurKit(`Essai de restauration impossible : ${e.message}`);
    return { lignes: Number(m[1]), empreinteRestauree: m[2], empreinteBase: m[3] };
  }
  throw new ErreurKit("Essai de restauration : résultat inattendu.");
}

async function verifier(ctx, dossier) {
  const manifeste = lireSauvegarde(dossier);
  if (manifeste.projet !== ctx.ref) throw new ErreurKit(`Cette sauvegarde vient d'un autre projet (${manifeste.projet}).`);
  console.log(`Sauvegarde du ${new Date(manifeste.date).toLocaleString("fr-FR")}${manifeste.motif ? ` — ${manifeste.motif}` : ""}\n`);
  let ok = true;
  for (const el of manifeste.elements) {
    const nom = el.type === "table" ? `table ${el.table}` : `colonne ${el.table}.${el.colonne}`;
    if (!el.integre) { console.log(`  ✗ ${nom} : fichier altéré (empreinte ou nombre de lignes)`); ok = false; continue; }
    if (!(await tableExiste(ctx, el.table))) { console.log(`  ✗ ${nom} : la table n'existe plus — la vérification doit précéder la suppression`); ok = false; continue; }
    const r = await essaiRestauration(ctx, el);
    if (r.lignes !== el.lignes) { console.log(`  ✗ ${nom} : l'essai de restauration a rendu ${r.lignes} ligne(s) au lieu de ${el.lignes}`); ok = false; continue; }
    if (r.empreinteRestauree !== r.empreinteBase) {
      console.log(`  ✗ ${nom} : les données ont changé depuis la sauvegarde — la refaire juste avant l'opération`);
      ok = false; continue;
    }
    console.log(`  ✓ ${nom} : ${el.lignes} ligne(s), restauration essayée (annulée), identique à la base`);
  }
  if (!ok) {
    console.log("\n✗ Sauvegarde NON exploitable : aucune suppression de données n'est permise.");
    process.exitCode = 1;
    return;
  }
  manifeste.verifiee_le = new Date().toISOString();
  for (const el of manifeste.elements) { delete el.texte; delete el.integre; }
  fs.writeFileSync(path.join(dossier, "manifeste.json"), JSON.stringify(manifeste, null, 2));
  console.log("\n✓ Sauvegarde exploitable : fichiers intègres, restauration essayée avec succès, identique à la base actuelle.");
}

// ----------------------------------------------------------------------------- restaurer

async function restaurer(ctx, dossier, o) {
  const manifeste = lireSauvegarde(dossier);
  if (manifeste.projet !== ctx.ref) throw new ErreurKit(`Cette sauvegarde vient d'un autre projet (${manifeste.projet}).`);
  const cible = typeof o.element === "string" ? o.element : null;
  const elements = manifeste.elements.filter((el) => !cible || cible === (el.type === "table" ? el.table : `${el.table}.${el.colonne}`));
  if (!elements.length) throw new ErreurKit("Élément introuvable dans cette sauvegarde.");
  for (const el of elements) {
    const nom = el.type === "table" ? `table ${el.table}` : `colonne ${el.table}.${el.colonne}`;
    if (!el.integre) throw new ErreurKit(`${nom} : fichier altéré, restauration refusée.`);
    if (!(await tableExiste(ctx, el.table))) {
      console.log(`✗ ${nom} : la table n'existe pas. La recréer d'abord par une migration (colonnes ci-dessous), puis relancer :`);
      for (const c of el.colonnes) {
        console.log(`    ${c.nom} ${c.type}${c.identite ? " generated always as identity" : ""}${c.nullable ? "" : " not null"}${c.defaut ? ` default ${c.defaut}` : ""}`);
      }
      process.exitCode = 1;
      continue;
    }
    const d = delimiteur(el.texte);
    const t = `public.${ident(el.table)}`;
    let requete;
    if (el.type === "table") {
      const [{ n }] = await sql(ctx, `select count(*)::int as n from ${t}`);
      if (n > 0) throw new ErreurKit(`${nom} contient déjà ${n} ligne(s) : restauration refusée (pas de doublons ni d'écrasement).`);
      // Identifiants d'origine conservés (overriding system value), puis compteurs remis après le plus
      // grand identifiant restauré, pour que les prochaines insertions ne créent pas de doublon.
      const compteurs = (await colonnesDe(ctx, el.table))
        .filter((c) => c.identite || /^nextval\(/.test(c.defaut ?? ""))
        .map((c) => `select setval(pg_get_serial_sequence('public.${ident(el.table)}', '${c.nom}'), coalesce(max(${ident(c.nom)}), 0) + 1, false) from ${t};`)
        .join("\n");
      requete = `begin;
insert into ${t} overriding system value select * from json_populate_recordset(null::${t}, ${d}${el.texte}${d}::json);
${compteurs}
commit;`;
    } else {
      const defs = await colonnesDe(ctx, el.table);
      if (!defs.some((c) => c.nom === el.colonne)) throw new ErreurKit(`${nom} : la colonne n'existe pas, la recréer d'abord par une migration.`);
      const jointure = el.cle_primaire.map((k) => `t.${ident(k)} = b.${ident(k)}`).join(" and ");
      requete = `begin;
create temp table kit_restauration on commit drop as ${selection(el)} limit 0;
insert into kit_restauration select * from json_populate_recordset(null::kit_restauration, ${d}${el.texte}${d}::json);
update ${t} t set ${ident(el.colonne)} = b.${ident(el.colonne)} from kit_restauration b where ${jointure};
commit;`;
    }
    await sql(ctx, requete);
    const [{ n }] = await sql(ctx, `select count(*)::int as n from ${t}`);
    console.log(`✓ ${nom} restaurée (${el.lignes} ligne(s) dans la sauvegarde ; la table compte maintenant ${n} ligne(s)).`);
  }
}

// ----------------------------------------------------------------------------- liste

function liste() {
  if (!fs.existsSync(RACINE)) { console.log("Aucune sauvegarde sur cet ordinateur."); return; }
  for (const d of fs.readdirSync(RACINE).sort().reverse()) {
    const f = path.join(RACINE, d, "manifeste.json");
    if (!fs.existsSync(f)) continue;
    const m = JSON.parse(fs.readFileSync(f, "utf8"));
    const contenu = m.elements.map((el) => `${el.type === "table" ? el.table : `${el.table}.${el.colonne}`} (${el.lignes})`).join(", ");
    console.log(`  ${path.join(RACINE, d).replace(/\\/g, "/")}  ${m.verifiee_le ? "✓ vérifiée" : "non vérifiée"}  ${m.motif ?? ""}\n      ${contenu}`);
  }
}

lancer(async () => {
  const [commande, ...reste] = process.argv.slice(2);
  const positionnels = reste.filter((a) => !a.startsWith("--"));
  const o = options(reste.filter((a) => a.startsWith("--")));
  if (commande === "liste") return liste();
  const ctx = contexte();
  ctx.exigerProjet();
  if (commande === "creer") return creer(ctx, o);
  if (commande === "verifier") return verifier(ctx, positionnels[0]);
  if (commande === "restaurer") return restaurer(ctx, positionnels[0], o);
  throw new ErreurKit("Commande inconnue. Possibles : creer, verifier <dossier>, restaurer <dossier>, liste.");
});
