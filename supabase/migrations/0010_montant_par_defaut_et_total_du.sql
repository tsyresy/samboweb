-- Montant par défaut de 1 000 Ar / mois + total dû personnel
--
-- * Un mois sans règle de montant vaut désormais 1 000 Ar (au lieu de
--   « montant non défini »). Une règle explicite (y compris 0 = mois
--   gratuit) reste prioritaire.
-- * Le détail des mois impayés AVEC leurs montants est calculé par une
--   vue interne (schéma `private`, non exposé par l'API et sans droit pour
--   anon/authenticated). Deux vues publiques s'en servent :
--     - unpaid_members : le mur public — nombre de mois seulement, jamais
--       de montant (inchangé côté colonnes) ;
--     - my_unpaid_dues : les mois impayés et montants du membre connecté,
--       et de lui seul (tableau de bord perso).
-- * Même règle de mois dus que 0009 : année en cours de janvier au mois
--   actuel ; années précédentes = mois ayant une règle ou marqués impayés.
--   Un paiement partiel sur une ligne « impayé » est déduit du montant.
--
-- À exécuter dans Supabase Dashboard → SQL Editor → Run.

create or replace function public.default_dues_amount()
returns numeric
language sql
immutable
as $$ select 1000::numeric $$;

-- Schéma interne : jamais exposé par PostgREST (seul `public` l'est).
-- Les vues publiques ci-dessous lisent cette vue avec les droits de leur
-- propriétaire (postgres) ; les membres n'y ont aucun accès direct.
-- (Une fonction security definer à EXECUTE révoqué ne marcherait pas :
-- le droit d'exécuter une fonction appelée dans une vue est vérifié pour
-- l'utilisateur final, pas pour le propriétaire de la vue.)
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace view private.unpaid_dues_detail
as
  with candidate_months as (
    -- Mois dus par tous : année en cours (janvier → mois actuel) et mois
    -- des années précédentes ayant une règle de montant.
    select extract(year from current_date)::int as year, m as month
    from generate_series(1, extract(month from current_date)::int) as m
    union
    select r.year, r.month
    from public.dues_rules r
    where r.year < extract(year from current_date)
  ),
  owed_months as (
    select p.id as profile_id, cm.year, cm.month
    from public.profiles p
    cross join candidate_months cm
    where p.status = 'valide'
    union
    -- Mois explicitement marqués impayés : pour ce membre-là uniquement.
    select dr.profile_id, dr.year, dr.month
    from public.dues_records dr
    join public.profiles p on p.id = dr.profile_id
    where p.status = 'valide'
      and dr.status = 'impaye'
      and make_date(dr.year, dr.month, 1) <= current_date
  ),
  priced as (
    select
      om.profile_id,
      om.year,
      om.month,
      coalesce(
        (select r.amount from public.dues_rules r
          where r.year = om.year and r.month = om.month and r.category = p.category),
        (select r.amount from public.dues_rules r
          where r.year = om.year and r.month = om.month and r.category is null),
        public.default_dues_amount()
      ) as amount,
      coalesce(
        (select r.due_date from public.dues_rules r
          where r.year = om.year and r.month = om.month and r.category = p.category),
        (select r.due_date from public.dues_rules r
          where r.year = om.year and r.month = om.month and r.category is null),
        make_date(om.year, om.month, 1)
      ) as due_date,
      rec.id as record_id,
      rec.status,
      rec.amount_paid
    from owed_months om
    join public.profiles p on p.id = om.profile_id
    left join public.dues_records rec
      on rec.profile_id = om.profile_id and rec.year = om.year and rec.month = om.month
  )
  select profile_id, year, month, greatest(amount - coalesce(amount_paid, 0), 0) as amount_due
  from priced
  where status = 'impaye'
     or (record_id is null and amount > 0 and due_date <= current_date);

revoke all on private.unpaid_dues_detail from public, anon, authenticated;

create or replace view public.unpaid_members
as
select
  p.id,
  p.member_number,
  p.last_name,
  p.first_names,
  p.nickname,
  p.photo_url,
  p.category,
  count(*)::int as unpaid_months
from private.unpaid_dues_detail d
join public.profiles p on p.id = d.profile_id
where exists (
  select 1 from public.profiles me
  where me.user_id = auth.uid() and me.status = 'valide'
)
group by p.id, p.member_number, p.last_name, p.first_names, p.nickname, p.photo_url, p.category;

grant select on public.unpaid_members to authenticated;

create or replace view public.my_unpaid_dues
as
select d.year, d.month, d.amount_due
from private.unpaid_dues_detail d
where d.profile_id = public.current_profile_id();

grant select on public.my_unpaid_dues to authenticated;

-- Janvier 2026 a été « vidé » dans l'écran admin, ce qui l'enregistrait à
-- 0 Ar (mois gratuit) alors que l'intention était « pas de montant
-- particulier ». Le supprimer le fait retomber sur le montant par défaut.
delete from public.dues_rules
where year = 2026 and month = 1 and category is null and amount = 0;
