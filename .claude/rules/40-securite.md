# Sécurité — règles par défaut

Ces règles viennent d'un audit de sécurité complet d'une application en production. Elles s'appliquent
dès la première ligne de code ; les reprendre dans chaque plan concerné.

## Secrets
- Les clés et mots de passe vivent dans `.env.local` (jamais commité) et, en ligne, dans les variables
  Vercel. **Jamais** dans le code, la conversation, un commit, une capture.
- La **clé secrète** Supabase (`SUPABASE_SECRET_KEY`) ne sert que **côté serveur**, dans un module qui
  importe `"server-only"`, et seulement **après** avoir vérifié les droits de l'appelant. Jamais de
  préfixe `NEXT_PUBLIC_`. Dans Vercel : type **Secret**.
- Claude ne lit jamais `.env.local` ; il vérifie sa validité avec `outils/verifier-env.mjs`.

## Comptes et accès
- **Aucune inscription libre** : les comptes sont créés par un administrateur (réglage Supabase
  « inscriptions fermées », posé au démarrage).
- Le **rôle** d'un compte est rangé dans `app_metadata` (modifiable seulement par le serveur), jamais
  dans `user_metadata` (modifiable par l'utilisateur).
- **Aucune règle permettant à un utilisateur de modifier librement sa propre fiche** (rôle, statut,
  périmètre) : passer par des fonctions contrôlées.
- **Désactiver un compte le coupe partout** : blocage côté Supabase Auth (`ban_duration`), fonctions
  d'accès limitées aux comptes actifs, et vérification « compte actif » dans toute action serveur, route
  et page hors du gabarit protégé.
- **Changement de mot de passe** : exiger le mot de passe actuel ; déconnecter les autres sessions.
- Messages de connexion **génériques** (« e-mail ou mot de passe incorrect »).

## Base de données
- **RLS activée sur toutes les tables**, politiques explicites `to authenticated`, testées avec au
  moins deux utilisateurs (et deux périmètres s'il y en a).
- Le rôle `anon` (visiteur non connecté) ne peut **rien** faire en dehors de la connexion.
- Une mise à jour refusée par la RLS **ne renvoie pas d'erreur** : toujours vérifier les lignes
  réellement modifiées (`.select("id")`) avant tout effet de bord (journal, e-mail, fichier).
- Un filtre d'affichage (sélecteur, cookie) **n'est pas** une protection : le droit est revérifié en
  base ; une demande hors droits est **refusée**, jamais corrigée en silence.

## Fichiers et photos
- Le stockage est **fermé en écriture** aux utilisateurs : le serveur dépose le fichier **après**
  l'accord de la base, avec le client administrateur.
- Le contenu réel des images est contrôlé (signature du fichier : JPEG, PNG, WebP, HEIC), taille
  plafonnée (5 Mo) ; noms de fichiers calculés par le serveur, jamais fournis par le navigateur.
- Données sensibles : espace privé + liens signés à durée limitée.

## Application web
- En-têtes HTTP de sécurité dans `next.config.ts` (anti-intégration, nosniff, Referrer-Policy,
  Permissions-Policy avec `camera=(self)` si l'appareil photo sert) ; CSP d'abord en observation.
- Redirections : uniquement vers des chemins internes en liste blanche (jamais une adresse fournie).
- Exports CSV : neutraliser les cellules texte commençant par `= + - @` (apostrophe devant).
- Erreurs : message clair pour l'utilisateur, détail technique seulement dans les journaux serveur.
- Dépendances : `npm audit --omit=dev` sans faille connue avant une mise en ligne importante.

## Méthode
Pour un contrôle complet : `.claude/kit/deroules/audit-securite.md` (constats revérifiés, corrections par lots validés un par
un, chaque lot testé : attaque refusée **et** usage normal identique).
