#!/usr/bin/env node
// Crée un compte (par défaut : administrateur) dans Supabase Auth. À lancer PAR L'UTILISATEUR dans
// son terminal : l'e-mail et le mot de passe sont saisis ici, jamais dans la conversation avec Claude.
//
//   node outils/creer-admin.mjs                 demande e-mail, prénom, nom, mot de passe
//   node outils/creer-admin.mjs --role=admin    rôle rangé dans app_metadata (défaut : admin)
//   node outils/creer-admin.mjs --essai         vérifie tout sans créer le compte
//
// Le rôle est rangé dans app_metadata (modifiable seulement par le serveur), jamais dans
// user_metadata (modifiable par l'utilisateur lui-même).
import readline from "node:readline";
import { ErreurKit, lancer, lireEnv } from "./_env.mjs";

lancer(async () => {
  const args = process.argv.slice(2);
  const role = (args.find((a) => a.startsWith("--role=")) ?? "--role=admin").slice(7);
  const essai = args.includes("--essai");
  if (!/^[a-z_]{2,40}$/.test(role)) throw new ErreurKit("Rôle invalide (lettres minuscules et _ uniquement).");

  const env = lireEnv(".env.local");
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const cle = env.SUPABASE_SECRET_KEY;
  if (!url || !cle?.startsWith("sb_secret_")) {
    throw new ErreurKit("NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SECRET_KEY manquant / incorrect dans .env.local.");
  }
  if (!process.stdin.isTTY) {
    throw new ErreurKit("Cette commande se lance dans VOTRE terminal (menu Terminal → Nouveau terminal), pas par Claude.");
  }

  console.log(`Création d'un compte « ${role} » sur ${url}\n`);
  const email = (await demander("E-mail : ")).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ErreurKit("E-mail invalide.");
  const prenom = (await demander("Prénom : ")).trim();
  const nom = (await demander("Nom : ")).trim();
  const motDePasse = await demander("Mot de passe (10 caractères minimum, rien ne s'affiche) : ", true);
  if (motDePasse.length < 10) throw new ErreurKit("Mot de passe trop court (10 caractères minimum).");
  const confirmation = await demander("Retapez le mot de passe : ", true);
  if (confirmation !== motDePasse) throw new ErreurKit("Les deux mots de passe sont différents.");

  if (essai) {
    console.log(`\n✓ Essai : tout est prêt pour créer ${email} (${prenom} ${nom}, rôle ${role}). Rien n'a été créé.`);
    return;
  }

  const r = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers: { apikey: cle, Authorization: `Bearer ${cle}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password: motDePasse,
      email_confirm: true,
      app_metadata: { role },
      user_metadata: { prenom, nom },
    }),
  });
  const corps = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = corps.msg || corps.message || corps.error_description || JSON.stringify(corps).slice(0, 300);
    throw new ErreurKit(`Création refusée (${r.status}) : ${msg}`);
  }
  console.log(`\n✓ Compte créé : ${email} — rôle ${role} — identifiant ${corps.id}`);
  console.log("  Vous pouvez maintenant vous connecter à l'application avec cet e-mail et ce mot de passe.");
});

/** Pose une question dans le terminal ; `cache` = la saisie ne s'affiche pas. */
function demander(question, cache = false) {
  return new Promise((resoudre) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (cache) {
      rl._writeToOutput = (texte) => {
        if (texte.includes(question)) rl.output.write(texte);
      };
    }
    rl.question(question, (reponse) => {
      if (cache) process.stdout.write("\n");
      rl.close();
      resoudre(reponse);
    });
  });
}
