# Charte et mise en page de référence

> Fiche technique de la charte par défaut du kit (issue d'une application en production). Le modèle
> visuel est `maquette.html` (même dossier) : **toujours le consulter avant de créer ou modifier un
> écran**. Les règles d'application sont dans `.claude/rules/60-interface.md`.
> Stack visée : Next.js (App Router) + Tailwind CSS v4.
>
> **Les menus et écrans de la maquette sont des EXEMPLES de style.** Une application créée avec le kit
> démarre **vierge** (§3 bis) : aucun menu, aucune gestion de sites ou d'agences n'est construit tant
> que l'utilisateur ne l'a pas demandé.

## 1. Deux couleurs, un thème

Tout le thème dérive de **deux couleurs** choisies au démarrage :

| Rôle | Défaut | Usage |
|---|---|---|
| Principale | `#3E4C8A` (indigo) | structure, liens, éléments actifs, titres de marque |
| Accent (dégradé) | `#FF9A76` → `#FF6F91` (corail → rose) | action principale, avatar, repère actif, pastilles |

- **Charte par défaut conservée** → utiliser les valeurs exactes du tableau §2.
- **Couleurs personnalisées** → garder les mêmes noms de jetons et **dériver** les teintes avec
  `color-mix()` (formules du §2). Vérifier le contraste texte blanc sur l'accent (≥ 4,5:1 pour le texte
  des boutons) ; si insuffisant, foncer la fin du dégradé.
- Aperçu d'une personnalisation : `maquette.html#c=RRGGBB-RRGGBB-RRGGBB` (principale, accent début,
  accent fin), par exemple `maquette.html#liste&c=0f766e-f6b04a-f97316`.

## 2. Jetons (`src/app/globals.css`, bloc `@theme` de Tailwind v4)

| Jeton | Défaut exact | Formule si couleurs personnalisées |
|---|---|---|
| `--color-primaire` | `#3e4c8a` | couleur choisie |
| `--color-primaire-fonce` | `#333f73` | `color-mix(in oklab, var(--color-primaire) 82%, black)` |
| `--color-primaire-moyen` | `#5e70b8` | `color-mix(in oklab, var(--color-primaire) 78%, white)` |
| `--color-primaire-doux` | `#93a6de` | `color-mix(in oklab, var(--color-primaire) 50%, white)` |
| `--color-primaire-wash` | `#e4e9fb` | `color-mix(in oklab, var(--color-primaire) 13%, white)` |
| `--color-accent-1` | `#ff9a76` | couleur choisie |
| `--color-accent-2` | `#ff6f91` | couleur choisie |
| `--color-fond` | `#eef0fa` | `color-mix(in oklab, var(--color-primaire) 8%, white)` |
| `--color-panneau` | `#f7f8fc` | `color-mix(in oklab, var(--color-primaire) 3.5%, white)` |
| `--color-ligne` | `#eceef7` | `color-mix(in oklab, var(--color-primaire) 8%, white)` |
| `--color-succes` | `#7fd9c4` | fixe |
| `--color-encre` | `#1b2036` | fixe (texte principal) |
| `--color-encre-douce` | `#4b5468` | fixe (texte secondaire) |
| `--color-sourdine` | `#8890a6` | fixe (aides, sous-titres) |

Couleurs d'état (fixes) : succès texte `#1F8A6E` / fond `#E3F8F3` ; danger texte `#C1443A` / fond
`#FDEAE8` / bord `#F6CAC5` ; attention texte `#8A6A1F` / fond `#FDF8EC` / bord `#F0DDB0`. Texte des
tableaux `#5A6178`, en-têtes de colonnes `#7A8299`, bord des champs `#E2E5F2`, bord secondaire `#D8DEF5`.

