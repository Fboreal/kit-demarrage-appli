# Design — {{NOM_APP}}

> Charte de l'application et décisions d'interface. Référence complète (jetons, composants,
> dimensions) : `.claude/kit/interface/charte.md` ; modèle visuel : `.claude/kit/interface/maquette.html`
> (ses menus sont des exemples de style). Règles : `.claude/rules/60-interface.md`.

## Charte retenue
- Type : {{TYPE_CHARTE}}
- Couleur principale : {{COULEUR_PRINCIPALE}}
- Accent (dégradé des boutons principaux) : {{ACCENT_1}} → {{ACCENT_2}}
- Logo : {{LOGO}}
- Polices : Plus Jakarta Sans (interface), Fredoka (marque) — chargées par `next/font`.
- Aperçu de la charte dans la maquette : `maquette.html#accueil&c=RRGGBB-RRGGBB-RRGGBB` (principale,
  accent début, accent fin).

## Usage
{{LIEUX_USAGE}}

## Décisions d'interface
(Une ligne par décision, datée, ajoutée par l'évolution qui la prend — exemple : « 2026-12-01 —
liste du matériel triée par date de retour, la plus proche en tête ».)

## Préparer un écran avant de le développer (facultatif)
Pour un écran important, on peut d'abord en discuter la maquette (avec Claude, ou un outil de
maquettage), puis en parler à Claude comme d'une évolution. Brief type :
```
Écran : (nom) — pour : (qui) — sur : (ordinateur / téléphone / les deux)
But : (ce que la personne doit pouvoir faire en arrivant)
Contenu : (informations affichées, actions possibles, action principale)
Contraintes : charte de l'application (couleurs ci-dessus), coque et composants de la maquette du kit,
tableau sur ordinateur et cartes sur téléphone pour les listes, états vide / chargement / erreur.
```
