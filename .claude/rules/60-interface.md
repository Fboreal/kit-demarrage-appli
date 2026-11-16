# Interface — charte et mise en page PC / mobile

Référence obligatoire : `.claude/kit/interface/charte.md` (jetons, dimensions, composants) et
`.claude/kit/interface/maquette.html` (modèle visuel). **Les consulter avant de créer ou de modifier
un écran.** Les menus et écrans de la maquette sont des **exemples de style** : ne rien en reprendre
qui n'ait pas été demandé.

## Principes
- **Application vierge** : aucun menu, aucun écran, aucune gestion de sites ou d'agences tant que
  l'utilisateur ne l'a pas demandé. À la **première rubrique** demandée, introduire la coque complète
  (barre latérale PC, tiroir mobile, repère actif) exactement comme la maquette, avec uniquement les
  menus demandés.
- **Charte** : toujours passer par les **jetons** de `src/app/globals.css` (`primaire`, `accent-1`,
  `accent-2`, `fond`, `panneau`, `ligne`, `encre`…) ; **jamais de couleur en dur** dans un composant.
  Les couleurs de l'application sont celles de `docs/DESIGN.md`.
- **Responsive obligatoire** : chaque écran est pensé et vérifié **sur PC (1 280 px) et sur mobile
  (390 px)**.

## Écrans
- Fil d'Ariane, titre (26 px, extra-gras), sous-titre discret, **un seul bouton principal** (dégradé
  d'accent) par écran.
- **Listes** : barre d'outils collante (recherche, filtres, compteur) ; **tableau sur PC** avec
  en-têtes de colonnes collants, tri par colonne gardé dans l'adresse, ligne entière cliquable ;
  **cartes sur mobile** (vignette, nom, ligne secondaire, pastilles) avec un « Trier par ».
- **Sous-pages** (fiche, création, détail) : flèche de retour qui ramène au même endroit de la liste.
- **États** prévus partout : vide (avec une phrase d'aide et l'action utile), chargement (squelettes à
  reflet animé), erreur (message simple + « Réessayer »).
- **Formulaires** : libellé au-dessus du champ, message d'erreur précis sous le champ, bouton principal
  à droite ; action destructrice toujours confirmée dans une fenêtre.

## Confort mobile
- Champs à **16 px** sur écran tactile (sinon l'iPhone zoome) ; cibles tactiles d'au moins 40 px.
- **Jamais de défilement horizontal** de la page ; seul le contenu principal défile.
- Application installable sur l'écran d'accueil (manifeste, couleur de thème = couleur principale).

## Accessibilité
Contrastes suffisants (texte blanc sur l'accent compris), focus visible, libellé sur chaque bouton-icône,
`aria-sort` sur les colonnes triables.
