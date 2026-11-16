# Captures d'écran — contrôle visuel PC et téléphone

Toute modification d'interface est **regardée** avant la PR, à **1 280 px** (ordinateur) et **390 px**
(téléphone), et comparée à la charte (`interface/charte.md`) et à la maquette (`interface/maquette.html`).

## L'outil
```
node outils/capture.mjs <adresse> [--nom=…] [--largeurs=1280,390] [--pleine-page] [--attente=1000]
```
- Produit `.kit/captures/<nom>-<largeur>.png` (dossier ignoré par Git), puis Claude **ouvre chaque
  image** (outil de lecture de fichiers) et la commente.
- Contrôle automatiquement, pour chaque largeur : le **statut HTTP**, le **débordement horizontal**
  (avec les éléments qui dépassent) et les **erreurs JavaScript** de la page.
- Code de sortie : `0` tout est correct · `2` captures faites mais anomalie à corriger · `1` capture
  impossible (application non lancée, navigateur absent…).
- Navigateur : Edge ou Chrome, trouvés automatiquement (Windows : Edge est toujours présent ; Mac :
  installer Google Chrome si besoin). Sinon : `NAVIGATEUR=<chemin complet> node outils/capture.mjs …`.
- Le navigateur tourne sans fenêtre, avec un **profil temporaire** effacé à la fin : aucun accès aux
  sessions ni aux mots de passe de l'utilisateur.

**Ne pas** utiliser `--screenshot` avec `--window-size` : en mode sans affichage, Edge et Chrome
imposent une largeur minimale (mesuré : 496 px pour 390 demandés) ; la « capture mobile » montrerait
une page de 496 px rognée, avec de faux débordements. L'outil émule un vrai écran de téléphone.

## Déroulé
1. Lancer l'application **en arrière-plan** : `npm run dev` (attendre la ligne « Ready »), ou, plus
   proche de la mise en ligne, `npm run build` puis `npm run start`.
2. Capturer chaque page modifiée :
   ```
   node outils/capture.mjs http://localhost:3000/
   node outils/capture.mjs http://localhost:3000/etat --pleine-page
   ```
3. Ouvrir les images et vérifier (grille ci-dessous). Corriger, recapturer.
4. **Arrêter** le serveur à la fin (§ Arrêter le serveur).
5. Page en ligne (étapes E7 et E8, recette) : même commande avec l'adresse Vercel, souvent
   `--largeurs=390` suffit.

## Arrêter le serveur
Sous Windows, arrêter la tâche de fond ne suffit pas toujours : le processus Node peut continuer à
occuper le port (constaté), et la capture suivante montrerait alors l'**ancienne** version. Arrêter
le processus qui écoute sur le port, puis vérifier qu'il est libre :
- Windows (PowerShell) :
  `Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }`
- Mac : `lsof -ti tcp:3000 | xargs kill`
Avant de relancer `npm run dev` ou `npm run start`, s'assurer que le port est libre : sinon Next
démarre sur un autre port (3001…) ou échoue (`EADDRINUSE`).

## Grille de vérification
- **Débordement** : aucun à 390 px (l'outil le signale ; jamais de défilement horizontal de la page).
- **En-tête** : 64 px, blanc, logo à gauche ; rien ne se chevauche à 390 px.
- **Couleurs** : celles de `docs/DESIGN.md` (pas de bleu ou de gris « par défaut » de Tailwind).
- **Polices** : Plus Jakarta Sans pour l'interface, Fredoka pour la marque (pas de police système).
- **Textes** : lisibles, pas tronqués ; titres et boutons conformes à la charte (§4 et §5).
- **États** : vide, chargement, erreur — à capturer aussi quand l'évolution en ajoute.
- **Mobile** : tableaux devenus cartes, boutons assez grands (cibles d'au moins 44 px), champs à 16 px.

## Limites
- Pages réservées aux comptes connectés (quand la connexion existera) : l'outil n'a pas de session.
  Capturer les pages publiques, et demander à l'utilisateur de vérifier les autres sur son téléphone ;
  **ne jamais** ajouter de porte dérobée pour contourner la connexion.
- Les captures montrent les données affichées : ne jamais les committer ni les publier si elles
  contiennent de vraies données.
