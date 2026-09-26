-- Fiche complète d'un membre, lue en scannant le QR de sa carte
--
-- Le QR de la carte ne contient plus d'adresse web : il porte
-- « sambo://membre/<verification_id> », que la future application reconnaît.
-- L'application (ou la page /app/membre/:id du site) appelle ensuite cette
-- fonction pour afficher toutes les informations personnelles du membre.
--
-- Réservé aux membres validés et connectés : un scan par quelqu'un d'autre
-- ne donne rien, et les informations ne sont jamais écrites en clair dans
-- le QR (une photo de la carte ne suffit donc pas à les lire).
--
-- À exécuter dans Supabase Dashboard → SQL Editor → Run.

create function public.member_card_details(p_verification_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if not public.is_validated_member() then
    raise exception 'Réservé aux membres validés.' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'card_status', mc.status,
    'issued_at', mc.issued_at,
    'revoked_at', mc.revoked_at,
    'member_number', p.member_number,
    'last_name', p.last_name,
    'first_names', p.first_names,
    'nickname', p.nickname,
    'birth_date', p.birth_date,
    'cin_number', p.cin_number,
    'phone', p.phone,
    'phone_secondary', p.phone_secondary,
    'email', p.email,
    'residence', p.residence,
    'still_studying', p.still_studying,
    'faculty', p.faculty,
    'program', p.program,
    'study_level', p.study_level,
    'student_id', p.student_id,
    'photo_url', p.photo_url,
    'category', p.category,
    'status', p.status,
    'position', (
      select op.title
      from public.position_assignments pa
      join public.office_positions op on op.id = pa.position_id
      where pa.profile_id = p.id and pa.end_date is null
      order by pa.start_date desc
      limit 1
    ),
    'emergency_contact_name', ec.contact_name,
    'emergency_contact_phone', ec.contact_phone
  )
  into result
  from public.membership_cards mc
  join public.profiles p on p.id = mc.profile_id
  left join public.emergency_contacts ec on ec.profile_id = p.id
  where mc.verification_id = p_verification_id;

  return result;
end;
$$;

revoke execute on function public.member_card_details(uuid) from public, anon;
grant execute on function public.member_card_details(uuid) to authenticated;
