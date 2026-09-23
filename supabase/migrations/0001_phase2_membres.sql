-- Phase 2 — Membres
-- Profils, statut d'adhésion, rôles/droits, fonctions du bureau, carte de
-- membre, demandes de contact, journal d'administration.
--
-- À exécuter dans Supabase Dashboard → SQL Editor → Run (ou via
-- `supabase db push` si le CLI est lié au bon projet).

-- ============================================================
-- Types
-- ============================================================

create type public.membership_category_t as enum (
  'membre_standard',
  'membre_bureau',
  'sojabe',
  'partenaire',
  'sponsor'
);

create type public.validation_status_t as enum (
  'en_attente',
  'valide',
  'refuse',
  'suspendu'
);

create type public.access_level_t as enum (
  'membre',
  'responsable',
  'administrateur'
);

-- ============================================================
-- Tables
-- ============================================================

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,

  member_number text unique,

  last_name text,
  first_names text,
  nickname text,
  birth_date date,

  phone text,
  phone_secondary text,
  email text,

  residence text,

  still_studying boolean not null default true,
  faculty text,
  program text,
  study_level text,
  student_id text,

  photo_url text,

  category public.membership_category_t not null default 'membre_standard',
  status public.validation_status_t not null default 'en_attente',
  access_level public.access_level_t not null default 'membre',

  show_phone_in_directory boolean not null default false,
  show_email_in_directory boolean not null default false,

  consent_accepted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  contact_name text not null,
  contact_phone text not null,
  created_at timestamptz not null default now()
);

create table public.office_positions (
  id uuid primary key default gen_random_uuid(),
  title text not null unique,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.position_assignments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  position_id uuid not null references public.office_positions (id) on delete restrict,
  start_date date not null default current_date,
  end_date date,
  created_at timestamptz not null default now()
);

create table public.membership_cards (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  card_number text not null unique,
  verification_id uuid not null unique default gen_random_uuid(),
  status text not null default 'active' check (status in ('active', 'revoked')),
  issued_at timestamptz not null default now(),
  revoked_at timestamptz
);

create table public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  request_type text not null,
  message text not null,
  status text not null default 'nouveau' check (status in ('nouveau', 'traite')),
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users (id) on delete set null,
  action text not null,
  target_table text,
  target_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index profiles_status_idx on public.profiles (status);
create index profiles_category_idx on public.profiles (category);
create index position_assignments_profile_idx on public.position_assignments (profile_id);
create index position_assignments_current_idx on public.position_assignments (position_id) where end_date is null;

-- ============================================================
-- Helper functions (security definer to avoid RLS recursion)
-- ============================================================

create function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.profiles where user_id = auth.uid();
$$;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid() and access_level = 'administrateur'
  );
$$;

-- ============================================================
-- updated_at maintenance
-- ============================================================

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ============================================================
-- Prevent members from escalating their own status/role
-- ============================================================

create function public.protect_profile_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- service_role (the secret API key) is used for admin bootstrap and
  -- server-side operations (edge functions) and must not be clamped here;
  -- RLS itself already doesn't apply to it, but BEFORE UPDATE triggers
  -- fire regardless of RLS, so it needs its own explicit bypass.
  if public.is_admin() or auth.role() = 'service_role' then
    return new;
  end if;

  new.status := old.status;
  new.access_level := old.access_level;
  new.category := old.category;
  new.member_number := old.member_number;
  return new;
end;
$$;

create trigger profiles_protect_privileged_fields
  before update on public.profiles
  for each row execute function public.protect_profile_privileged_fields();

-- ============================================================
-- Auto-create a profile row when someone signs up
-- (reads the metadata passed to supabase.auth.signUp from the
-- registration form — see src/pages/Register.tsx)
-- ============================================================

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_profile_id uuid;
begin
  insert into public.profiles (
    user_id, last_name, first_names, nickname, birth_date,
    phone, phone_secondary, email, residence,
    still_studying, faculty, program, study_level, student_id,
    category
  ) values (
    new.id,
    meta ->> 'last_name',
    meta ->> 'first_names',
    meta ->> 'nickname',
    nullif(meta ->> 'birth_date', '')::date,
    meta ->> 'phone',
    meta ->> 'phone_secondary',
    new.email,
    meta ->> 'residence',
    coalesce((meta ->> 'still_studying')::boolean, true),
    meta ->> 'faculty',
    meta ->> 'program',
    meta ->> 'study_level',
    meta ->> 'student_id',
    coalesce((meta ->> 'category')::public.membership_category_t, 'membre_standard')
  )
  returning id into v_profile_id;

  if (meta ->> 'emergency_contact_name') is not null then
    insert into public.emergency_contacts (profile_id, contact_name, contact_phone)
    values (
      v_profile_id,
      meta ->> 'emergency_contact_name',
      meta ->> 'emergency_contact_phone'
    );
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles enable row level security;
alter table public.emergency_contacts enable row level security;
alter table public.office_positions enable row level security;
alter table public.position_assignments enable row level security;
alter table public.membership_cards enable row level security;
alter table public.contact_requests enable row level security;
alter table public.audit_logs enable row level security;

