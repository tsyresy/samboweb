-- Graphique « fréquence des paiements » de /app/adidy
--
-- 1. payment_date n'était jamais renseignée (l'écran admin ne la saisissait
--    pas) : elle est désormais remplie automatiquement, à la date du jour à
--    Madagascar, quand une ligne passe à « payé » sans date. L'admin peut
--    toujours la corriger à la main. Rattrapage des paiements existants
--    avec la date de leur dernière modification.
-- 2. Vue payment_frequency : nombre de membres ayant payé, par mois de
--    cotisation et par jour de paiement. Uniquement des nombres — jamais de
--    nom ni de montant — et seulement pour les membres validés.
--
-- À exécuter dans Supabase Dashboard → SQL Editor → Run.

create or replace function public.set_dues_payment_date()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'paye' and new.payment_date is null then
    new.payment_date := (now() at time zone 'Indian/Antananarivo')::date;
  end if;
  return new;
end;
$$;

create trigger dues_records_set_payment_date
  before insert or update on public.dues_records
  for each row execute function public.set_dues_payment_date();

update public.dues_records
set payment_date = (updated_at at time zone 'Indian/Antananarivo')::date
where status = 'paye' and payment_date is null;

create or replace view public.payment_frequency
as
select
  dr.year,
  dr.month,
  dr.payment_date,
  count(*)::int as payers
from public.dues_records dr
join public.profiles p on p.id = dr.profile_id and p.status = 'valide'
where dr.status = 'paye'
  and dr.payment_date is not null
  and exists (
    select 1 from public.profiles me
    where me.user_id = auth.uid() and me.status = 'valide'
  )
group by dr.year, dr.month, dr.payment_date;

grant select on public.payment_frequency to authenticated;
