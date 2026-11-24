// Outils du kit — accès commun à l'API de gestion Supabase (jeton de .env.local, jamais affiché).
// Utilisé par supabase.mjs, retour.mjs et sauvegarde.mjs.
import { ErreurKit, lireEnv, refProjet } from "./_env.mjs";

export const API = "https://api.supabase.com/v1";

/** Options « --cle=valeur » / « --drapeau » d'une ligne de commande. */
export function options(liste) {
  return Object.fromEntries(
    liste.map((a) => {
      const i = a.indexOf("=");
      return i < 0 ? [a.replace(/^--/, ""), true] : [a.slice(0, i).replace(/^--/, ""), a.slice(i + 1)];
    }),
  );
}

/** Jeton et référence du projet lus dans .env.local ; `exigerProjet` vérifie qu'un projet est relié. */
export function contexte() {
  const env = lireEnv(".env.local");
  const jeton = env.SUPABASE_ACCESS_TOKEN;
  if (!jeton) {
    throw new ErreurKit(
      "SUPABASE_ACCESS_TOKEN manquant dans .env.local (Supabase > avatar > Account preferences > Access Tokens), " +
        "ou fichier non enregistré.",
    );
  }
  const ctx = { env, jeton, ref: refProjet(env.NEXT_PUBLIC_SUPABASE_URL) };
  ctx.exigerProjet = () => {
    if (!ctx.ref) {
      throw new ErreurKit(
        "Aucun projet dans .env.local (NEXT_PUBLIC_SUPABASE_URL vide ou incorrecte). " +
          "Créez-le avec : node outils/supabase.mjs creer-projet --nom=\"…\"",
      );
    }
  };
  return ctx;
}

export async function api(ctx, methode, chemin, corps) {
  const r = await fetch(`${API}${chemin}`, {
    method: methode,
    headers: { Authorization: `Bearer ${ctx.jeton}`, "Content-Type": "application/json" },
    body: corps ? JSON.stringify(corps) : undefined,
  });
  const texte = await r.text();
  if (!r.ok) {
    let message = texte;
    try { message = JSON.parse(texte).message ?? texte; } catch { /* texte brut */ }
    const e = new ErreurKit(`Supabase a refusé la demande (${r.status}) : ${String(message).slice(0, 500)}`);
    e.statut = r.status;
    throw e;
  }
  return texte ? JSON.parse(texte) : {};
}

/** Exécute du SQL sur la base (API de gestion) et rend les lignes du dernier résultat. */
export function sql(ctx, requete) {
  return api(ctx, "POST", `/projects/${ctx.ref}/database/query`, { query: requete });
}

/** Identifiant SQL contrôlé (table, colonne) : minuscules, chiffres, « _ ». Rend la forme entre guillemets. */
export function ident(nom) {
  if (!/^[a-z_][a-z0-9_]{0,62}$/.test(nom ?? "")) throw new ErreurKit(`Nom de table ou de colonne invalide : ${nom}`);
  return `"${nom}"`;
}
