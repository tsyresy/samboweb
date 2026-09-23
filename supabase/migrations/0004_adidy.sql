-- Phase 4 — adidy (cotisations mensuelles)
-- Règles de montant par mois, suivi des paiements par membre (enregistrés
-- manuellement par un admin/trésorier — le paiement lui-même se fait en
-- interne, jamais sur le site), et une vue "impayés" visible par tous les
-- membres validés (noms/photos seulement, jamais les montants).
--
-- À exécuter dans Supabase Dashboard → SQL Editor → Run.

create type public.dues_status_t as enum ('paye', 'impaye', 'exempte', 'en_attente');

create table public.dues_rules (
  id uuid primary key default gen_random_uuid(),
  year int not null,
  month int not null check (month between 1 and 12),
  category public.membership_category_t,
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'Ar',
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One rule per (year, month) that applies to everyone (category is null),
-- plus at most one override per (year, month, category).
create unique index dues_rules_global_unique on public.dues_rules (year, month) where category is null;
create unique index dues_rules_category_unique on public.dues_rules (year, month, category) where category is not null;

create table public.dues_records (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  rule_id uuid references public.dues_rules (id) on delete set null,
  year int not null,
  month int not null check (month between 1 and 12),
  status public.dues_status_t not null default 'impaye',
  amount_paid numeric(12, 2),
  payment_date date,
  payment_method text,
  reference text,
  note text,
  confirmed_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, year, month)
);

create index dues_records_period_idx on public.dues_records (year, month);
create index dues_records_status_idx on public.dues_records (status);

create trigger dues_rules_set_updated_at
  before update on public.dues_rules
  for each row execute function public.set_updated_at();

create trigger dues_records_set_updated_at
  before update on public.dues_records
  for each row execute function public.set_updated_at();

-- Same audit pattern as profiles: log every change to a dues_records row
-- (status, amount, method, reference) so corrections keep a trace of the
-- previous state, as required by the spec.
create function public.log_dues_record_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  changes jsonb := '{}'::jsonb;
begin
  if new.status is distinct from old.status then
    changes := changes || jsonb_build_object('status', jsonb_build_object('from', old.status, 'to', new.status));
  end if;
  if new.amount_paid is distinct from old.amount_paid then
    changes := changes || jsonb_build_object('amount_paid', jsonb_build_object('from', old.amount_paid, 'to', new.amount_paid));
  end if;
  if new.payment_method is distinct from old.payment_method then
    changes := changes || jsonb_build_object('payment_method', jsonb_build_object('from', old.payment_method, 'to', new.payment_method));
  end if;
  if new.reference is distinct from old.reference then
    changes := changes || jsonb_build_object('reference', jsonb_build_object('from', old.reference, 'to', new.reference));
  end if;

  if changes <> '{}'::jsonb then
    insert into public.audit_logs (actor_user_id, action, target_table, target_id, metadata)
    values (auth.uid(), 'dues_record_updated', 'dues_records', new.id, changes);
  end if;

  return new;
end;
$$;

create trigger dues_records_log_changes
  after update on public.dues_records
  for each row execute function public.log_dues_record_changes();

-- Helper mirroring is_admin(), for the trésorier / responsable financier
-- role. Must exist before the policies below, which reference it.
create function public.is_responsable()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid() and access_level in ('responsable', 'administrateur')
  );
$$;

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.dues_rules enable row level security;
alter table public.dues_records enable row level security;

-- dues_rules: every authenticated member can read the amounts (needed to
-- show "combien je dois ce mois-ci"); only admins/responsables manage them.
create policy "dues_rules_select_authenticated"
  on public.dues_rules for select
  to authenticated
  using (true);

create policy "dues_rules_write_admin_or_responsable"
  on public.dues_rules for insert
  with check (public.is_admin() or public.is_responsable());

create policy "dues_rules_update_admin_or_responsable"
  on public.dues_rules for update
  using (public.is_admin() or public.is_responsable());

create policy "dues_rules_delete_admin_or_responsable"
  on public.dues_rules for delete
  using (public.is_admin() or public.is_responsable());

-- dues_records: a member sees only their own records by default, per
-- spec; admins/responsables see and manage everyone's.
create policy "dues_records_select_own_or_staff"
  on public.dues_records for select
  using (
    profile_id = public.current_profile_id()
    or public.is_admin()
    or public.is_responsable()
  );

create policy "dues_records_write_staff"
  on public.dues_records for insert
  with check (public.is_admin() or public.is_responsable());

create policy "dues_records_update_staff"
  on public.dues_records for update
  using (public.is_admin() or public.is_responsable());

-- ============================================================
-- "Impayés" — visible to every validated member (names/photos only,
-- never amounts, notes, or payment details).
-- ============================================================

create view public.unpaid_members
as
select distinct
  p.id,
  p.member_number,
  p.last_name,
  p.first_names,
  p.nickname,
  p.photo_url,
  p.category
from public.dues_records dr
join public.profiles p on p.id = dr.profile_id
where dr.status = 'impaye'
  and p.status = 'valide'
  and exists (
    select 1 from public.profiles me
    where me.user_id = auth.uid() and me.status = 'valide'
  );

grant select on public.unpaid_members to authenticated;
