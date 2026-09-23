# Historique du projet E-Sambo

Ce fichier suit ce qui a été fait et ce qu'il reste à faire, phase par phase
(voir le cahier des charges pour le détail des phases). À mettre à jour à
chaque étape significative.

## Phase 1 — Socle ✅ (2026-09-23)

- Projet scaffoldé : Vite + React 19 + TypeScript + Tailwind CSS v4.
- Dépendances installées : `react-router-dom`, `@supabase/supabase-js`, `motion`, `clsx`.
- Structure du dépôt : `src/pages`, `src/pages/app`, `src/layouts`, `src/components`,
  `src/context`, `src/lib`, `src/types`, `src/data`.
- Pages publiques : Accueil, À propos, Contact, Faire un don (UI, paiement pas
  encore branché), Connexion, Inscription (tous les champs du cahier des
  charges, sélecteur Faculté → Mention alimenté par
  `docs/universite-antananarivo-etablissements-mentions-parcours.md`).
- Auth Supabase branchée : connexion (`signInWithPassword`) et inscription
  (`signUp` + métadonnées) fonctionnent contre le vrai projet
  (`svifjplsxoeccesskfsu`).
- Espace privé `/app` : layout avec sidebar, `ProtectedRoute` (bloque tant que
  le profil n'est pas `valide`, gère le niveau d'accès admin), page
  « en attente d'approbation », tableau de bord, pages `ComingSoon` pour
  profil / discussions / adidy / annuaire / administration.
- Sécurité : `.env.local` et `docs/Supabase Sambo & Cloudinary.md`
  (clés secrètes en clair) exclus de git ; le frontend n'utilise que la clé
  publique Supabase et le cloud name / preset Cloudinary.
- Vérifié : `npm run build`, `tsc -b` et rendu dans un vrai navigateur
  (Playwright headless, 0 erreur console) sur toutes les pages publiques.

## Phase 2 — Membres 🚧 (en cours)

Fait :
- Migration SQL appliquée sur le vrai projet (`svifjplsxoeccesskfsu`), via
  Supabase Dashboard → SQL Editor le 2026-09-23
  (`supabase/migrations/0001_phase2_membres.sql`) : tables `profiles`,
  `emergency_contacts`, `office_positions`, `position_assignments`,
  `membership_cards`, `contact_requests`, `audit_logs` ; enums catégorie /
  statut / niveau d'accès ; RLS complètes ; trigger `handle_new_user` qui
  crée automatiquement le profil à l'inscription à partir des métadonnées du
  formulaire ; vues publiques `public.directory_profiles` (annuaire, ne
  montre que les coordonnées que le membre a choisi de partager) et
  `public.public_office_team` (bureau affiché sur le site public). Vérifié :
  les 4 fonctions du bureau par défaut sont bien en base.
- Compte administrateur créé et validé : `apple.tsyresy@gmail.com`
  (`access_level = administrateur`, `status = valide`) via l'API Admin
  Supabase Auth + une mise à jour REST du profil avec la clé secrète — le
  contournement service_role du trigger anti-élévation-de-privilèges a
  fonctionné du premier coup.
- Vérifié de bout en bout dans un vrai navigateur (Playwright) : connexion
  avec ce compte → redirection `/app` → section « Administration » visible
  dans la sidebar (Gestion des membres / adidy / contenus).
- Bug trouvé et corrigé pendant ce test : `Dashboard.tsx` affichait
  « Bonjour, null » pour un profil sans prénom (cas du compte admin
  bootstrap, créé sans métadonnées de nom) — corrigé pour ne montrer le
  prénom que s'il existe. À cette occasion, le type TS `Profile`
  (`src/types/index.ts`) a aussi été corrigé : plusieurs champs qu'il
  déclarait `string` sont en réalité nullable en base (`last_name`,
  `first_names`, `birth_date`, `phone`, `residence`, `email`), pour
  permettre exactement ce genre de compte créé par un administrateur sans
  passer par le formulaire d'inscription complet. Le champ `office_position`
  qui n'existe plus en base (remplacé par `position_assignments`) a été
  retiré du type.

- Type `Database` (`src/types/database.ts`) écrit à la main pour correspondre
  exactement à la migration (je ne peux toujours pas faire tourner
  `supabase gen types` sans accès CLI au bon compte) et branché sur
  `createClient<Database>`. A immédiatement attrapé une vraie erreur de type
  dans `Contact.tsx` (valeurs de `FormData` non casté en `string`).
