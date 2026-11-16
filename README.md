# Kit-Appli — créez votre application web, guidé pas à pas par Claude

Ce dossier contient tout ce qu'il faut pour créer **votre propre application web**, même si vous n'avez
jamais programmé. Vous dialoguez avec **Claude Code** dans VS Code : il vous pose des questions, vous
guide pour créer vos comptes, écrit le code, le vérifie et met l'application en ligne.

Votre application démarre **vierge** : vous y ajoutez ensuite, à votre rythme, les écrans et menus
dont **vous** avez besoin — pour vous seul, pour votre équipe ou pour votre entreprise.

> **Version 1.0** — prévue pour Windows 10/11 et macOS. Un blocage, une étape peu claire ? Signalez-le
> dans l'onglet **Issues** de cette page : chaque retour améliore le kit.

## Ce qu'il vous faut

| Élément | Détail |
|---|---|
| Un ordinateur | Windows 10 ou 11, ou un Mac récent |
| **Abonnement Claude Pro** (minimum) | Claude Code n'est pas inclus dans l'offre gratuite |
| **VS Code** | gratuit : https://code.visualstudio.com (version 1.94 ou plus récente) |
| L'extension **Claude Code** | dans VS Code : icône Extensions → chercher « Claude Code » (éditeur : Anthropic) → Installer, puis se connecter avec son compte Claude |
| Une adresse e-mail | pour créer vos comptes GitHub, Supabase et Vercel (gratuits) pendant le démarrage |
| Un navigateur Edge ou Chrome | Edge est déjà installé sous Windows ; sur Mac, installez Google Chrome (Claude s'en sert pour vérifier l'affichage sur ordinateur et sur téléphone) |
| Environ 1 h 30 à 2 h | en une ou plusieurs fois : on peut s'arrêter et reprendre à tout moment |

Tout le reste (Git, Node.js et l'outil GitHub) est installé **avec vous** pendant le démarrage.

## Les 3 gestes pour démarrer

1. **Téléchargez** le kit (en haut de cette page : bouton vert « Code » → « Download ZIP ») et
   décompressez-le dans un dossier **hors OneDrive / iCloud**, par exemple `C:\Users\VotreNom\Projets\`
   ou `~/Projets/`. **Renommez** le dossier obtenu (`kit-demarrage-appli-main`) avec le nom de votre
   application, en minuscules, sans espace ni accent (exemple : `gestion-materiel`).
2. **Ouvrez ce dossier dans VS Code** (menu Fichier → Ouvrir le dossier…). Acceptez les deux questions
   de confiance (« Faire confiance aux auteurs » dans VS Code, puis celle de Claude Code).
3. Ouvrez le **panneau Claude** (icône Claude en haut à droite ou dans la barre latérale) et tapez :

```
/demarrer
```

Claude prend le relais, **dans cette même conversation, du début à la fin** : gardez-la toujours.
Si vous fermez VS Code en cours de route, rouvrez le dossier, puis cette conversation (bouton
d'historique des conversations, en haut du panneau Claude) et écrivez « on continue » : il reprend
exactement où vous en étiez.

## Ce que fait le démarrage

1. Il vous pose quelques questions sur votre application (nom, usage, couleurs…).
2. Il installe les outils nécessaires sur votre ordinateur.
3. Il vous guide, clic par clic, pour créer vos comptes **GitHub** (le code), **Supabase** (la base de
   données) et **Vercel** (la mise en ligne). Vous n'avez qu'à cliquer sur « Autoriser » et à coller
   **deux jetons** dans un fichier : Claude crée la base de données, récupère les clés et relie le
   tout lui-même.
4. Il crée votre application vierge, à vos couleurs, vous la montre sur votre ordinateur, puis la met
   **en ligne**.
5. Il vous fait vivre une première évolution complète, pour que vous sachiez faire seul ensuite.

## Ensuite : demandez simplement

Aucune commande à retenir. Écrivez à Claude ce que vous voulez, comme à un collègue :

| Vous écrivez par exemple | Claude… |
|---|---|
| « Je voudrais une page pour suivre le matériel prêté » | pose ses questions, vous soumet un plan, puis le réalise et vous présente la modification à valider sur GitHub |
| « C'est fusionné » | vérifie la mise en ligne et vous guide pour tester |
| « Où en est-on ? » | fait le point complet du projet |
| « Vérifie la sécurité » | contrôle tout et vous propose des corrections, par étapes |
| « Je change d'ordinateur » | vous aide à tout réinstaller sur le nouveau poste |

## Coûts et limites à connaître

- **Claude** : abonnement Pro minimum.
- **GitHub** : gratuit.
- **Supabase** (offre gratuite) : 2 projets actifs maximum ; un projet **sans activité pendant une
  semaine est mis en pause** (on le relance d'un clic) ; **pas de sauvegarde automatique**.
- **Vercel** (offre Hobby, gratuite) : réservée à un **usage personnel et non commercial**. Une
  application utilisée par une entreprise relève de l'offre **Pro** (payante).

## Bonnes pratiques de sécurité

- Ne collez **jamais** une clé, un jeton ou un mot de passe dans la conversation avec Claude : il vous
  indiquera toujours le fichier où les coller.
- Le fichier `.env.local` contient vos clés : il ne quitte jamais votre ordinateur.
- C'est **vous** qui validez chaque modification sur GitHub avant sa mise en ligne.

---

Le kit applique automatiquement une méthode de travail éprouvée (une demande de modification par
évolution, base de données versionnée, contrôles avant chaque mise en ligne, journal des évolutions).
Tout est décrit dans `.claude/rules/` et `docs/` — vous n'avez pas besoin de le lire pour démarrer.

## Licence

Kit distribué sous **licence MIT** (fichier `LICENSE`) : vous pouvez l'utiliser librement, y compris pour
une application commerciale, le modifier et le partager, en conservant la mention de licence. Il est
fourni tel quel, sans garantie. **L'application que vous créez avec lui vous appartient.**
