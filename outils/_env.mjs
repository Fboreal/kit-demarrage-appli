// Outils du kit — fonctions communes (lecture de .env.local sans jamais afficher les valeurs).
import fs from "node:fs";
import path from "node:path";

/** Lit un fichier .env (KEY=valeur, commentaires #, guillemets facultatifs). */
export function lireEnv(chemin = ".env.local") {
  const fichier = path.resolve(chemin);
  if (!fs.existsSync(fichier)) {
    throw new ErreurKit(
      `Fichier introuvable : ${chemin}. Copiez .env.example en .env.local : seuls les deux jetons ` +
        "(Supabase, Vercel) y sont collés à la main, le reste est rempli par les outils.",
    );
  }
  const env = {};
  for (const ligne of fs.readFileSync(fichier, "utf8").split(/\r?\n/)) {
    const m = ligne.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    let valeur = m[2];
    if (/^".*"$/.test(valeur) || /^'.*'$/.test(valeur)) valeur = valeur.slice(1, -1);
    env[m[1]] = valeur;
  }
  return env;
}

/**
 * Écrit des valeurs dans un fichier .env (remplace la ligne « CLE=… » existante, sinon ajoute à la fin),
 * en conservant les commentaires. Les valeurs ne sont jamais affichées.
 */
export function ecrireEnv(valeurs, chemin = ".env.local") {
  const fichier = path.resolve(chemin);
  let lignes = fs.existsSync(fichier) ? fs.readFileSync(fichier, "utf8").split(/\r?\n/) : [];
  for (const [cle, valeur] of Object.entries(valeurs)) {
    if (/[\r\n]/.test(valeur)) throw new ErreurKit(`Valeur invalide pour ${cle}.`);
    const i = lignes.findIndex((l) => new RegExp(`^\\s*${cle}\\s*=`).test(l));
    if (i >= 0) lignes[i] = `${cle}=${valeur}`;
    else {
      if (lignes.length && lignes[lignes.length - 1] === "") lignes.pop();
      lignes.push(`${cle}=${valeur}`, "");
    }
  }
  fs.writeFileSync(fichier, lignes.join("\n"));
}

/** Référence du projet Supabase (« abcd… ») déduite de son URL. */
export function refProjet(url) {
  const m = /^https:\/\/([a-z0-9]{20})\.supabase\.co\/?$/.exec(url ?? "");
  return m ? m[1] : null;
}

/** Erreur destinée à l'utilisateur : message clair, sans pile technique. */
export class ErreurKit extends Error {}

/** Explique une erreur réseau, en particulier un antivirus qui intercepte HTTPS. */
export function expliquerErreurReseau(e) {
  const code = e?.cause?.code ?? e?.code ?? "";
  if (/CERT|SELF_SIGNED|UNABLE_TO_VERIFY/i.test(code)) {
    return (
      "Connexion sécurisée refusée (" + code + ") : un antivirus intercepte probablement les " +
      "connexions HTTPS. Voir .claude/kit/depannage.md, section « Antivirus »."
    );
  }
  return "Connexion impossible (" + (code || e?.message || "erreur réseau") + "). Vérifiez votre accès à Internet.";
}

/** Point d'entrée commun : affiche une erreur lisible et sort avec le code 1. */
export async function lancer(principal) {
  try {
    await principal();
  } catch (e) {
    if (e instanceof ErreurKit) {
      console.error("✗ " + e.message);
    } else if (e instanceof TypeError && /fetch/i.test(e.message)) {
      console.error("✗ " + expliquerErreurReseau(e));
    } else {
      console.error("✗ Erreur inattendue : " + (e?.message ?? e));
    }
    process.exit(1);
  }
}
