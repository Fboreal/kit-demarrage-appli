#!/usr/bin/env node
// Captures d'écran fidèles, ordinateur (1 280 px) et téléphone (390 px), sans aucune dépendance.
//
// Pourquoi un outil : en mode sans affichage, Edge et Chrome refusent une fenêtre étroite (mesuré :
// 496 px de large pour 390 demandés). Une capture faite avec `--window-size=390,…` montre donc une
// page de 496 px rognée, avec de faux débordements. Ici, le navigateur est piloté par son protocole
// de débogage (DevTools) pour émuler un vrai écran de téléphone, comme le « mode appareil » des
// outils de développement.
//
// Usage :
//   node outils/capture.mjs <adresse> [--nom=accueil] [--largeurs=1280,390] [--pleine-page]
//                           [--attente=1000] [--dossier=.kit/captures]
// Exemples :
//   node outils/capture.mjs http://localhost:3000/
//   node outils/capture.mjs http://localhost:3000/etat --pleine-page
//   node outils/capture.mjs https://mon-appli.vercel.app/ --largeurs=390
//
// Résultat : <dossier>/<nom>-<largeur>.png (le dossier .kit/ est ignoré par Git), et pour chaque
// largeur : statut HTTP, débordement horizontal éventuel (avec les éléments en cause), erreurs
// JavaScript de la page. Code de sortie : 0 = tout est correct, 2 = captures faites mais anomalie
// détectée, 1 = capture impossible.
// Navigateur : Edge ou Chrome trouvés automatiquement ; sinon variable NAVIGATEUR=<chemin complet>.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { ErreurKit, lancer } from "./_env.mjs";

const pause = (ms) => new Promise((r) => setTimeout(r, ms));

/** Taille d'écran émulée pour une largeur donnée. */
function ecranPour(largeur) {
  const mobile = largeur <= 480;
  return {
    width: largeur,
    height: mobile ? 844 : largeur < 1024 ? 1024 : 800,
    mobile,
    libelle: mobile ? "téléphone" : largeur < 1024 ? "tablette" : "ordinateur",
  };
}

function nomDepuisAdresse(adresse) {
  const chemin = new URL(adresse).pathname.replace(/^\/+|\/+$/g, "");
  return chemin ? chemin.replace(/[^a-z0-9]+/gi, "-").toLowerCase().slice(0, 40) : "accueil";
}

function lireOptions(argv) {
  const o = { adresse: null, nom: null, largeurs: [1280, 390], pleinePage: false, attente: 1000, dossier: ".kit/captures" };
  for (const a of argv) {
    if (a === "--aide" || a === "-h") o.aide = true;
    else if (a === "--pleine-page") o.pleinePage = true;
    else if (a.startsWith("--nom=")) o.nom = a.slice(6);
    else if (a.startsWith("--largeurs=")) o.largeurs = a.slice(11).split(",").map((x) => Number(x.trim()));
    else if (a.startsWith("--attente=")) o.attente = Number(a.slice(10));
    else if (a.startsWith("--dossier=")) o.dossier = a.slice(10);
    else if (!a.startsWith("--") && !o.adresse) o.adresse = a;
    else throw new ErreurKit(`Option inconnue : ${a} (voir node outils/capture.mjs --aide)`);
  }
  if (o.aide) return o;
  if (!o.adresse || !/^https?:\/\/[^\s]+$/i.test(o.adresse)) {
    throw new ErreurKit("Indiquez l'adresse de la page, par exemple : node outils/capture.mjs http://localhost:3000/");
  }
  if (!o.largeurs.length || o.largeurs.some((l) => !Number.isInteger(l) || l < 280 || l > 2560)) {
    throw new ErreurKit("--largeurs : nombres entiers entre 280 et 2560, séparés par des virgules (ex. 1280,390).");
  }
  if (!Number.isFinite(o.attente) || o.attente < 0 || o.attente > 30000) {
    throw new ErreurKit("--attente : durée en millisecondes, entre 0 et 30000.");
  }
  o.nom = o.nom ?? nomDepuisAdresse(o.adresse);
  if (!/^[a-z0-9][a-z0-9-]{0,59}$/.test(o.nom)) {
    throw new ErreurKit("--nom : minuscules, chiffres et tirets uniquement (ex. accueil, etat-mobile).");
  }
  return o;
}

