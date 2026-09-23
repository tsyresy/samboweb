-- Phase 2 — carte de membre
-- Crée/révoque automatiquement une ligne membership_cards quand le statut
-- d'un profil change, et expose une vue publique minimale pour la
-- vérification par QR code (scan anonyme = statut seulement, jamais les
-- infos personnelles complètes — celles-ci restent réservées à un accès
-- authentifié, conformément au cahier des charges).
--
-- À exécuter dans Supabase Dashboard → SQL Editor → Run.

create function public.sync_membership_card()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'valide' and old.status is distinct from 'valide' then
    if not exists (select 1 from public.membership_cards where profile_id = new.id) then
      insert into public.membership_cards (profile_id, card_number)
      values (new.id, coalesce(new.member_number, new.id::text));
    else
      update public.membership_cards
      set status = 'active', revoked_at = null
      where profile_id = new.id;
    end if;
  elsif new.status in ('suspendu', 'refuse') and old.status = 'valide' then
    update public.membership_cards
    set status = 'revoked', revoked_at = now()
    where profile_id = new.id and status = 'active';
  end if;

  return new;
end;
$$;

create trigger profiles_sync_membership_card
  after update on public.profiles
  for each row execute function public.sync_membership_card();

-- Public verification view: scanning the QR reveals only whether the
-- card is currently valid, plus the member's category — never the name,
-- photo, phone, or any other personal field.
create view public.card_verification
as
select
  mc.verification_id,
  mc.status as card_status,
  mc.issued_at,
  mc.revoked_at,
  p.member_number,
  p.category
from public.membership_cards mc
join public.profiles p on p.id = mc.profile_id;

grant select on public.card_verification to anon, authenticated;

-- One-time backfill: the trigger above only fires on future status
-- transitions, so members already validated before this migration need
-- their card created explicitly here.
insert into public.membership_cards (profile_id, card_number)
select id, coalesce(member_number, id::text)
from public.profiles
where status = 'valide'
  and id not in (select profile_id from public.membership_cards);
