-- Le numéro de téléphone est désormais toujours visible dans l'annuaire
-- (plus besoin de cocher manuellement "Afficher mon téléphone" depuis le
-- profil) ; l'email reste optionnel, au choix du membre.
--
-- À exécuter dans Supabase Dashboard → SQL Editor → Run.

create or replace view public.directory_profiles
as
select
  id,
  member_number,
  last_name,
  first_names,
  nickname,
  category,
  photo_url,
  phone,
  case when show_email_in_directory then email else null end as email
from public.profiles
where status = 'valide';