Polices (via `next/font/google`, variables CSS) :
- **Plus Jakarta Sans** → `--font-sans` (toute l'interface) ;
- **Fredoka** → `--font-marque` (logo et titres de marque seulement).

Logo par défaut : le nom de l'application en Fredoka, **en deux tons** — première partie en principale
(gras), seconde partie en dégradé d'accent (texte « découpé » dans le dégradé). Un logo fourni par
l'utilisateur remplace ce logo texte.

## 3. Coque de l'application

| Élément | Règle |
|---|---|
| Structure | coque fixe plein écran ; **seul le contenu principal défile** (jamais la fenêtre) |
| En-tête | hauteur 64 px, fond blanc, bord bas `ligne`, marges 28 px (16 px sous 1 024 px) ; à gauche : bouton menu (mobile, s'il existe des menus), logo ; à droite : icônes éventuelles (40 px), séparateur, menu du compte (avatar 34 px en dégradé, nom, rôle) une fois la connexion en place |
| Barre latérale | 280 px, fond `#FBFCFE`, marge interne 16 px ; sections titrées (10,5 px, majuscules, `#BEC3D6`) « Principal » puis « Système » séparées par un trait |
| Entrée de menu | arrondi 12 px, 10 × 14 px, 14 px demi-gras, texte `encre-douce` ; active : fond `primaire-wash`, texte `primaire`, repère vertical 4 × 20 px en dégradé d'accent à gauche |
| Rubrique repliable | entrée + chevron (pivoté si fermée) ; sous-entrées décalées avec un filet gauche, 12,5 px, `sourdine`, actives en `primaire-wash` ; rubrique ouverte d'office quand on y est |
| Mobile (< 1 024 px) | barre latérale masquée ; bouton menu → **tiroir** 280 px (85 % max) avec voile noir 40 % |
| Menu du compte | carte arrondie 16 px, ombre douce teintée principale, au-dessus de tout (z-index de l'en-tête 30) |

## 3 bis. Application vierge (état au sortir du démarrage)

- **Aucun menu** : pas de barre latérale ni de tiroir tant que l'utilisateur n'a pas créé sa première
  rubrique. L'application ne contient que :
  - l'**en-tête** (logo seul) ;
  - une **page d'accueil** aux couleurs de l'appli (titre, phrase de présentation, prochaines étapes) ;
  - une **page « état »** qui contrôle la connexion à la base ;
  - les écrans techniques : chargement, erreur, page introuvable.
- **Aucun périmètre** (site, agence…) : si l'utilisateur en a besoin plus tard, c'est une évolution
  qu'il demande, avec son propre plan.
- **Première rubrique demandée** → introduire la coque complète du §3 (barre latérale PC, tiroir mobile,
  repère actif) exactement comme la maquette, avec uniquement les menus demandés.

## 4. Pages

- Marges du contenu : 32 px (16 px sous 1 024 px), éléments espacés de 20 px.
- **Fil d'Ariane** 12,5 px `sourdine`, page courante en demi-gras `primaire`.
- **Titre** 26 px extra-gras `encre` (22 px sous 768 px) ; **sous-titre** 13 px `sourdine`.
- **Actions** à droite du titre (passent dessous sur mobile) ; **un seul bouton principal** par écran.
- **Sous-pages** (fiche, création, détail) : flèche de retour 36 px à gauche du titre ; elle ramène à la
  liste d'origine **au même endroit** (filtres, page, position de défilement).
- **Onglets** de fiche : soulignement 2,5 px `primaire` sur l'onglet actif.

## 5. Composants

| Composant | Règle |
|---|---|
| Bouton principal | dégradé accent, texte blanc gras 14 px, arrondi 12 px, 10 × 20 px, ombre `0 4px 14px` accent 35 %, léger soulèvement au survol |
| Bouton secondaire | fond blanc, bord 1,5 px `#D8DEF5`, texte `primaire` demi-gras |
| Bouton discret / danger | discret : sans bord, `encre-douce` ; danger : bord `#F6CAC5`, texte `#C1443A` (toujours confirmé) |
| Champ | arrondi 10 px, bord 1,5 px `#E2E5F2`, 9 × 12 px, 13,5 px ; focus : bord `primaire` + halo 3 px `primaire` 15 % ; erreur : bord et message rouges sous le champ |
| Carte | fond blanc, bord 1 px `ligne`, arrondi 16 px, marge interne 16 à 20 px |
| Pastille de statut | arrondi complet, 4 × 10 px, 11,5 px gras, point coloré ; même code couleur partout |
| Alerte | arrondi 12 px, fond et bord de l'état (succès / attention / erreur) |
| Fenêtre de confirmation | carte 18 px d'arrondi, voile `encre` 45 %, boutons à droite (Annuler discret + action) |
| Vignette | carré arrondi 12 px (44 px en tableau, 56 px en carte) : photo, sinon initiales sur dégradé `primaire-wash` |

## 6. Listes (règle pour TOUTE liste)

- **Barre d'outils collante** en haut de la zone qui défile (recherche, filtres, compteur, actions
  secondaires), fond `panneau`, filet bas ; elle publie sa hauteur dans `--barre-outils-h`.
- **PC (≥ 768 px) : tableau** dans une carte ; en-tête de colonnes **collant juste sous la barre
  d'outils** (`top: var(--barre-outils-h)`), 11 px gras majuscules `#7A8299` sur `#FAFBFE` ; cellules
  16 × 12 px, 13 px `#5A6178` ; codes en chasse fixe ; nombres alignés à droite, chiffres tabulaires.
  Conteneur en `overflow-x: clip` (jamais `auto`, qui casse l'en-tête collant).
- **Mobile (< 768 px) : cartes** — vignette 56 px, nom en gras 14 px, ligne secondaire 12 px, références
  en chasse fixe séparées par « · », pastilles ; liste « Trier par » au-dessus.
- **Tri** par clic sur l'en-tête (second clic = sens inverse, chevrons, `aria-sort`), gardé dans l'URL ;
  valeurs vides toujours en fin ; tri « à la française » (accents et casse ignorés, nombres naturels).
- **Ligne entière cliquable** (Ctrl/Cmd + clic = nouvel onglet, Entrée au clavier, sélection de texte
  sans navigation) ; liens et boutons internes gardent leur action.

## 7. États et confort

- **Vide** : rond 56 px `primaire-wash` + icône, titre gras 14 px, phrase d'aide, action si utile.
- **Chargement** : squelettes à **reflet animé** (dégradé `#E4E7F2` → `#F1F3FA`), un `loading.tsx` par zone.
- **Erreur** : message simple, données rassurées, bouton « Réessayer » ; un `error.tsx` par zone.
- **Mobile** : champs à **16 px** sur écran tactile (sinon iOS zoome) ; **jamais de défilement
  horizontal** de la page ; cibles tactiles ≥ 40 px ; appli installable (manifeste, couleur de thème =
  principale, icône).
- **Accessibilité** : contrastes suffisants, focus visible, libellés sur les boutons-icônes.

## 8. Points de rupture

`md` = 768 px (tableau ↔ cartes, grilles sur une colonne) · `lg` = 1 024 px (barre latérale ↔ tiroir).
Contrôle visuel obligatoire à **1 280 px** et **390 px** avant toute PR qui touche l'interface.
