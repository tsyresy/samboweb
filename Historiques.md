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
- **Actualités et réalisations avec du vrai contenu** (2026-09-23) :
  `src/data/news.ts` reprend les 6 posts déjà publiés par l'association
  (`docs/Images and texte for actus et exploit.txt`, textes récupérés
  directement depuis Cloudinary) — accueil (3 mis en avant, ceux avec le
  plus d'impact factuel : Marovoay, tournoi FI.ZA.MA.MI, soutien aux
  étudiants), page `/actualites` (liste complète des 6) et
  `/actualites/:slug` (détail avec galerie photo). Objectif : crédibilité
  immédiate sans attendre la table `news` (Phase 3) ni un éditeur admin.
  Note : je n'avais pas les vraies dates de publication de ces posts — je
  n'en ai pas inventé, l'ordre affiché est un choix éditorial (les
  réalisations les plus parlantes en premier), pas un tri chronologique.
  Quand la table `news` existera, prévoir un vrai champ date.
- **Vidéo d'animation SAMBO en fond du hero** (accueil) : lecture en boucle,
  muette, autoplay, `object-cover`. Superposition dégradée pour garder le
  texte lisible. Respecte `prefers-reduced-motion` (vidéo mise en pause sur
  sa première image pour les visiteurs concernés). Vérifié en vrai
  navigateur, desktop et mobile.

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
- **Premier commit poussé sur GitHub** : `git@github.com:tsyresy/samboweb.git`,
  branche `main`.
- **Confirmation email désactivée** (Supabase Dashboard → Authentication →
  Providers → Email → « Confirm email » décoché, fait manuellement le
  2026-09-23) : chaque inscription déclenchait l'envoi d'un email de
  confirmation, ce qui a vite cogné le rate limit très bas du service email
  intégré de Supabase (« email rate limit exceeded », erreur 429 rencontrée
  en test puis par l'utilisateur en conditions réelles). Décision cohérente
  avec le cahier des charges : c'est la validation par un administrateur qui
  fait foi, pas un lien reçu par email. Revérifié après coup : inscription
  de bout en bout sans erreur, session auto-établie immédiatement après
  `signUp` (comportement normal quand la confirmation est désactivée), et
  la ligne `profiles` bien créée par le trigger avec toutes les valeurs du
  formulaire et `status = en_attente`.

- **`/app/profil`** : lecture et édition du profil (surnom, téléphones,
  résidence, études — masqué si « je n'étudie plus » —, contact d'urgence
  en upsert sur `emergency_contacts`), plus deux cases à cocher pour choisir
  ce qui est visible dans l'annuaire (téléphone / email). Catégorie, statut
  et numéro de membre affichés en lecture seule (protégés côté DB de toute
  façon par le trigger anti-élévation-de-privilèges). Section carte de
  membre en placeholder tant que la génération QR n'existe pas. Bug
  d'accessibilité trouvé et corrigé pendant le test : le champ résidence
  n'avait ni `<label htmlFor>` ni `id` — juste un `<legend>` de fieldset, qui
  ne labellise pas un input ; j'ai profité de la relecture pour corriger la
  même chose sur mention/niveau d'étude/identifiant étudiant/contact
  d'urgence.
- **`/app/membres`** (annuaire) : recherche client-side (nom, prénom,
  surnom, numéro) sur `public.directory_profiles`. Testé en vrai : montre
  bien uniquement les coordonnées que chaque membre a choisi de partager.

- **Upload de photo de profil** : `supabase/functions/cloudinary-sign/index.ts`
  (Edge Function Deno) signe un upload Cloudinary côté serveur — la clé
  secrète Cloudinary ne quitte jamais le serveur, le navigateur envoie
  ensuite le fichier directement à Cloudinary avec cette signature à usage
  unique (dossier scopé par `user_id`, un membre ne peut pas signer un
  upload dans le dossier d'un autre). Branché sur `/app/profil` (« Changer
  ma photo »). `src/lib/cloudinary.ts` a la fonction `uploadSignedPhoto`.
- **Journal d'audit** : `supabase/migrations/0002_audit_log_profile_changes.sql`
  — trigger qui logue automatiquement dans `audit_logs` tout changement de
  `status` / `category` / `access_level` / `member_number` sur un profil
  (avant/après, avec l'auteur du changement).

- **Migration 0002 et fonction `cloudinary-sign` appliquées/déployées**
  (2026-09-23) et vérifiées de bout en bout :
  - Trigger d'audit testé avec un vrai changement de statut (en_attente →
    valide) : ligne correctement créée dans `audit_logs` avec avant/après.
  - Upload de photo testé en conditions réelles depuis `/app/profil` :
    signature obtenue, upload Cloudinary réussi, `photo_url` mis à jour en
    base, photo affichée à la fois sur `/app/profil` et dans l'annuaire
    `/app/membres`.
  - **Bug trouvé et corrigé au passage** : la première version de la
    fonction bloquait silencieusement dans un vrai navigateur (CORS —
    aucun header `Access-Control-Allow-Origin` sur la réponse au preflight
    `OPTIONS`), invisible en testant seulement avec `curl` puisque `curl`
    n'applique pas les règles CORS des navigateurs. Corrigé, redéployé par
    l'utilisateur, revérifié avec succès.
  - Photo de test nettoyée du compte admin réel après vérification
    (`photo_url` remis à `null`) pour ne pas laisser de fausse photo sur le
    compte de production.

- **Carte de membre numérique** (2026-09-23) : dimensions exactes 5,5cm ×
  8,5cm (rendu en unités `cm` CSS pour une taille physique fidèle à
  l'écran comme à l'export), en-tête avec petit logo SAMBO, photo, rôle
  (fonction du bureau si assignée, sinon catégorie), numéro de membre, nom
  et prénoms, puis QR code occupant ~50% de la carte avec le logo SAMBO en
  petit au centre (`src/components/MembershipCardView.tsx`). Page
  `/app/carte` avec téléchargement PNG haute résolution (`html-to-image`,
  pixelRatio 3). QR encode une URL de vérification (`/verifier/:id`), pas
  les infos personnelles brutes.
  - `supabase/migrations/0003_membership_cards.sql` : trigger qui crée
    automatiquement la carte quand un profil passe à `valide`, la révoque
    quand il passe à `suspendu`/`refuse` ; vue publique
    `public.card_verification` (statut de la carte + numéro + catégorie
    uniquement — jamais le nom, la photo ou les coordonnées, conformément
    au cahier des charges : l'identité complète reste réservée à un accès
    authentifié) ; backfill pour les membres déjà validés avant cette
    migration.
  - Vérifié avec des données de test temporaires sur le compte admin
    (nom, numéro, carte — tout nettoyé après coup) : dimensions exactes au
    pixel près (207,86px × 321,25px @ 96dpi = 5,5cm × 8,5cm), mise en page
    conforme, QR généré correctement.
  - Bug trouvé et corrigé pendant le test : `Verify.tsx` traitait une
    vraie erreur de requête (ex. table pas encore créée) exactement comme
    un « carte introuvable », ce qui aurait caché un problème réel derrière
    un message trompeur — état d'erreur séparé ajouté.

À faire :
- Journal d'audit : la table logue déjà les changements, mais aucune page
  admin ne l'affiche encore pour consulter l'historique des décisions de
  validation/suspension.

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
