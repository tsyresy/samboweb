-- Phase 3 — discussions internes
-- Fil réservé aux membres validés : publications, réponses, signalement
-- et modération (masquage par un admin, jamais de suppression forcée du
-- contenu d'autrui sans trace).
--
-- À exécuter dans Supabase Dashboard → SQL Editor → Run.

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 4000),
  status text not null default 'visible' check (status in ('visible', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  status text not null default 'visible' check (status in ('visible', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_table text not null check (target_table in ('posts', 'comments')),
  target_id uuid not null,
  reason text not null check (char_length(reason) between 1 and 500),
  status text not null default 'nouveau' check (status in ('nouveau', 'traite')),
  created_at timestamptz not null default now()
);

create index posts_created_at_idx on public.posts (created_at desc);
create index comments_post_idx on public.comments (post_id, created_at);
create index content_reports_status_idx on public.content_reports (status);

create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

create trigger comments_set_updated_at
  before update on public.comments
  for each row execute function public.set_updated_at();

-- The spec reserves discussions for *validated* members specifically —
-- current_profile_id() alone would also admit a still-pending applicant
-- (any signed-up user has a profile row, just not status = 'valide').
create function public.is_validated_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid() and status = 'valide'
  );
$$;

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.content_reports enable row level security;

-- posts: validated members see visible posts (+ admins see everything,
-- including hidden, for moderation); only the author or an admin can
-- update/delete; any validated member can post as themselves.
create policy "posts_select_visible_or_admin"
  on public.posts for select
  using (
    (status = 'visible' and public.is_validated_member())
    or author_id = public.current_profile_id()
    or public.is_admin()
  );

create policy "posts_insert_own"
  on public.posts for insert
  with check (author_id = public.current_profile_id() and public.is_validated_member());

create policy "posts_update_own_or_admin"
  on public.posts for update
  using (author_id = public.current_profile_id() or public.is_admin());

create policy "posts_delete_own_or_admin"
  on public.posts for delete
  using (author_id = public.current_profile_id() or public.is_admin());

-- comments: same shape as posts.
create policy "comments_select_visible_or_admin"
  on public.comments for select
  using (
    (status = 'visible' and public.is_validated_member())
    or author_id = public.current_profile_id()
    or public.is_admin()
  );

create policy "comments_insert_own"
  on public.comments for insert
  with check (author_id = public.current_profile_id() and public.is_validated_member());

create policy "comments_update_own_or_admin"
  on public.comments for update
  using (author_id = public.current_profile_id() or public.is_admin());

create policy "comments_delete_own_or_admin"
  on public.comments for delete
  using (author_id = public.current_profile_id() or public.is_admin());

-- content_reports: any validated member can file one; only admins read
-- and process them.
create policy "content_reports_insert_own"
  on public.content_reports for insert
  with check (reporter_id = public.current_profile_id() and public.is_validated_member());

create policy "content_reports_select_admin"
  on public.content_reports for select
  using (public.is_admin());

create policy "content_reports_update_admin"
  on public.content_reports for update
  using (public.is_admin());
