# E1 — Votre application (questions, puis documents)

Objectif : comprendre l'application pour remplir `CLAUDE.md` et `docs/`. **Rien n'est développé ici.**
Poser les questions **une par une** ; utiliser l'outil de questions à choix quand il y a des options.
Si une réponse est vague, demander un exemple concret. Rester bref : 10 minutes environ.

## Questions
1. **Nom** de l'application (tel qu'il s'affichera). En déduire un **identifiant** (slug) en
   minuscules et tirets — normalement le nom du dossier ; le faire confirmer.
2. **En une phrase**, à quoi sert-elle ? (proposer une reformulation claire et la faire valider)
3. **Pour qui ?** (choix) : moi seul · mon équipe · plusieurs équipes ou sites · des clients ou
   partenaires extérieurs. *Information seulement* : aucun rôle, aucune gestion de sites n'est
   développé maintenant ; ce sera une évolution s'il le souhaite.
4. Les **trois premières choses** qu'elle doit permettre de faire (par ordre d'importance).
5. Les **informations principales** qu'elle manipulera (ex. matériel, clients, interventions…).
6. **Où sera-t-elle utilisée ?** (choix) : surtout au bureau · surtout sur le terrain (téléphone) ·
   les deux. Prendra-t-on des **photos** ?
7. **Couleurs** (choix) : garder la **charte standard** (indigo + corail→rose, recommandé) ·
   choisir mes couleurs. Si « mes couleurs » : proposer 3 à 4 paires (principale + accent) adaptées à
   l'activité, puis faire **prévisualiser** avec la maquette :
   `.claude/kit/interface/maquette.html#accueil&c=RRGGBB-RRGGBB-RRGGBB` (dire à l'utilisateur
   d'ouvrir ce fichier dans son navigateur, ou de double-cliquer dessus puis d'ajouter la fin
   d'adresse). Vérifier le contraste du texte blanc sur l'accent.
8. **Logo** (choix) : logo texte à deux tons (recommandé, aucun fichier nécessaire) · j'ai un logo
   (il le déposera plus tard dans `public/`). Pour le logo texte : proposer où couper le nom
   (« Matério » + « thèque »).
9. **Usage commercial ?** L'application servira-t-elle à une entreprise ou à des clients ?
   Si oui, expliquer que l'hébergement gratuit de Vercel (Hobby) est réservé à un usage personnel :
   il faudra l'offre Pro (payante) ; on peut démarrer en Hobby pour tester.

## Récapitulatif
Présenter un résumé clair de toutes les réponses, puis demander (choix) : **Valider** · **Corriger**.
Corriger autant que nécessaire.

## Remplissage (après validation)
- `CLAUDE.md` : `{{NOM_APP}}`, `{{UNE_PHRASE}}`, `{{POUR_QUI}}`.
- `docs/CONTEXTE.md` : `{{NOM_APP}}`, `{{UNE_PHRASE}}`, `{{POUR_QUI}}`, `{{LIEUX_USAGE}}` (bureau /
  terrain, photos), `{{PRIORITES}}` (les trois premières choses, numérotées), `{{INFORMATIONS}}`,
  `{{POINTS_A_PRECISER}}` (« Aucun pour l'instant » s'il n'y en a pas).
- `docs/ROADMAP.md` : `{{NOM_APP}}`, `{{EVOLUTIONS}}` — les trois premières choses deviennent les
  prochaines évolutions, dans l'ordre, une ligne chacune (« 1. **Titre** — ce que l'utilisateur
  pourra faire »), sans découpage technique.
- `docs/DESIGN.md` : `{{NOM_APP}}`, `{{TYPE_CHARTE}}` (standard du kit / personnalisée),
  `{{COULEUR_PRINCIPALE}}`, `{{ACCENT_1}}`, `{{ACCENT_2}}` (valeurs hexadécimales), `{{LOGO}}`
  (découpage du logo texte, ou « fichier fourni »), `{{LIEUX_USAGE}}`.
- `docs/MODELE_DONNEES.md` : `{{NOM_APP}}`, `{{PISTES_DONNEES}}` (informations principales en
  « pistes » : pas encore de tables).
- `.kit/etat.json` : `infos.nom_app`, `slug`, `pour_qui`, `couleurs`, `usage_commercial`.
Remplacer **tous** les `{{…}}` de ces fichiers (les autres documents n'en contiennent pas).

## Vérification
- Plus aucun `{{` dans `CLAUDE.md` et `docs/` (recherche dans les fichiers).
- Le récapitulatif a été validé par l'utilisateur.
Preuve : « documents remplis (CLAUDE.md, CONTEXTE, ROADMAP, DESIGN, MODELE_DONNEES) ; résumé validé ».
Enchaîner sur E2, dans la même conversation.