- **`/app/administration/membres` fonctionnelle** (`src/pages/app/admin/AdminMembers.tsx`) :
  liste filtrable par statut (en attente / validés / suspendus / refusés /
  tous), recherche, valider (génère un `member_number` du type `SAMBO-0001`,
  incrémental — simple et suffisant pour une petite association, pas
  pensé pour de la concurrence forte), refuser, suspendre, réactiver,
  changer la catégorie, changer le niveau d'accès, attribuer/retirer une
  fonction du bureau (`position_assignments`). Testé de bout en bout contre
  la vraie base (créer un membre de test → apparaît dans « En attente » →
  Valider → numéro attribué → apparaît dans « Validés » ; fonction du bureau
  assignée → persiste après rechargement de page). Comptes de test supprimés
  après coup.
- **Deux vrais bugs d'authentification trouvés et corrigés pendant ces
  tests**, tous les deux dans `src/context/AuthContext.tsx` :
  1. `ProtectedRoute` ne bloquait que sur le chargement de la *session*, pas
     sur celui du *profil* — une navigation directe (ou un rechargement) sur
     une page admin pouvait rediriger un vrai admin vers `/app` avant que
     son profil ait fini de charger.
  2. Cause plus profonde, reproduite aussi bien en dev qu'en **build de
     production** (donc pas un artefact de React StrictMode) :
     `profileLoading` était un état asynchrone séparé qui pouvait rester à
     `false` pendant un rendu où `session` venait de changer mais où le
     profil correspondant n'avait pas encore été re-fetché — une fenêtre où
     `profileLoading=false` mais `profile` était encore celui (ou `null`) de
     l'état précédent. Corrigé en dérivant `profileLoading` au moment du
     rendu (comparaison entre l'id de session courant et une ref qui
     mémorise pour quel id le profil a réellement été chargé) plutôt que de
     le suivre comme un booléen mis à jour de façon asynchrone. Revérifié 3
     fois de suite en dev et 3 fois en `vite preview` (prod) : plus jamais
     de redirection parasite.

À faire :
- Page `/app/profil` : lecture/édition du profil, visibilité annuaire,
  téléchargement de la carte (dépend de la génération de carte/QR).
- Page `/app/membres` (annuaire) : recherche sur `public.directory_profiles`.
- Carte de membre numérique : génération image/PDF + QR sécurisé — nécessite
  une Supabase Edge Function (les clés secrètes ne doivent jamais passer
  côté client).
- Upload photo de profil : Edge Function avec upload signé Cloudinary (accès
  contrôlé), pas d'upload non signé pour les photos privées.
- Journal d'audit (`audit_logs`) : la table et sa politique de lecture admin
  existent déjà, mais rien n'écrit dedans pour l'instant. À ajouter (trigger
  sur `profiles` qui logue les changements de statut/catégorie/accès) dans
  une prochaine migration — non bloquant, mais utile pour la traçabilité des
  décisions de validation/suspension.

## Phase 3 — Vie associative ⏳ (pas commencée)

- Tableau de bord enrichi (actualités internes, activités à venir).
- `/app/discussions` : fil de discussion, modération.
- Recherche interne complète dans l'annuaire.

## Phase 4 — Gestion (adidy) ⏳ (pas commencée)

- Tables `dues_rules`, `dues_records`.
- `/app/adidy` (vue membre) et `/app/administration/adidy` (vue
  responsable/admin), cartes profil des impayés visibles par tous les
  membres.
- Journal des corrections de paiement (ancien état conservé).

## Phase 5 — Paiements ⏳ (pas commencée)

- Table `donations`.
- Intégration Stripe / PayPal / Orange Money (statut uniforme
  `en_attente` / `confirmé` / `échoué` / `remboursé`), confirmation
  uniquement côté serveur.

## Notes diverses

- `docs/Images et texte for actus et exploit.txt` contient des liens
  Cloudinary déjà en ligne (textes + photos de 6 posts) prêts à être importés
  dans `news` quand cette table existera (Phase 3).
- Le fichier `docs/universite-antananarivo-etablissements-mentions-parcours.md`
  est une recherche datée du 23/09/2026, à reconfirmer auprès des scolarités
  avant mise en production (mentions/parcours changent à chaque habilitation
  MESupReS).
