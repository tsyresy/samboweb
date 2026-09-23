-- Chat global + mur « Membres TSY NAHALOHA ADIDY »
--
-- 1. chat_messages : un seul salon partagé par tous les membres validés,
--    diffusé en temps réel (Supabase Realtime). La présence en ligne
--    (pastille verte/grise) passe par Realtime Presence côté client et ne
--    nécessite aucune table.
-- 2. unpaid_members : redéfinie pour refléter les impayés « jusqu'à la
--    date du jour » — chaque mois échu ayant un montant défini, depuis le
--    mois d'inscription du membre, compte comme impayé tant qu'il n'est
--    pas marqué payé / exempté / en attente (même convention que l'écran
--    admin, où une ligne absente s'affiche « Impayé »). Toujours jamais de
--    montant exposé : seulement le nombre de mois.
--
-- À exécuter dans Supabase Dashboard → SQL Editor → Run.

-- ============================================================
-- 1. Chat global
-- ============================================================

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  status text not null default 'visible' check (status in ('visible', 'hidden')),
  created_at timestamptz not null default now()
);

create index chat_messages_created_at_idx on public.chat_messages (created_at desc);

alter table public.chat_messages enable row level security;

create policy "chat_messages_select_validated"
  on public.chat_messages for select
  using (
    (status = 'visible' and public.is_validated_member())
    or author_id = public.current_profile_id()
    or public.is_admin()
  );

create policy "chat_messages_insert_own"
  on public.chat_messages for insert
  with check (author_id = public.current_profile_id() and public.is_validated_member());

-- Masquage (modération) réservé aux admins ; un membre peut supprimer
-- son propre message.
create policy "chat_messages_update_admin"
  on public.chat_messages for update
  using (public.is_admin());

create policy "chat_messages_delete_own_or_admin"
  on public.chat_messages for delete
  using (author_id = public.current_profile_id() or public.is_admin());

-- Diffusion temps réel (Realtime applique les policies SELECT ci-dessus
-- à chaque abonné). replica identity full : les événements UPDATE/DELETE
-- transportent la ligne complète.
alter table public.chat_messages replica identity full;
alter publication supabase_realtime add table public.chat_messages;

-- ============================================================
-- 2. Impayés jusqu'à la date du jour
-- ============================================================

create or replace view public.unpaid_members
as
with due_months as (
  -- Mois dont l'échéance est passée (échéance explicite, sinon le 1er du mois).
  select distinct r.year, r.month
  from public.dues_rules r
  where coalesce(r.due_date, make_date(r.year, r.month, 1)) <= current_date
),
owed as (
  select p.id as profile_id, dm.year, dm.month
  from public.profiles p
  cross join due_months dm
  where p.status = 'valide'
    and make_date(dm.year, dm.month, 1) >= date_trunc('month', p.created_at)::date
    -- La règle applicable (surcharge de catégorie, sinon règle globale)
    -- doit avoir un montant non nul.
    and coalesce(
      (select r.amount from public.dues_rules r
        where r.year = dm.year and r.month = dm.month and r.category = p.category),
      (select r.amount from public.dues_rules r
        where r.year = dm.year and r.month = dm.month and r.category is null),
      0
    ) > 0
    and not exists (
      select 1 from public.dues_records dr
      where dr.profile_id = p.id and dr.year = dm.year and dr.month = dm.month
        and dr.status <> 'impaye'
    )
)
select
  p.id,
  p.member_number,
  p.last_name,
  p.first_names,
  p.nickname,
  p.photo_url,
  p.category,
  count(*)::int as unpaid_months
from owed o
join public.profiles p on p.id = o.profile_id
where exists (
  select 1 from public.profiles me
  where me.user_id = auth.uid() and me.status = 'valide'
)
group by p.id, p.member_number, p.last_name, p.first_names, p.nickname, p.photo_url, p.category;

grant select on public.unpaid_members to authenticated;