-- profiles: self can read/update own row, admins can read/update all
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (user_id = auth.uid() or public.is_admin());

create policy "profiles_update_own_or_admin"
  on public.profiles for update
  using (user_id = auth.uid() or public.is_admin());

create policy "profiles_insert_admin_only"
  on public.profiles for insert
  with check (public.is_admin());

-- emergency_contacts: owner or admin only
create policy "emergency_contacts_owner_or_admin"
  on public.emergency_contacts for all
  using (
    profile_id = public.current_profile_id() or public.is_admin()
  )
  with check (
    profile_id = public.current_profile_id() or public.is_admin()
  );

-- office_positions: readable by anyone (public "équipe" section), admin-managed
create policy "office_positions_select_all"
  on public.office_positions for select
  using (true);

create policy "office_positions_admin_write"
  on public.office_positions for insert
  with check (public.is_admin());

create policy "office_positions_admin_update"
  on public.office_positions for update
  using (public.is_admin());

create policy "office_positions_admin_delete"
  on public.office_positions for delete
  using (public.is_admin());

-- position_assignments: readable by anyone, admin-managed
create policy "position_assignments_select_all"
  on public.position_assignments for select
  using (true);

create policy "position_assignments_admin_write"
  on public.position_assignments for insert
  with check (public.is_admin());

create policy "position_assignments_admin_update"
  on public.position_assignments for update
  using (public.is_admin());

create policy "position_assignments_admin_delete"
  on public.position_assignments for delete
  using (public.is_admin());

-- membership_cards: owner can read own, admin manages
create policy "membership_cards_select_own_or_admin"
  on public.membership_cards for select
  using (profile_id = public.current_profile_id() or public.is_admin());

create policy "membership_cards_admin_write"
  on public.membership_cards for insert
  with check (public.is_admin());

create policy "membership_cards_admin_update"
  on public.membership_cards for update
  using (public.is_admin());

-- contact_requests: anyone can submit, only admins can read/manage
create policy "contact_requests_insert_anyone"
  on public.contact_requests for insert
  to anon, authenticated
  with check (true);

create policy "contact_requests_select_admin"
  on public.contact_requests for select
  using (public.is_admin());

create policy "contact_requests_update_admin"
  on public.contact_requests for update
  using (public.is_admin());

-- audit_logs: admin read-only via API (writes happen through
-- security-definer functions / edge functions using the service role,
-- which bypasses RLS)
create policy "audit_logs_select_admin"
  on public.audit_logs for select
  using (public.is_admin());

-- ============================================================
-- Public-safe views
-- ============================================================

-- Internal directory (members only). Deliberately NOT security_invoker:
-- the view runs as its owner (postgres, which bypasses RLS), so it can
-- expose a safe subset of columns for every validated member without
-- granting direct multi-row SELECT on the `profiles` table itself —
-- direct queries to /rest/v1/profiles stay restricted to "own row or
-- admin" by the policies above.
create view public.directory_profiles
as
select
  id,
  member_number,
  last_name,
  first_names,
  nickname,
  category,
  photo_url,
  case when show_phone_in_directory then phone else null end as phone,
  case when show_email_in_directory then email else null end as email
from public.profiles
where status = 'valide';

-- Public office team (visible to visitors on the public site).
-- Same reasoning as above: not security_invoker, so anonymous visitors
-- can see the current bureau without any RLS grant on `profiles`.
create view public.public_office_team
as
select
  p.id as profile_id,
  p.last_name,
  p.first_names,
  p.nickname,
  p.photo_url,
  op.title as position_title,
  pa.start_date
from public.position_assignments pa
join public.profiles p on p.id = pa.profile_id
join public.office_positions op on op.id = pa.position_id
where pa.end_date is null and p.status = 'valide';

grant select on public.directory_profiles to authenticated;
grant select on public.public_office_team to anon, authenticated;

-- ============================================================
-- Seed default office positions
-- ============================================================

insert into public.office_positions (title, is_default) values
  ('Président', true),
  ('Secrétaire', true),
  ('Trésorier', true),
  ('Responsable logistique', true);
