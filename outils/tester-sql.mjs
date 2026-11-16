#!/usr/bin/env node
// Exécute un test SQL sur la VRAIE base, dans un bloc qui ANNULE TOUT : rien n'est enregistré.
//
//   node outils/tester-sql.mjs tests/mon-test.sql
//   node outils/tester-sql.mjs tests/mon-test.sql --migration=supabase/migrations/0002_xxx.sql
//   node outils/tester-sql.mjs --modele            affiche un modèle de test à copier
//
// Le fichier de test est un bloc « do $test$ … $test$; » qui :
//   - accumule ses constats dans une variable texte (ex. r) ;
//   - se termine OBLIGATOIREMENT par : raise exception 'RESULTATS %', r;
//     (c'est cette erreur volontaire qui annule tout ; l'outil refuse un test qui ne l'a pas) ;
//   - peut contenir la ligne « -- @MIGRATION » : l'outil y insère la migration à tester, qui est
//     donc appliquée PUIS annulée avec le reste.
import fs from "node:fs";
import { ErreurKit, lancer, lireEnv, refProjet } from "./_env.mjs";

const MODELE = `-- Test : <ce que l'on vérifie>. Rien n'est enregistré (bloc annulé).
do $test$
declare
  r text := '';
  v_n int;
  -- v_utilisateur uuid;   -- un compte existant, pris dans les données (voir ci-dessous)
begin
  -- 1) Jeu d'essai pris dans les données réelles (sans rien créer de durable).
  -- select id into v_utilisateur from auth.users order by created_at limit 1;

  -- 2) Migration à tester (option --migration) :
  -- @MIGRATION

  -- 3) Se mettre dans la peau d'un utilisateur connecté (les règles RLS s'appliquent) :
  -- perform set_config('role', 'authenticated', true);
  -- perform set_config('request.jwt.claims',
  --   json_build_object('sub', v_utilisateur, 'role', 'authenticated')::text, true);

  -- 4) Usage normal : doit fonctionner.
  -- begin
  --   ... ;
  --   r := r || 'T1 usage normal OK | ';
  -- exception when others then r := r || 'T1 KO : ' || sqlerrm || ' | '; end;

  -- 5) Usage interdit : doit être refusé.
  -- begin
  --   ... ;
  --   r := r || 'T2 KO (accepté alors qu''il devait être refusé) | ';
  -- exception when others then r := r || 'T2 OK refusé : ' || sqlerrm || ' | '; end;

  raise exception 'RESULTATS %', r;
end $test$;
`;

lancer(async () => {
  const args = process.argv.slice(2);
  if (args.includes("--modele")) {
    process.stdout.write(MODELE);
    return;
  }
  const fichierTest = args.find((a) => !a.startsWith("--"));
  if (!fichierTest) throw new ErreurKit("Indiquez le fichier de test (ou --modele pour un exemple).");
  if (!fs.existsSync(fichierTest)) throw new ErreurKit(`Fichier introuvable : ${fichierTest}`);

  let sql = fs.readFileSync(fichierTest, "utf8");
  if (!/raise\s+exception\s+'RESULTATS/i.test(sql)) {
    throw new ErreurKit(
      "Le test doit se terminer par « raise exception 'RESULTATS %', r; » : sans cela, ses écritures " +
        "SERAIENT ENREGISTRÉES. Test refusé (voir --modele).",
    );
  }
  if (/^\s*(commit|rollback)\b/im.test(sql)) {
    throw new ErreurKit("Le test ne doit contenir ni COMMIT ni ROLLBACK. Test refusé.");
  }

  const optMigration = args.find((a) => a.startsWith("--migration="));
  if (optMigration) {
    const fichierMig = optMigration.slice("--migration=".length);
    if (!fs.existsSync(fichierMig)) throw new ErreurKit(`Migration introuvable : ${fichierMig}`);
    if (!/--\s*@MIGRATION/.test(sql)) {
      throw new ErreurKit("Le test doit contenir la ligne « -- @MIGRATION » pour y insérer la migration.");
    }
    const migration = fs.readFileSync(fichierMig, "utf8");
    if (migration.includes("$kit_migration$")) throw new ErreurKit("La migration contient le délimiteur réservé $kit_migration$.");
    sql = sql.replace(/--\s*@MIGRATION.*/, () => `execute $kit_migration$\n${migration}\n$kit_migration$;`);
  }

  const env = lireEnv(".env.local");
  const ref = refProjet(env.NEXT_PUBLIC_SUPABASE_URL);
  if (!ref) throw new ErreurKit("NEXT_PUBLIC_SUPABASE_URL absente ou incorrecte dans .env.local.");
  if (!env.SUPABASE_ACCESS_TOKEN) throw new ErreurKit("SUPABASE_ACCESS_TOKEN manquant dans .env.local.");

  const reponse = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  const texte = await reponse.text();

  const m = /RESULTATS\s*([\s\S]*?)(?:\\n|\n)CONTEXT|RESULTATS\s*([\s\S]*?)"\s*}?\s*$/.exec(texte);
  if (!reponse.ok && m) {
    const resultats = (m[1] ?? m[2] ?? "").trim();
    console.log("Résultats du test (rien n'a été enregistré : le bloc a été annulé) :\n");
    const lignes = resultats.split(/\s*\|\s*/).filter(Boolean);
    for (const l of lignes) console.log("  " + (/\bKO\b/.test(l) ? "✗ " : "• ") + l);
    const ko = lignes.filter((l) => /\bKO\b/.test(l)).length;
    console.log(ko ? `\n✗ ${ko} vérification(s) en échec.` : `\n✓ ${lignes.length} vérification(s), aucun échec.`);
    process.exit(ko ? 1 : 0);
  }
  if (!reponse.ok) {
    throw new ErreurKit(`Le test a échoué avant la fin (${reponse.status}) : ${texte.slice(0, 600)}`);
  }
  // Ne devrait jamais arriver (le test est refusé sans « raise exception ») : on le signale fortement.
  throw new ErreurKit("ATTENTION : le bloc s'est terminé sans l'exception RESULTATS — ses écritures ont pu être enregistrées.");
});