function trouverNavigateur() {
  const impose = process.env.NAVIGATEUR;
  if (impose) {
    if (fs.existsSync(impose)) return impose;
    throw new ErreurKit(`NAVIGATEUR=${impose} : fichier introuvable.`);
  }
  const candidats = [];
  if (process.platform === "win32") {
    const bases = [
      process.env["ProgramFiles(x86)"], process.env.ProgramFiles, process.env.LOCALAPPDATA,
      "C:\\Program Files (x86)", "C:\\Program Files",
    ].filter(Boolean);
    for (const b of bases) {
      candidats.push(path.join(b, "Microsoft", "Edge", "Application", "msedge.exe"));
      candidats.push(path.join(b, "Google", "Chrome", "Application", "chrome.exe"));
    }
  } else if (process.platform === "darwin") {
    for (const b of ["/Applications", path.join(os.homedir(), "Applications")]) {
      candidats.push(`${b}/Google Chrome.app/Contents/MacOS/Google Chrome`);
      candidats.push(`${b}/Microsoft Edge.app/Contents/MacOS/Microsoft Edge`);
      candidats.push(`${b}/Chromium.app/Contents/MacOS/Chromium`);
    }
  } else {
    candidats.push("/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/microsoft-edge");
  }
  const trouve = candidats.find((c) => fs.existsSync(c));
  if (!trouve) {
    throw new ErreurKit(
      "Aucun navigateur compatible trouvé (Edge, Chrome ou Chromium). Sur Mac, installez Google Chrome ; " +
        "ou indiquez le chemin : NAVIGATEUR=<chemin complet> node outils/capture.mjs …",
    );
  }
  return trouve;
}

/** Lance le navigateur sans affichage, avec un profil temporaire (jamais celui de l'utilisateur). */
async function demarrerNavigateur(exe) {
  const profil = fs.mkdtempSync(path.join(os.tmpdir(), "kit-capture-"));
  const proc = spawn(
    exe,
    [
      "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run", "--no-default-browser-check",
      "--disable-extensions", "--mute-audio", `--user-data-dir=${profil}`, "--remote-debugging-port=0",
      "about:blank",
    ],
    { stdio: ["ignore", "ignore", "pipe"] },
  );
  let sortie = "";
  let arret = null;
  proc.stderr.on("data", (d) => (sortie += d.toString()));
  proc.on("error", (e) => (arret = `lancement impossible (${e.message})`));
  proc.on("exit", (code) => (arret = arret ?? `arrêt inattendu (code ${code})`));

  const fichierPort = path.join(profil, "DevToolsActivePort");
  for (let i = 0; i < 100; i++) {
    const m = sortie.match(/DevTools listening on (ws:\/\/\S+)/);
    if (m) return { proc, profil, ws: m[1] };
    if (fs.existsSync(fichierPort)) {
      const [port, chemin] = fs.readFileSync(fichierPort, "utf8").split(/\r?\n/);
      if (port && chemin) return { proc, profil, ws: `ws://127.0.0.1:${port}${chemin}` };
    }
    if (arret) break;
    await pause(200);
  }
  proc.kill();
  throw new ErreurKit(`Le navigateur n'a pas démarré : ${arret ?? "délai de 20 s dépassé"}.`);
}

/** Client minimal du protocole DevTools (WebSocket natif de Node 22+). */
class Devtools {
  constructor(adresse) {
    this.ws = new WebSocket(adresse);
    this.numero = 0;
    this.attentes = new Map();
    this.ecouteurs = new Set();
  }
  async ouvrir() {
    await new Promise((ok, ko) => {
      this.ws.onopen = ok;
      this.ws.onerror = () => ko(new ErreurKit("Connexion au navigateur impossible."));
    });
    this.ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.attentes.has(msg.id)) {
        const { ok, ko } = this.attentes.get(msg.id);
        this.attentes.delete(msg.id);
        if (msg.error) ko(new Error(msg.error.message));
        else ok(msg.result);
      } else if (msg.method) {
        for (const f of this.ecouteurs) f(msg);
      }
    };
  }
  envoyer(methode, params = {}, sessionId) {
    const id = ++this.numero;
    this.ws.send(JSON.stringify({ id, method: methode, params, sessionId }));
    return new Promise((ok, ko) => this.attentes.set(id, { ok, ko }));
  }
  attendre(methode, sessionId, delai) {
    return new Promise((ok, ko) => {
      const f = (msg) => {
        if (msg.method === methode && msg.sessionId === sessionId) {
          clearTimeout(minuteur);
          this.ecouteurs.delete(f);
          ok(msg.params);
        }
      };
      const minuteur = setTimeout(() => {
        this.ecouteurs.delete(f);
        ko(new ErreurKit(`La page n'a pas fini de se charger en ${delai / 1000} s.`));
      }, delai);
      this.ecouteurs.add(f);
    });
  }
  fermer() {
    try { this.ws.close(); } catch { /* déjà fermé */ }
  }
}

// Exécuté dans la page : éléments qui dépassent à droite de l'écran (les 5 premiers).
// Largeur de référence = clientWidth : en émulation téléphone, innerWidth s'élargit jusqu'au
// contenu quand la page déborde (mesuré), ce qui masquerait justement le débordement.
const SCRIPT_DEBORDEMENT = `(() => {
  const v = document.documentElement.clientWidth, l = document.documentElement.scrollWidth;
  const fautifs = l > v + 1 ? [...document.querySelectorAll("body *")]
    .filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > v + 1; })
    .slice(0, 5)
    .map((e) => e.tagName.toLowerCase() + (e.id ? "#" + e.id : "") +
      (typeof e.className === "string" && e.className.trim() ? "." + e.className.trim().split(/\\s+/).slice(0, 3).join(".") : ""))
    : [];
  return JSON.stringify({ v, l, h: document.documentElement.scrollHeight, fautifs });
})()`;

