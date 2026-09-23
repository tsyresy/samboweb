-- Impayés : calcul depuis janvier de l'année en cours + années précédentes
--
-- La version 0008 ne comptait qu'à partir du mois d'inscription du membre
-- sur le site. Or les comptes ont tous été créés récemment alors que
-- l'adhésion (et donc l'adidy) court depuis bien avant : tout le monde
-- apparaissait avec « 1 mois impayé ».
--
-- Nouvelle règle :
--   * année en cours : chaque mois de janvier jusqu'au mois actuel est dû,
--     sauf si la règle applicable fixe explicitement un montant de 0 ;
--   * années précédentes : chaque mois ayant une règle de montant > 0,
--     plus tout mois explicitement marqué « impayé » ;
--   * un mois n'est pas compté s'il est marqué payé / exempté / en attente.
-- Une échéance (due_date) postérieure à aujourd'hui repousse le mois.
--
-- À exécuter dans Supabase Dashboard → SQL Editor → Run.

create or replace view public.unpaid_members
as
with candidate_months as (
  -- Année en cours : janvier → mois actuel.
  select extract(year from current_date)::int as year, m as month
  from generate_series(1, extract(month from current_date)::int) as m
  union
  -- Années précédentes : mois ayant une règle de montant.
  select r.year, r.month
  from public.dues_rules r
  where r.year < extract(year from current_date)
  union
  -- Mois explicitement marqués impayés (toutes années passées ou en cours).
  select dr.year, dr.month
  from public.dues_records dr
  where dr.status = 'impaye'
    and make_date(dr.year, dr.month, 1) <= current_date
),
owed as (
  select p.id as profile_id, cm.year, cm.month
  from public.profiles p
  cross join candidate_months cm
  cross join lateral (
    -- Règle applicable : surcharge de catégorie, sinon règle globale.
    select coalesce(
      (select r from public.dues_rules r
        where r.year = cm.year and r.month = cm.month and r.category = p.category),
      (select r from public.dues_rules r
        where r.year = cm.year and r.month = cm.month and r.category is null)
    ) as rule
  ) applicable
  left join public.dues_records rec
    on rec.profile_id = p.id and rec.year = cm.year and rec.month = cm.month
  where p.status = 'valide'
    and (rec.id is null or rec.status = 'impaye')
    and (
      rec.status = 'impaye'
      or (
        -- Pas de ligne : dû selon la règle du mois (ou, pour l'année en
        -- cours, dû par défaut quand aucun montant n'est encore défini).
        coalesce((applicable.rule).amount, case when cm.year = extract(year from current_date) then 1 else 0 end) > 0
        and coalesce((applicable.rule).due_date, make_date(cm.year, cm.month, 1)) <= current_date
      )
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