async function capturer(dt, opts, largeur) {
  const ecran = ecranPour(largeur);
  const { targetId } = await dt.envoyer("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await dt.envoyer("Target.attachToTarget", { targetId, flatten: true });
  const s = (methode, params) => dt.envoyer(methode, params, sessionId);

  const erreurs = [];
  let statut = null;
  const surveiller = (msg) => {
    if (msg.sessionId !== sessionId) return;
    if (msg.method === "Runtime.exceptionThrown") {
      const d = msg.params.exceptionDetails;
      erreurs.push((d?.exception?.description ?? d?.text ?? "exception").split("\n")[0]);
    } else if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") {
      erreurs.push(msg.params.args.map((a) => a.value ?? a.description ?? "").join(" ").split("\n")[0]);
    } else if (msg.method === "Network.responseReceived" && msg.params.type === "Document" && statut === null) {
      statut = msg.params.response.status;
    }
  };
  dt.ecouteurs.add(surveiller);
  try {
    await s("Page.enable");
    await s("Runtime.enable");
    await s("Network.enable");
    await s("Emulation.setDeviceMetricsOverride", {
      width: ecran.width, height: ecran.height, deviceScaleFactor: 1, mobile: ecran.mobile,
    });
    if (ecran.mobile) await s("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });

    const chargement = dt.attendre("Page.loadEventFired", sessionId, 30000);
    const nav = await s("Page.navigate", { url: opts.adresse });
    if (nav.errorText) {
      chargement.catch(() => {});
      throw new ErreurKit(`Page inaccessible : ${opts.adresse} (${nav.errorText}). L'application est-elle lancée ?`);
    }
    await chargement;
    await s("Runtime.evaluate", { expression: "document.fonts.ready.then(() => true)", awaitPromise: true });
    await pause(opts.attente);

    const { result } = await s("Runtime.evaluate", { expression: SCRIPT_DEBORDEMENT, returnByValue: true });
    const mesure = JSON.parse(result.value);
    const params = { format: "png" };
    if (opts.pleinePage) {
      params.captureBeyondViewport = true;
      params.clip = { x: 0, y: 0, width: ecran.width, height: Math.min(Math.max(mesure.h, ecran.height), 16000), scale: 1 };
    }
    const { data } = await s("Page.captureScreenshot", params);
    const fichier = path.join(opts.dossier, `${opts.nom}-${largeur}.png`);
    fs.writeFileSync(fichier, Buffer.from(data, "base64"));
    return { ecran, fichier, mesure, erreurs, statut };
  } finally {
    dt.ecouteurs.delete(surveiller);
    await dt.envoyer("Target.closeTarget", { targetId }).catch(() => {});
  }
}

lancer(async () => {
  const opts = lireOptions(process.argv.slice(2));
  if (opts.aide) {
    const entete = fs.readFileSync(new URL(import.meta.url), "utf8").split("\nimport ")[0];
    console.log(entete.split(/\r?\n/).filter((l) => l.startsWith("//")).map((l) => l.replace(/^\/\/ ?/, "")).join("\n"));
    return;
  }
  if (typeof WebSocket === "undefined") {
    throw new ErreurKit("Node.js 22 ou plus récent est nécessaire (voir .claude/kit/VERSIONS.md).");
  }
  fs.mkdirSync(opts.dossier, { recursive: true });

  const nav = await demarrerNavigateur(trouverNavigateur());
  const dt = new Devtools(nav.ws);
  let anomalies = 0;
  try {
    await dt.ouvrir();
    for (const largeur of opts.largeurs) {
      const r = await capturer(dt, opts, largeur);
      const titre = `${path.basename(r.fichier)} (${r.ecran.width}×${r.ecran.height}, ${r.ecran.libelle})`;
      const notes = [];
      if (r.statut && r.statut >= 400) notes.push(`statut HTTP ${r.statut}`);
      if (r.mesure.l > r.mesure.v + 1) {
        notes.push(
          `débordement horizontal : contenu de ${r.mesure.l} px pour un écran de ${r.mesure.v} px` +
            (r.mesure.fautifs.length ? ` — éléments en cause : ${r.mesure.fautifs.join(", ")}` : ""),
        );
      }
      if (r.erreurs.length) {
        notes.push(`${r.erreurs.length} erreur(s) JavaScript : ${r.erreurs.slice(0, 3).join(" | ").slice(0, 400)}`);
      }
      if (notes.length) {
        anomalies++;
        console.log(`⚠ ${titre} → ${r.fichier}`);
        for (const n of notes) console.log(`    ${n}`);
      } else {
        console.log(`✓ ${titre} → ${r.fichier} — statut ${r.statut ?? "?"}, aucun débordement, aucune erreur`);
      }
    }
  } finally {
    await dt.envoyer("Browser.close").catch(() => {});
    dt.fermer();
    await Promise.race([new Promise((r) => nav.proc.once("exit", r)), pause(3000)]);
    if (nav.proc.exitCode === null) nav.proc.kill();
    try {
      fs.rmSync(nav.profil, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
    } catch {
      /* profil temporaire : supprimé plus tard par le système */
    }
  }
  if (anomalies) process.exitCode = 2;
});
